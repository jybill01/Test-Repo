/**
 * [PlanIt Strategy Service - Week Goal DTO]
 * 주차별 목표 DTO
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
public class WeekGoalDto {
    private String title;
    private List<TaskDto> tasks;
}
