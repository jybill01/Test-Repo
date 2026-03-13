package com.planit.userservice.controller;

import com.planit.basetemplate.common.ApiResponse;
import com.planit.userservice.dto.CategoryResponse;
import com.planit.userservice.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users/categories")
@RequiredArgsConstructor
@Tag(name = "Metadata API", description = "Category and terms inquiry API (no authentication required)")
public class CategoryController {
    
    private final CategoryService categoryService;
    
    @Operation(
            summary = "Get Category List",
            description = """
                    Retrieve list of interest categories.
                    
                    - No authentication required
                    - Returns 8 major categories (Exercise, Reading, Study, Hobby, Health, Self-improvement, Travel, Other)
                    - Each category has a unique color code
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Category retrieval successful"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server error (C5001: Internal server error)"
            )
    })
    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        log.info("Get categories request");
        List<CategoryResponse> response = categoryService.getCategories();
        return ApiResponse.success(HttpStatus.OK.value(), "Category retrieval successful", response);
    }
}
