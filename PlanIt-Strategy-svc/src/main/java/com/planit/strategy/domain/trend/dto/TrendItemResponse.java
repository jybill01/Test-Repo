package com.planit.strategy.domain.trend.dto;

import com.planit.strategy.domain.trend.entity.Trend;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "트렌드 조회 응답")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendItemResponse {
    @Schema(description = "트렌드 ID", example = "1")
    private Long trendId;
    
    @Schema(description = "핵심 키워드", example = "서버리스")
    private String mainKeyword;
    
    @Schema(description = "트렌드 제목", example = "서버리스 아키텍처의 엔터프라이즈 확산")
    private String headline;
    
    @Schema(description = "트렌드 요약", example = "AWS Lambda 성능 개선으로...")
    private String summary;
    
    @Schema(description = "트렌드 점수", example = "0.92")
    private Double score;
    
    public static TrendItemResponse from(Trend trend) {
        return TrendItemResponse.builder()
                .trendId(trend.getId())
                .mainKeyword(trend.getMainKeyword())
                .headline(trend.getHeadline())
                .summary(trend.getSummary())
                .score(trend.getScore())
                .build();
    }
}
