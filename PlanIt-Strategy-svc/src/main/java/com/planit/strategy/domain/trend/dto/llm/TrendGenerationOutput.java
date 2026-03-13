package com.planit.strategy.domain.trend.dto.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrendGenerationOutput {
    @JsonProperty("category_trends")
    private List<CategoryTrend> categoryTrends;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CategoryTrend {
        @JsonProperty("category_id")
        private Long categoryId;
        
        @JsonProperty("trends")
        private List<GeneratedTrend> trends;
    }
}
