package com.planit.userservice.controller;

import com.planit.basetemplate.common.ApiResponse;
import com.planit.userservice.dto.UpdateProfileRequest;
import com.planit.userservice.dto.UserResponse;
import com.planit.userservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Profile API", description = "User profile management and search API")
public class UserController {
    
    private final UserService userService;
    
    @Operation(
            summary = "Get Profile",
            description = """
                    Get current user profile.
                    
                    - Returns user information and interest categories
                    - Requires authentication
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "User not found (U4041: User not found)"
            )
    })
    @GetMapping("/profile")
    public ApiResponse<UserResponse> getProfile(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId
    ) {
        log.info("Get profile request: {}", userId);
        UserResponse response = userService.getProfile(userId);
        return ApiResponse.success(HttpStatus.OK.value(), "Profile retrieved successfully", response);
    }
    
    @Operation(
            summary = "Update Profile",
            description = """
                    Update user profile.
                    
                    - Checks for nickname duplication
                    - Updates interest categories (deletes existing and saves new ones)
                    - Maximum 8 interest categories can be selected
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Bad request (U4001: Nickname duplicate)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "User not found (U4041: User not found)"
            )
    })
    @PutMapping("/profile")
    public ApiResponse<UserResponse> updateProfile(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        log.info("Update profile request: {}", userId);
        UserResponse response = userService.updateProfile(userId, request);
        return ApiResponse.success(HttpStatus.OK.value(), "Profile updated successfully", response);
    }
    
    @Operation(
            summary = "Search Users",
            description = """
                    Search users by nickname.
                    
                    - Performs partial match search (LIKE) on nickname
                    - Excludes deleted users
                    - Returns maximum 20 results
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "User search successful"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            )
    })
    @GetMapping("/search")
    public ApiResponse<List<UserResponse>> searchUsers(
            @Parameter(hidden = true) @AuthenticationPrincipal String myUserId, // 🎯 현재 로그인한 유저 ID 추가
            @Parameter(description = "Nickname to search (partial match)", required = true)
            @RequestParam String nickname
    ) {
        log.info("Search users request: {} by {}", nickname, myUserId);
        List<UserResponse> response = userService.searchUsers(nickname, myUserId);
        return ApiResponse.success(HttpStatus.OK.value(), "User search successful", response);
    }
}
