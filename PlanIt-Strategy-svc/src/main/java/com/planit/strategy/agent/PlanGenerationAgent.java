package com.planit.strategy.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planit.strategy.agent.prompt.PlanGenerationPrompt;
import com.planit.strategy.domain.plan.dto.PlanItem;
import com.planit.strategy.domain.plan.dto.PlanRequest;
import com.planit.strategy.domain.plan.dto.TaskDto;
import com.planit.strategy.domain.plan.dto.WeekGoalDto;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import com.planit.strategy.infrastructure.llm.LlmClient;
import com.planit.strategy.infrastructure.llm.LlmException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlanGenerationAgent implements StrategyAgent<PlanRequest, List<PlanItem>> {
    private final LlmClient llmClient;
    private final PlanGenerationPrompt promptBuilder;
    private final ObjectMapper objectMapper;
    private final CategoryRepository categoryRepository;
    private static final int MAX_RETRIES = 1;
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");
    
    // 마지막 LLM 응답 JSON 저장 (week_goals 추출용)
    private String lastLlmJsonResponse;

    @Override
    public List<PlanItem> execute(PlanRequest input) throws AgentExecutionException {
        // DB에서 카테고리 목록 조회
        List<String> categories = categoryRepository.findByDeletedAtIsNull().stream()
                .map(category -> category.getName())
                .toList();
        return execute(input, categories);
    }

    public List<PlanItem> execute(PlanRequest input, List<String> categories) throws AgentExecutionException {
        try {
            input.validate();
            
            String systemPrompt = promptBuilder.buildSystemPrompt();
            String userPrompt = promptBuilder.buildUserPrompt(input, categories);
            
            log.info("Plan Generation 시작 - Goal: {}, Period: {} ~ {}", 
                    input.getGoalText(), input.getStartDate(), input.getEndDate());
            
            String response = llmClient.generate(systemPrompt, userPrompt);
            
            return parseJsonResponse(response, systemPrompt, userPrompt);
        } catch (AgentExecutionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Plan Generation 실패", e);
            throw new AgentExecutionException("Plan Generation 실패: " + e.getMessage(), e);
        }
    }

    private List<PlanItem> parseJsonResponse(String response, String systemPrompt, String userPrompt) 
            throws AgentExecutionException {
        try {
            String jsonStr = extractJson(response);
            this.lastLlmJsonResponse = jsonStr;  // 원본 JSON 저장
            return extractPlanItemsFromResponse(jsonStr);
        } catch (Exception e) {
            log.warn("JSON 파싱 실패, 재요청 시도 - Error: {}", e.getMessage());
            return retryWithJsonOnlyPrompt(systemPrompt, userPrompt);
        }
    }

    private List<PlanItem> retryWithJsonOnlyPrompt(String systemPrompt, String userPrompt) 
            throws AgentExecutionException {
        try {
            String retryPrompt = userPrompt + "\n\nJSON만 다시 출력하라. 다른 텍스트는 절대 포함하지 마.";
            String retryResponse = llmClient.generate(systemPrompt, retryPrompt);
            
            String jsonStr = extractJson(retryResponse);
            this.lastLlmJsonResponse = jsonStr;  // 원본 JSON 저장
            return extractPlanItemsFromResponse(jsonStr);
        } catch (Exception e) {
            log.error("재요청 후에도 JSON 파싱 실패", e);
            throw new AgentExecutionException("JSON 파싱 실패 (재요청 후): " + e.getMessage(), e);
        }
    }

    /**
     * 응답에서 JSON 객체 추출
     */
    private String extractJson(String response) throws Exception {
        String trimmed = response.trim();
        
        // JSON 객체 시작 위치 찾기
        int startIdx = trimmed.indexOf('{');
        if (startIdx == -1) {
            throw new Exception("JSON 객체를 찾을 수 없습니다.");
        }
        
        // JSON 객체 끝 위치 찾기 (마지막 }부터 역순 검색)
        int endIdx = trimmed.lastIndexOf('}');
        if (endIdx == -1 || endIdx <= startIdx) {
            throw new Exception("유효한 JSON 객체가 아닙니다.");
        }
        
        return trimmed.substring(startIdx, endIdx + 1);
    }

    /**
     * 응답 JSON에서 PlanItem 리스트 추출
     * 새로운 구조: { category_name, goal: { title, start_date, end_date, week_goals } }
     */
    private List<PlanItem> extractPlanItemsFromResponse(String jsonStr) throws Exception {
        JsonNode root = objectMapper.readTree(jsonStr);
        List<PlanItem> planItems = new ArrayList<>();
        
        // goal.week_goals 배열 추출
        JsonNode goal = root.get("goal");
        if (goal == null) {
            throw new Exception("goal 필드가 없습니다.");
        }
        
        JsonNode weekGoals = goal.get("week_goals");
        if (weekGoals == null || !weekGoals.isArray()) {
            throw new Exception("week_goals 배열이 없습니다.");
        }
        
        // 각 주차의 tasks 추출
        for (JsonNode weekGoal : weekGoals) {
            JsonNode tasks = weekGoal.get("tasks");
            if (tasks != null && tasks.isArray()) {
                for (JsonNode task : tasks) {
                    String content = task.get("content").asText();
                    String targetDateStr = task.get("target_date").asText();
                    
                    // ISO-8601 형식의 날짜를 LocalDate로 변환
                    LocalDate date = LocalDate.parse(targetDateStr, ISO_FORMATTER);
                    
                    PlanItem item = PlanItem.builder()
                            .date(date)
                            .title(content)
                            .description("")  // 새 구조에서는 description 없음
                            .build();
                    
                    planItems.add(item);
                }
            }
        }
        
        if (planItems.isEmpty()) {
            throw new Exception("추출된 PlanItem이 없습니다.");
        }
        
        return planItems;
    }

    /**
     * LLM 응답에서 week_goals 정보 추출
     */
    public List<WeekGoalDto> extractWeekGoalsFromResponse(String jsonStr) throws Exception {
        JsonNode root = objectMapper.readTree(jsonStr);
        List<WeekGoalDto> weekGoals = new ArrayList<>();
        
        // goal.week_goals 배열 추출
        JsonNode goal = root.get("goal");
        if (goal == null) {
            throw new Exception("goal 필드가 없습니다.");
        }
        
        JsonNode weekGoalsNode = goal.get("week_goals");
        if (weekGoalsNode == null || !weekGoalsNode.isArray()) {
            throw new Exception("week_goals 배열이 없습니다.");
        }
        
        // 각 주차 정보 추출
        for (JsonNode weekGoalNode : weekGoalsNode) {
            String title = weekGoalNode.get("title").asText();
            List<TaskDto> tasks = new ArrayList<>();
            
            JsonNode tasksNode = weekGoalNode.get("tasks");
            if (tasksNode != null && tasksNode.isArray()) {
                for (JsonNode taskNode : tasksNode) {
                    String content = taskNode.get("content").asText();
                    String targetDateStr = taskNode.get("target_date").asText();
                    
                    LocalDate date = LocalDate.parse(targetDateStr, ISO_FORMATTER);
                    
                    TaskDto task = TaskDto.builder()
                            .content(content)
                            .targetDate(convertToDateTime(date))
                            .build();
                    
                    tasks.add(task);
                }
            }
            
            WeekGoalDto weekGoal = WeekGoalDto.builder()
                    .title(title)
                    .tasks(tasks)
                    .build();
            
            weekGoals.add(weekGoal);
        }
        
        return weekGoals;
    }

    /**
     * LocalDate를 그대로 반환 (날짜만 필요)
     */
    private LocalDate convertToDateTime(LocalDate date) {
        return date;
    }

    /**
     * LLM 응답에서 category_name 추출
     */
    public String extractCategoryNameFromResponse(String jsonStr) throws Exception {
        JsonNode root = objectMapper.readTree(jsonStr);
        
        JsonNode categoryNode = root.get("category_name");
        if (categoryNode == null) {
            log.warn("category_name 필드가 없음, 기본값 사용");
            return null;
        }
        
        return categoryNode.asText();
    }

    /**
     * 마지막 LLM 응답 JSON 반환
     */
    public String getLastLlmJsonResponse() {
        return lastLlmJsonResponse;
    }
}
