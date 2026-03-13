package com.planit.strategy.domain.trend.controller;

import com.planit.strategy.common.ApiResponse;
import com.planit.strategy.common.CustomException;
import com.planit.strategy.common.ErrorCode;
import com.planit.strategy.domain.trend.dto.TrendGenerationSummary;
import com.planit.strategy.domain.trend.service.TrendCommandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Trend Command API", description = "트렌드 생성 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class TrendCommandController {
    private final TrendCommandService trendCommandService;
    
    @Operation(summary = "트렌드 생성", description = "카테고리별 글로벌 뉴스를 분석하여 트렌드와 목표를 생성합니다")
    @PostMapping("/{categoryId}/trends/generate")
    public ApiResponse<Void> generateTrends(
            @Parameter(description = "카테고리 ID", required = true) @PathVariable Long categoryId) {
        log.info("[Trend Generate API] 트렌드 생성 요청 - Category ID: {}", categoryId);
        
        try {
            trendCommandService.generateTrends(categoryId);
            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("[Trend Generate API] 트렌드 생성 실패", e);
            throw new CustomException(ErrorCode.AI5001);
        }
    }

    @Operation(summary = "전체 트렌드 생성", description = "모든 카테고리에 대해 글로벌 뉴스를 분석하여 트렌드와 목표를 생성합니다")
    @PostMapping("/trends/generate-all")
    public ApiResponse<TrendGenerationSummary> generateAllTrends() {
        log.info("[Trend Generate API] 전체 트렌드 생성 요청");
        
        try {
            TrendGenerationSummary summary = trendCommandService.generateAllTrends();
            return ApiResponse.success(summary);
        } catch (Exception e) {
            log.error("[Trend Generate API] 전체 트렌드 생성 실패", e);
            throw new CustomException(ErrorCode.AI5001);
        }
    }
}
