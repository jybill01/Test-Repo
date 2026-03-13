package com.planit.strategy.domain.trend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendGenerationSummary {
    private int totalCategories;
    private int processedCategories;
    private int totalTrends;
    private int totalGoals;
    private List<CategorySummary> categorySummaries;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySummary {
        private Long categoryId;
        private String categoryName;
        private int trendCount;
        private int goalCount;
    }
}
