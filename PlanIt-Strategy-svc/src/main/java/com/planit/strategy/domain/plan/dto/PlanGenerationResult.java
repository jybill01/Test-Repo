/**
 * [PlanIt Strategy Service - Plan Generation Result DTO]
 * LLM 응답 결과를 담는 DTO
 */
package com.planit.strategy.domain.plan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanGenerationResult {
    private String categoryName;
    private List<WeekGoalDto> weekGoals;
}
