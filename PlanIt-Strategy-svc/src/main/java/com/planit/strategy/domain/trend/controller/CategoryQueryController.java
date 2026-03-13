package com.planit.strategy.domain.trend.controller;

import com.planit.strategy.common.ApiResponse;
import com.planit.strategy.domain.trend.dto.CategoryResponse;
import com.planit.strategy.domain.trend.service.CategoryQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Category API", description = "카테고리 조회 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryQueryController {
    private final CategoryQueryService categoryQueryService;
    
    @Operation(summary = "카테고리 목록 조회", description = "전체 카테고리 목록을 조회합니다")
    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        log.info("[Category Query API] 카테고리 목록 조회");
        
        List<CategoryResponse> categories = categoryQueryService.getCategories();
        
        return ApiResponse.success(categories);
    }
}
