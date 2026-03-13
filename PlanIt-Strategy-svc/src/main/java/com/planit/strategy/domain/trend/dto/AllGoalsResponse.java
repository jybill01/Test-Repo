package com.planit.strategy.domain.trend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 전체 트렌드별 목표 조회 응답 DTO
 */
@Schema(description = "전체 트렌드별 목표 조회 응답")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllGoalsResponse {
    @Schema(description = "카테고리별 트렌드 목표 목록")
    private List<CategoryGoals> categories;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryGoals {
        @Schema(description = "카테고리 ID", example = "1")
        private Long categoryId;
        
        @Schema(description = "카테고리 이름", example = "직무/커리어")
        private String categoryName;
        
        @Schema(description = "트렌드별 목표 목록")
        private List<TrendGoals> trends;
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendGoals {
        @Schema(description = "트렌드 ID", example = "1")
        private Long trendId;
        
        @Schema(description = "트렌드 메인 키워드", example = "AI-Native Talent")
        private String mainKeyword;
        
        @Schema(description = "트렌드 헤드라인", example = "AI 네이티브 인재 양성 프로그램 확산")
        private String headline;
        
        @Schema(description = "목표 목록")
        private List<GoalTemplateResponse> goals;
    }
}
