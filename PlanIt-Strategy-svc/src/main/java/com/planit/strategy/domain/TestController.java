/**
 * [planit 글로벌 룰 - 테스트 컨트롤러]
 * 서비스 실행 테스트 및 예시를 보여줍니다.
 * 삭제하셔도 됩니다.
 * @since 2026-02-23
 */

package com.planit.strategy.domain;

import com.planit.strategy.common.ApiResponse;
import com.planit.strategy.common.CustomException;
import com.planit.strategy.common.ErrorCode;
import com.planit.strategy.domain.trend.agent.TrendGoalGenerationAgent;
import com.planit.strategy.domain.trend.dto.TrendGenerationInput;
import com.planit.strategy.domain.trend.dto.llm.TrendGenerationOutput;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@Slf4j
@RestController
@RequestMapping("/api/v1/base")
@RequiredArgsConstructor
public class TestController {
    private final TrendGoalGenerationAgent trendGoalGenerationAgent;

    @GetMapping("/test")
    public ApiResponse<String> test() {
        log.info("[PlanIt Base Template] 테스트 API 호출");
        return ApiResponse.success("PlanIt base 템플릿");
    }

    @GetMapping("/error-test")
    public ApiResponse<Void> errorTest() {
        throw new CustomException(ErrorCode.C4041);
    }

    @PostMapping("/test-trend-agent")
    public ApiResponse<TrendGenerationOutput> testTrendAgent(@RequestBody TrendGenerationInput input) {
        log.info("[Trend Agent Test] 카테고리 개수: {}", input.getCategories().size());
        
        try {
            TrendGenerationOutput output = trendGoalGenerationAgent.execute(input);
            log.info("[Trend Agent Test] 성공 - Category Trends: {}", output.getCategoryTrends().size());
            return ApiResponse.success(output);
        } catch (Exception e) {
            log.error("[Trend Agent Test] 실패", e);
            throw new CustomException(ErrorCode.C5001);
        }
    }

    @PostMapping("/test-trend-agent-sample")
    public ApiResponse<TrendGenerationOutput> testTrendAgentWithSample() {
        log.info("[Trend Agent Test] 샘플 데이터로 테스트 시작");
        
        TrendGenerationInput input = TrendGenerationInput.builder()
                .categories(Arrays.asList(
                    TrendGenerationInput.CategoryNews.builder()
                            .categoryId(1L)
                            .categoryName("AWS")
                            .news(Arrays.asList(
                                TrendGenerationInput.NewsArticle.builder()
                                        .title("AWS Lambda 성능 개선으로 서버리스 시장 확대")
                                        .description("AWS가 Lambda의 성능을 50% 개선하여 엔터프라이즈 고객들의 채택이 증가하고 있습니다.")
                                        .url("https://example.com/1")
                                        .source("TechNews")
                                        .build(),
                                TrendGenerationInput.NewsArticle.builder()
                                        .title("클라우드 비용 최적화 도구 수요 급증")
                                        .description("기업들이 클라우드 비용 절감을 위해 최적화 도구에 투자를 늘리고 있습니다.")
                                        .url("https://example.com/2")
                                        .source("CloudTimes")
                                        .build(),
                                TrendGenerationInput.NewsArticle.builder()
                                        .title("AI/ML 서비스 통합으로 AWS 경쟁력 강화")
                                        .description("AWS SageMaker와 Bedrock의 통합으로 AI 개발이 더욱 간편해졌습니다.")
                                        .url("https://example.com/3")
                                        .source("AIWeekly")
                                        .build(),
                                TrendGenerationInput.NewsArticle.builder()
                                        .title("엔터프라이즈 마이그레이션 가속화")
                                        .description("대규모 기업들이 온프레미스에서 AWS로의 마이그레이션을 가속화하고 있습니다.")
                                        .url("https://example.com/4")
                                        .source("EnterpriseTech")
                                        .build(),
                                TrendGenerationInput.NewsArticle.builder()
                                        .title("AWS 보안 기능 강화로 규정 준수 용이")
                                        .description("새로운 보안 기능들이 HIPAA, PCI-DSS 규정 준수를 더욱 간편하게 만들었습니다.")
                                        .url("https://example.com/5")
                                        .source("SecurityFocus")
                                        .build()
                            ))
                            .build()
                ))
                .build();
        
        try {
            TrendGenerationOutput output = trendGoalGenerationAgent.execute(input);
            log.info("[Trend Agent Test] 성공 - Category Trends: {}", output.getCategoryTrends().size());
            return ApiResponse.success(output);
        } catch (Exception e) {
            log.error("[Trend Agent Test] 실패", e);
            throw new CustomException(ErrorCode.C5001);
        }
    }
}