package com.planit.strategy.domain.trend.controller;

import com.planit.strategy.common.ApiResponse;
import com.planit.strategy.domain.trend.dto.AllTrendsResponse;
import com.planit.strategy.domain.trend.dto.CategoryTrendsResponse;
import com.planit.strategy.domain.trend.dto.TrendItemResponse;
import com.planit.strategy.domain.trend.service.TrendQueryService;
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

@Tag(name = "Trend API", description = "트렌드 조회 API")
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TrendQueryController {
    private final TrendQueryService trendQueryService;
    
    @Operation(summary = "전체 카테고리 트렌드 조회", description = "모든 카테고리의 최신 트렌드를 조회합니다")
    @GetMapping("/trends")
    public ApiResponse<AllTrendsResponse> getAllTrends() {
        log.info("[Trend Query API] 전체 카테고리 트렌드 조회");
        
        AllTrendsResponse response = trendQueryService.getAllTrends();
        
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "카테고리별 트렌드 조회", description = "특정 카테고리의 최신 트렌드 목록을 score 내림차순으로 조회합니다")
    @GetMapping("/categories/{categoryId}/trends")
    public ApiResponse<CategoryTrendsResponse> getTrendsByCategory(
            @Parameter(description = "카테고리 ID", required = true) @PathVariable Long categoryId) {
        log.info("[Trend Query API] 카테고리별 트렌드 조회 - Category ID: {}", categoryId);
        
        CategoryTrendsResponse response = trendQueryService.getTrendsByCategory(categoryId);
        
        return ApiResponse.success(response);
    }
}
