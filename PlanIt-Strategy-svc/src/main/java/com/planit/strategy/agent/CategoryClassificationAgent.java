package com.planit.strategy.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import com.planit.strategy.infrastructure.llm.LlmClient;
import com.planit.strategy.infrastructure.llm.LlmException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategoryClassificationAgent {
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;
    private final CategoryRepository categoryRepository;

    /**
     * 목표 텍스트를 기반으로 카테고리 분류
     * @param goalText 목표 텍스트
     * @return 카테고리명
     */
    public String classifyCategory(String goalText) throws AgentExecutionException {
        try {
            // DB에서 카테고리 목록 조회
            List<String> categories = categoryRepository.findByDeletedAtIsNull().stream()
                    .map(category -> category.getName())
                    .toList();
            
            String systemPrompt = buildSystemPrompt(categories);
            String userPrompt = buildUserPrompt(goalText);
            
            log.info("카테고리 분류 시작 - Goal: {}", goalText);
            
            String response = llmClient.generate(systemPrompt, userPrompt);
            String category = extractCategory(response);
            
            log.info("카테고리 분류 완료 - Category: {}", category);
            return category;
        } catch (Exception e) {
            log.error("카테고리 분류 실패", e);
            throw new AgentExecutionException("카테고리 분류 실패: " + e.getMessage(), e);
        }
    }

    private String buildSystemPrompt(List<String> categories) {
        StringBuilder categoriesStr = new StringBuilder();
        for (String category : categories) {
            categoriesStr.append("- ").append(category).append("\n");
        }
        
        return String.format("""
당신은 목표 텍스트를 분석하여 적절한 카테고리를 분류하는 AI다.
다음 카테고리 중 하나를 선택하여 반환하라:
%s
응답 형식:
{"category": "카테고리명"}

JSON만 반환하고 다른 텍스트는 포함하지 마.
""", categoriesStr.toString());
    }

    private String buildUserPrompt(String goalText) {
        return String.format("""
다음 목표를 분석하여 가장 적절한 카테고리를 선택하세요:
목표: %s

JSON 형식으로 응답하세요.
""", goalText);
    }

    private String extractCategory(String response) throws Exception {
        String trimmed = response.trim();
        
        // JSON 객체 추출
        int startIdx = trimmed.indexOf('{');
        int endIdx = trimmed.lastIndexOf('}');
        
        if (startIdx == -1 || endIdx == -1 || endIdx <= startIdx) {
            throw new Exception("유효한 JSON을 찾을 수 없습니다.");
        }
        
        String jsonStr = trimmed.substring(startIdx, endIdx + 1);
        Map<String, String> result = objectMapper.readValue(jsonStr, Map.class);
        
        String category = result.get("category");
        if (category == null || category.isBlank()) {
            throw new Exception("category 필드가 없습니다.");
        }
        
        return category;
    }
}
