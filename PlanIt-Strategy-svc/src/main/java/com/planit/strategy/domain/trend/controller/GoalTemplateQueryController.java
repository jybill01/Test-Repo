package com.planit.strategy.domain.trend.controller;

import com.planit.strategy.common.ApiResponse;
import com.planit.strategy.domain.trend.dto.AllGoalsResponse;
import com.planit.strategy.domain.trend.dto.GoalTemplateResponse;
import com.planit.strategy.domain.trend.service.GoalTemplateQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Goal Template API", description = "트렌드 기반 목표 조회 API")
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class GoalTemplateQueryController {
    private final GoalTemplateQueryService goalTemplateQueryService;
    
    @Operation(summary = "전체 트렌드별 목표 조회", description = "모든 카테고리의 트렌드별 학습/프로젝트 목표를 조회합니다")
    @GetMapping("/goals")
    public ApiResponse<AllGoalsResponse> getAllGoals() {
        log.info("[Goal Query API] 전체 트렌드별 목표 조회");
        
        AllGoalsResponse response = goalTemplateQueryService.getAllGoals();
        
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "트렌드별 목표 조회", description = "특정 트렌드의 학습/프로젝트 목표 목록을 조회합니다")
    @GetMapping("/trends/{trendId}/goals")
    public ApiResponse<List<GoalTemplateResponse>> getGoalsByTrend(
            @Parameter(description = "트렌드 ID", required = true) @PathVariable Long trendId) {
        log.info("[Goal Query API] 트렌드별 목표 조회 - Trend ID: {}", trendId);
        
        List<GoalTemplateResponse> goals = goalTemplateQueryService.getGoalsByTrend(trendId);
        
        return ApiResponse.success(goals);
    }
}
