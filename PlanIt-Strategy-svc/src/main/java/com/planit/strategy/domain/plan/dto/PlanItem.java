/**
 * [PlanIt Strategy Service - Plan Item DTO]
 * 날짜별 실행 계획 항목 DTO
 */
package com.planit.strategy.domain.plan.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanItem {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    
    private String title;
    private String description;
}
