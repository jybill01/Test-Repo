package com.planit.strategy.domain.trend.dto;

import com.planit.strategy.domain.trend.entity.AiGoalTemplate;
import com.planit.strategy.domain.trend.entity.Trend;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendResponse {
    private List<TrendItem> trends;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendItem {
        private Long id;
        private String mainKeyword;
        private String headline;
        private String summary;
        private Double score;
        private List<GoalItem> goals;
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoalItem {
        private Long id;
        private String title;
        private String description;
    }
    
    public static TrendResponse from(List<Trend> trends) {
        List<TrendItem> trendItems = trends.stream()
                .map(trend -> TrendItem.builder()
                        .id(trend.getId())
                        .mainKeyword(trend.getMainKeyword())
                        .headline(trend.getHeadline())
                        .summary(trend.getSummary())
                        .score(trend.getScore())
                        .goals(List.of())
                        .build())
                .collect(Collectors.toList());
        
        return TrendResponse.builder()
                .trends(trendItems)
                .build();
    }
}
