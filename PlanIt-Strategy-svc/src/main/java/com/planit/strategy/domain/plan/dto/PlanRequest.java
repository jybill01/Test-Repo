package com.planit.strategy.domain.plan.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Schema(description = "AI 실행 계획 생성 요청")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanRequest {
    @Schema(description = "목표 텍스트", example = "AWS 자격증 취득")
    private String goalText;
    
    @Schema(description = "시작 날짜", example = "2026-03-03")
    private LocalDate startDate;
    
    @Schema(description = "종료 날짜", example = "2026-03-28")
    private LocalDate endDate;

    public void validate() {
        if (goalText == null || goalText.isBlank()) {
            throw new IllegalArgumentException("goalText는 필수입니다.");
        }
        if (startDate == null) {
            throw new IllegalArgumentException("startDate는 필수입니다.");
        }
        if (endDate == null) {
            throw new IllegalArgumentException("endDate는 필수입니다.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate는 startDate보다 이전일 수 없습니다.");
        }
    }
}
