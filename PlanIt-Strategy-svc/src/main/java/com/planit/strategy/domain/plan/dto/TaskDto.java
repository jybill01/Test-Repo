/**
 * [PlanIt Strategy Service - Task DTO]
 * 주차별 작업 항목 DTO
 */
package com.planit.strategy.domain.plan.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private String content;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate targetDate;
}
