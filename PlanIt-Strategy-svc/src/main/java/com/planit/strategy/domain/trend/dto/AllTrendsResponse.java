package com.planit.strategy.domain.trend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 전체 카테고리 트렌드 조회 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllTrendsResponse {
    private List<CategoryTrends> categories;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryTrends {
        private Long categoryId;
        private String categoryName;
        private List<TrendItemResponse> trends;
    }
}
