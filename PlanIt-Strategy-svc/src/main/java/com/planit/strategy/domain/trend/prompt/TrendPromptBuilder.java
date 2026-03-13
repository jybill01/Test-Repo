package com.planit.strategy.domain.trend.prompt;

import com.planit.strategy.domain.trend.dto.TrendGenerationInput;
import org.springframework.stereotype.Component;

@Component
public class TrendPromptBuilder {
    
    private static final int MAX_DESCRIPTION_LENGTH = 150;
    
    public String build(TrendGenerationInput input) {
        StringBuilder prompt = new StringBuilder();
        
        // 역할 정의
        prompt.append("""
당신은 글로벌 기술 / 학습 / 커리어 트렌드를 분석하는 AI 분석가입니다.

다음은 여러 카테고리별 최근 글로벌 뉴스입니다.

""");
        
        // 카테고리별 뉴스 나열
        for (TrendGenerationInput.CategoryNews categoryNews : input.getCategories()) {
            prompt.append("=== 카테고리 ID: ").append(categoryNews.getCategoryId())
                  .append(" (").append(categoryNews.getCategoryName()).append(") ===\n");
            
            for (TrendGenerationInput.NewsArticle article : categoryNews.getNews()) {
                prompt.append("- ").append(article.getTitle()).append("\n");
                
                if (article.getDescription() != null && !article.getDescription().isEmpty()) {
                    String description = article.getDescription();
                    // description 길이 제한 (최대 150자)
                    if (description.length() > MAX_DESCRIPTION_LENGTH) {
                        description = description.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
                    }
                    prompt.append("  ").append(description).append("\n");
                }
            }
            prompt.append("\n");
        }
        
        // 트렌드 생성 지시사항
        prompt.append("""
위 뉴스를 분석하여 각 카테고리별로 2-3개의 주요 트렌드를 추출하고,
각 트렌드별로 학습/프로젝트 목표를 제안하라.

📋 트렌드 생성 기준:
- 뉴스 여러 개에서 반복적으로 등장하는 주제
- 미래 학습 가치가 있는 분야
- 기술 / 커리어 / 자기계발 트렌드
- 단순 뉴스 요약이 아닌 흐름 분석

📊 트렌드 생성 규칙:
- 각 카테고리마다 정확히 2~3개의 트렌드 생성
- main_keyword: 트렌드의 핵심 키워드 (간결하게)
- headline: 트렌드 제목 (한 문장)
- summary: 트렌드 요약 (1-2문장, 구체적으로)
- score: 트렌드 중요도 (0.0~1.0, 높을수록 중요)
- goals: 해당 트렌드 기반 학습/프로젝트 목표 (최소 1개)

⚠️ 중요: 반드시 다음 JSON 형식으로만 응답하라.
- 설명 문장 추가 금지
- 코드블록(```) 사용 금지
- JSON 외 텍스트 출력 금지
- category_id는 반드시 위에 제공된 카테고리 ID를 사용하라

응답 형식 예시:
{
  "category_trends": [
    {
      "category_id": 1,
      "trends": [
        {
          "main_keyword": "AI Engineering",
          "headline": "AI 엔지니어 수요 급증",
          "summary": "생성형 AI 도입으로 AI 엔지니어 채용이 증가하고 있습니다. 특히 LLM 기반 애플리케이션 개발 경험이 중요해지고 있습니다.",
          "score": 0.92,
          "goals": [
            {
              "title": "Python과 LangChain으로 LLM 애플리케이션 구축하기",
              "description": "OpenAI API와 LangChain을 활용한 실전 프로젝트 개발"
            },
            {
              "title": "프롬프트 엔지니어링 마스터하기",
              "description": "효과적인 프롬프트 작성 기법과 최적화 전략 학습"
            }
          ]
        }
      ]
    }
  ]
}

위 형식을 정확히 따라 JSON만 출력하라.
""");
        
        return prompt.toString();
    }
}
