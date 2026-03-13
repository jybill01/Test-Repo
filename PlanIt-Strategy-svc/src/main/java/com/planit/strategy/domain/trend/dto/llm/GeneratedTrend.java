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
public class GeneratedTrend {
    @JsonProperty("main_keyword")
    private String mainKeyword;

    @JsonProperty("headline")
    private String headline;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("score")
    private Double score;

    @JsonProperty("goals")
    private List<GeneratedGoalTemplate> goals;
}
