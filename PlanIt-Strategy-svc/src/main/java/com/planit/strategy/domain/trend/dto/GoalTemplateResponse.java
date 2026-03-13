package com.planit.strategy.domain.trend.dto;

import com.planit.strategy.domain.trend.entity.AiGoalTemplate;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "목표 템플릿 조회 응답")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalTemplateResponse {
    @Schema(description = "목표 ID", example = "1")
    private Long goalId;
    
    @Schema(description = "목표 제목", example = "서버리스 아키텍처 설계 및 구현")
    private String title;
    
    @Schema(description = "목표 설명", example = "AWS Lambda를 활용한 마이크로서비스...")
    private String description;
    
    public static GoalTemplateResponse from(AiGoalTemplate goalTemplate) {
        return GoalTemplateResponse.builder()
                .goalId(goalTemplate.getId())
                .title(goalTemplate.getTitle())
                .description(goalTemplate.getDescription())
                .build();
    }
}
