/**
 * [PlanIt Strategy Service - Plan Response DTO]
 * 최종 응답 DTO
 */
package com.planit.strategy.domain.plan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {
    private String categoryName;
    private GoalDto goal;
}
