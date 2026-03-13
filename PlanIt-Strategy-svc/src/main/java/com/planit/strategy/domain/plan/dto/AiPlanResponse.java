/**
 * [PlanIt Strategy Service - AI Plan Response DTO]
 * AI(Bedrock)가 생성한 목표 계획 응답 DTO
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
public class AiPlanResponse {
    private String categoryName;
    private GoalDto goal;
}
