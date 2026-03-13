package com.planit.strategy.domain.trend.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planit.strategy.agent.AgentExecutionException;
import com.planit.strategy.agent.StrategyAgent;
import com.planit.strategy.domain.trend.dto.llm.TrendGenerationOutput;
import com.planit.strategy.domain.trend.dto.TrendGenerationInput;
import com.planit.strategy.domain.trend.prompt.TrendPromptBuilder;
import com.planit.strategy.infrastructure.llm.LlmClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrendGoalGenerationAgent implements StrategyAgent<TrendGenerationInput, TrendGenerationOutput> {
    private final LlmClient llmClient;
    private final TrendPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    @Override
    public TrendGenerationOutput execute(TrendGenerationInput input) throws AgentExecutionException {
        try {
            validateInput(input);
            
            String userPrompt = promptBuilder.build(input);
            String systemPrompt = buildSystemPrompt();
            
            int totalNewsCount = input.getCategories().stream()
                    .mapToInt(c -> c.getNews().size())
                    .sum();
            
            log.info("Trend Goal Generation 시작 - Categories: {}, Total News: {}", 
                    input.getCategories().size(), totalNewsCount);
            
            String response = llmClient.generate(systemPrompt, userPrompt);
            
            log.info("LLM 호출 완료 - 1회 호출로 모든 카테고리 처리");
            
            TrendGenerationOutput output = parseResponse(response);
            validateOutput(output, input.getCategories().size());
            
            log.info("Trend Goal Generation 완료 - Category Trends: {}", output.getCategoryTrends().size());
            return output;
        } catch (AgentExecutionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Trend Goal Generation 실패", e);
            throw new AgentExecutionException("Trend Goal Generation 실패: " + e.getMessage(), e);
        }
    }

    private String buildSystemPrompt() {
        return """
너는 글로벌 트렌드 분석 AI다.
주어진 여러 카테고리의 뉴스를 분석하여 각 카테고리별로 2-3개의 주요 트렌드를 추출하고,
각 트렌드별로 학습/프로젝트 목표를 제안하라.

반드시 다음 JSON 형식으로만 응답하라:
{
  "category_trends": [
    {
      "category": "카테고리 이름",
      "trends": [
        {
          "main_keyword": "트렌드의 핵심 키워드",
          "headline": "트렌드 제목",
          "summary": "트렌드 요약 (1-2문장)",
          "score": 0.85,
          "goals": [
            {
              "title": "학습/프로젝트 목표 제목",
              "description": "목표 설명"
            }
          ]
        }
      ]
    }
  ]
}

주의사항:
- category_trends는 입력된 모든 카테고리를 포함해야 한다.
- 각 카테고리의 trends는 정확히 2-3개여야 한다.
- 각 trend의 goals는 최소 1개 이상이어야 한다.
- score는 0.0~1.0 사이의 숫자여야 한다.
- JSON만 응답하고 다른 텍스트는 포함하지 마라.
- 마크다운 포맷 금지.
- 코드블록 금지.
""";
    }

    private void validateInput(TrendGenerationInput input) throws AgentExecutionException {
        if (input == null) {
            throw new AgentExecutionException("TrendGenerationInput이 null입니다.");
        }
        
        if (input.getCategories() == null || input.getCategories().isEmpty()) {
            throw new AgentExecutionException("카테고리 리스트가 비어있습니다.");
        }
        
        for (TrendGenerationInput.CategoryNews categoryNews : input.getCategories()) {
            if (categoryNews.getCategoryId() == null) {
                throw new AgentExecutionException("카테고리 ID가 null입니다.");
            }
            
            if (categoryNews.getCategoryName() == null || categoryNews.getCategoryName().isBlank()) {
                throw new AgentExecutionException("카테고리 이름이 비어있습니다.");
            }
            
            if (categoryNews.getNews() == null || categoryNews.getNews().isEmpty()) {
                log.warn("카테고리 '{}' (ID: {}) 의 뉴스가 비어있습니다.", 
                        categoryNews.getCategoryName(), categoryNews.getCategoryId());
            }
        }
    }

    private TrendGenerationOutput parseResponse(String response) throws AgentExecutionException {
        try {
            String jsonStr = extractJson(response);
            return objectMapper.readValue(jsonStr, TrendGenerationOutput.class);
        } catch (Exception e) {
            log.error("JSON 파싱 실패: {}", response, e);
            throw new AgentExecutionException("LLM 응답 파싱 실패: " + e.getMessage(), e);
        }
    }

    private String extractJson(String response) throws AgentExecutionException {
        String trimmed = response.trim();
        
        int startIdx = trimmed.indexOf('{');
        if (startIdx == -1) {
            throw new AgentExecutionException("JSON 객체를 찾을 수 없습니다.");
        }
        
        int endIdx = trimmed.lastIndexOf('}');
        if (endIdx == -1 || endIdx <= startIdx) {
            throw new AgentExecutionException("유효한 JSON 객체가 아닙니다.");
        }
        
        return trimmed.substring(startIdx, endIdx + 1);
    }

    private void validateOutput(TrendGenerationOutput output, int expectedCategoryCount) throws AgentExecutionException {
        if (output == null) {
            throw new AgentExecutionException("TrendGenerationOutput이 null입니다.");
        }
        
        if (output.getCategoryTrends() == null) {
            throw new AgentExecutionException("category_trends가 null입니다.");
        }
        
        int actualCategoryCount = output.getCategoryTrends().size();
        if (actualCategoryCount != expectedCategoryCount) {
            log.warn("카테고리 개수 불일치 - 예상: {}, 실제: {}", expectedCategoryCount, actualCategoryCount);
        }
        
        for (int i = 0; i < output.getCategoryTrends().size(); i++) {
            var categoryTrend = output.getCategoryTrends().get(i);
            
            if (categoryTrend.getTrends() == null) {
                throw new AgentExecutionException("CategoryTrend[" + i + "]의 trends가 null입니다.");
            }
            
            int trendCount = categoryTrend.getTrends().size();
            if (trendCount < 2 || trendCount > 3) {
                throw new AgentExecutionException(
                    "CategoryTrend[" + i + "]의 trends 개수가 범위를 벗어났습니다. (2-3개 필요, 현재: " + trendCount + ")");
            }
            
            for (int j = 0; j < categoryTrend.getTrends().size(); j++) {
                var trend = categoryTrend.getTrends().get(j);
                
                if (trend.getGoals() == null) {
                    throw new AgentExecutionException(
                        "CategoryTrend[" + i + "].Trend[" + j + "]의 goals가 null입니다.");
                }
                
                if (trend.getGoals().isEmpty()) {
                    throw new AgentExecutionException(
                        "CategoryTrend[" + i + "].Trend[" + j + "]의 goals가 비어있습니다.");
                }
            }
        }
    }
}
