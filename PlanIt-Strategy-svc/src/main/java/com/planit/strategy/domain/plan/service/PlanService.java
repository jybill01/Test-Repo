package com.planit.strategy.domain.plan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planit.strategy.agent.AgentExecutionException;
import com.planit.strategy.agent.PlanGenerationAgent;
import com.planit.strategy.common.CustomException;
import com.planit.strategy.common.ErrorCode;
import com.planit.strategy.domain.plan.dto.*;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor 
public class PlanService {
    private final PlanGenerationAgent planGenerationAgent;
    private final ObjectMapper objectMapper;
    private final CategoryRepository categoryRepository;
    private final com.planit.strategy.grpc.client.ScheduleGrpcClient scheduleGrpcClient;
    private final com.planit.strategy.grpc.mapper.PlanProtoMapper planProtoMapper;
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    /**
     * 실행 계획 생성
     * @param request 계획 생성 요청
     * @return 최종 응답 DTO
     */
    public PlanResponse generatePlan(PlanRequest request) {
        try {
            log.info("실행 계획 생성 요청 - Goal: {}, Period: {} ~ {}", 
                    request.getGoalText(), request.getStartDate(), request.getEndDate());
            
            // 1. DB에서 카테고리 목록 조회
            List<String> categories = getAvailableCategories();
            
            // 2. Agent 실행 - LLM이 이미 week_goals 구조로 반환
            List<PlanItem> planItems = planGenerationAgent.execute(request, categories);
            log.info("실행 계획 생성 완료 - 총 {}개 항목", planItems.size());
            
            // 3. LLM 응답에서 week_goals 추출하여 응답 구조로 변환
            String llmJsonResponse = planGenerationAgent.getLastLlmJsonResponse();
            PlanResponse response = transformWithWeekGoals(
                request.getGoalText(),
                request.getStartDate(),
                request.getEndDate(),
                llmJsonResponse
            );
            
            log.info("최종 응답 생성 완료");
            return response;
        } catch (AgentExecutionException e) {
            log.error("실행 계획 생성 실패", e);
            throw new CustomException(ErrorCode.AI5001);
        }
    }

    /**
     * 계획 저장 (AI 호출 없음, gRPC만 호출)
     * 프론트에서 /generate로 받은 PlanResponse를 Schedule Service에 저장
     * 
     * @param userId 사용자 ID
     * @param planResponse /generate API에서 받은 계획 데이터
     * @return 생성된 Goal ID
     */
    public Long savePlan(String userId, PlanResponse planResponse) {
        try {
            log.info("계획 저장 요청 - UserId: {}, Goal: {}", userId, planResponse.getGoal().getTitle());
            log.info("[Service] savePlan input categoryName = {}", planResponse.getCategoryName());
            
            // 1. PlanResponse를 AiPlanResponse로 변환
            AiPlanResponse aiPlanResponse = AiPlanResponse.builder()
                    .categoryName(planResponse.getCategoryName())
                    .goal(planResponse.getGoal())
                    .build();
            
            log.info("[Service] AiPlanResponse reconstructed categoryName = {}", aiPlanResponse.getCategoryName());
            
            // 2. gRPC proto 객체로 변환
            com.planit.grpc.schedule.CreatePlanRequest grpcRequest = 
                    planProtoMapper.toCreatePlanRequest(userId, aiPlanResponse);
            
            log.info("[Service] CreatePlanRequest.categoryName = {}", grpcRequest.getCategoryName());
            
            // 3. Schedule Service에 gRPC 호출
            Long goalId = scheduleGrpcClient.createPlan(grpcRequest);
            log.info("Schedule Service에 계획 저장 완료 - GoalId: {}", goalId);
            
            return goalId;
        } catch (Exception e) {
            log.error("계획 저장 실패", e);
            throw new CustomException(ErrorCode.C5001);
        }
    }

    /**
     * DB에서 사용 가능한 카테고리 목록 조회
     */
    private List<String> getAvailableCategories() {
        return categoryRepository.findByDeletedAtIsNull().stream()
                .map(category -> category.getName())
                .toList();
    }

    /**
     * PlanItem 리스트를 PlanResponse로 변환
     * LLM이 이미 week_goals 구조를 반환하므로 단순 변환만 수행
     */
    private PlanResponse transformToPlanResponse(
            String goalText,
            LocalDate startDate,
            LocalDate endDate,
            List<PlanItem> planItems) {
        
        // PlanItem을 TaskDto로 변환
        List<TaskDto> tasks = planItems.stream()
                .map(item -> TaskDto.builder()
                        .content(item.getTitle())
                        .targetDate(convertToDateTime(item.getDate()))
                        .build())
                .toList();
        
        // 단일 주차로 구성 (LLM이 이미 주차별 구조를 반환했으므로)
        WeekGoalDto weekGoal = WeekGoalDto.builder()
                .title("전체 계획")
                .tasks(tasks)
                .build();
        
        // GoalDto 생성
        GoalDto goalDto = GoalDto.builder()
                .title(goalText)
                .startDate(convertToDateTime(startDate))
                .endDate(convertToDateTime(endDate))
                .weekGoals(List.of(weekGoal))
                .build();
        
        // 기본 카테고리 조회
        String defaultCategory = categoryRepository.findByDeletedAtIsNull().stream()
                .filter(category -> "기타".equals(category.getName()))
                .findFirst()
                .map(category -> category.getName())
                .orElse("기타");
        
        // PlanResponse 생성
        return PlanResponse.builder()
                .categoryName(defaultCategory)
                .goal(goalDto)
                .build();
    }

    /**
     * LLM 응답 JSON에서 week_goals 추출하여 PlanResponse 생성
     * Agent가 반환한 원본 JSON 응답을 받아 week_goals 구조를 직접 사용
     */
    public PlanResponse transformWithWeekGoals(
            String goalText,
            LocalDate startDate,
            LocalDate endDate,
            String llmJsonResponse) {
        try {
            log.info("week_goals 추출 시작");
            if (llmJsonResponse == null || llmJsonResponse.isEmpty()) {
                log.warn("LLM JSON 응답이 비어있음, 기본 구조로 변환");
                return transformToPlanResponse(goalText, startDate, endDate, new ArrayList<>());
            }
            
            log.debug("LLM JSON 응답: {}", llmJsonResponse.substring(0, Math.min(200, llmJsonResponse.length())));
            
            // LLM 응답에서 category_name 추출
            String categoryName = extractCategoryName(llmJsonResponse);
            
            // Agent의 extractWeekGoalsFromResponse 메서드를 사용하여 week_goals 추출
            List<WeekGoalDto> weekGoals = planGenerationAgent.extractWeekGoalsFromResponse(llmJsonResponse);
            log.info("week_goals 추출 완료 - 총 {}개", weekGoals.size());
            
            // GoalDto 생성
            GoalDto goalDto = GoalDto.builder()
                    .title(goalText)
                    .startDate(convertToDateTime(startDate))
                    .endDate(convertToDateTime(endDate))
                    .weekGoals(weekGoals)
                    .build();
            
            // PlanResponse 생성
            return PlanResponse.builder()
                    .categoryName(categoryName)
                    .goal(goalDto)
                    .build();
        } catch (Exception e) {
            log.error("week_goals 추출 실패, 기본 구조로 변환", e);
            // 실패 시 기본 변환 로직 사용
            return transformToPlanResponse(goalText, startDate, endDate, new ArrayList<>());
        }
    }

    /**
     * LLM 응답에서 category_name 추출
     * 추출 실패 시 기본 카테고리 반환
     */
    private String extractCategoryName(String llmJsonResponse) {
        try {
            String categoryName = planGenerationAgent.extractCategoryNameFromResponse(llmJsonResponse);
            if (categoryName != null && !categoryName.isBlank()) {
                log.info("LLM 응답에서 카테고리 추출 성공: {}", categoryName);
                return categoryName;
            }
        } catch (Exception e) {
            log.warn("category_name 추출 실패, 기본 카테고리 사용", e);
        }
        
        // 추출 실패 시 DB에서 "기타" 카테고리 조회
        return categoryRepository.findByDeletedAtIsNull().stream()
                .filter(category -> "기타".equals(category.getName()))
                .findFirst()
                .map(category -> category.getName())
                .orElse("기타");
    }

    /**
     * LocalDate를 그대로 반환 (날짜만 필요)
     */
    private LocalDate convertToDateTime(LocalDate date) {
        return date;
    }
}
