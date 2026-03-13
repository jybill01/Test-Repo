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
public class TrendGenerationInput {
    private List<CategoryNews> categories;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryNews {
        private Long categoryId;
        private String categoryName;
        private List<NewsArticle> news;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewsArticle {
        private String title;
        private String description;
        private String url;
        private String source;
    }
}
