package com.planit.userservice.controller;

import com.planit.basetemplate.common.ApiResponse;
import com.planit.userservice.dto.TermResponse;
import com.planit.userservice.service.TermService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users/terms")
@RequiredArgsConstructor
@Tag(name = "Metadata API", description = "Category and terms inquiry API (no authentication required)")
public class TermController {
    
    private final TermService termService;
    
    @Operation(
            summary = "Get Terms List",
            description = """
                    Retrieve list of service terms.
                    
                    - No authentication required
                    - Can filter by type (SERVICE, PRIVACY, MARKETING, etc.)
                    - Each term includes required/optional status and version information
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Terms retrieval successful"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server error (C5001: Internal server error)"
            )
    })
    @GetMapping
    public ApiResponse<List<TermResponse>> getTerms(
            @Parameter(description = "Term type (SERVICE, PRIVACY, MARKETING, etc.)", example = "SERVICE")
            @RequestParam(required = false) String type
    ) {
        log.info("Get terms request: type={}", type);
        List<TermResponse> response = termService.getTerms(type);
        return ApiResponse.success(HttpStatus.OK.value(), "Terms retrieval successful", response);
    }
}
