package com.planit.userservice.controller;

import com.planit.basetemplate.common.ApiResponse;
import com.planit.userservice.dto.AuthResponse;
import com.planit.userservice.dto.CheckWithdrawnRequest;
import com.planit.userservice.dto.CheckWithdrawnResponse;
import com.planit.userservice.dto.LoginRequest;
import com.planit.userservice.dto.SignupRequest;
import com.planit.userservice.dto.TokenRefreshRequest;
import com.planit.userservice.dto.TokenRefreshResponse;
import com.planit.userservice.service.AuthService;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/users/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication API", description = "User signup, login, and account deletion API")
public class AuthController {

    private final AuthService authService;

    @Operation(
            summary = "User Signup",
            description = """
                    Register a new user.
                    
                    - Validates Cognito ID Token and creates user
                    - Checks for nickname duplication
                    - Validates required terms agreement
                    - Generates UUID v7 format user ID
                    - Issues JWT Access Token and Refresh Token
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Signup successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Bad request (U4001: Nickname duplicate, U4111: Required terms not agreed)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4011: Cognito ID Token validation failed)"
            )
    })
    @PostMapping("/signup")
    public ApiResponse<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        log.info("Signup request: {}", request.getNickname());
        AuthResponse response = authService.signup(request);
        return ApiResponse.success(HttpStatus.CREATED.value(), "Signup successful", response);
    }

    @Operation(
            summary = "User Login",
            description = """
                    Login existing user.
                    
                    - Validates Cognito ID Token
                    - Finds user by cognito_sub
                    - Issues JWT Access Token and Refresh Token
                    - Stores Refresh Token in Redis
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4011: Cognito ID Token validation failed)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "User not found (C4041: Unregistered user)"
            )
    })
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request");
        AuthResponse response = authService.login(request);
        return ApiResponse.success(HttpStatus.OK.value(), "Login successful", response);
    }

    // ✅ 추가 - 탈퇴 유저 90일 재가입 제한 체크
    @Operation(
            summary = "Check Withdrawn User Rejoin Restriction",
            description = """
                    Check if a withdrawn user is within the 90-day rejoin restriction period.
                    
                    - Validates Cognito ID Token
                    - Checks if user has withdrawn account
                    - Returns restriction status and available rejoin date
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Check successful",
                    content = @Content(schema = @Schema(implementation = CheckWithdrawnResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4011: Cognito ID Token validation failed)"
            )
    })
    @PostMapping("/check-withdrawn")
    public ApiResponse<CheckWithdrawnResponse> checkWithdrawn(@Valid @RequestBody CheckWithdrawnRequest request) {
        log.info("Check withdrawn request");
        CheckWithdrawnResponse response = authService.checkWithdrawn(request);
        return ApiResponse.success(HttpStatus.OK.value(), "Check successful", response);
    }

    @Operation(
            summary = "Account Deletion",
            description = """
                    Delete user account (Soft Delete).
                    
                    - Logically deletes user information
                    - Also deletes related categories and friend relationships
                    - Removes Refresh Token from Redis
                    - Deleted data is retained for 90 days
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Account deletion successful"
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
    @DeleteMapping("/withdraw")
    public ApiResponse<Void> withdraw(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId
    ) {
        log.info("Withdraw request: {}", userId);
        authService.withdraw(userId);
        return ApiResponse.success(HttpStatus.OK.value(), "Account deletion successful", null);
    }

    @Operation(
            summary = "Access Token 재발급",
            description = """
                    Refresh Token으로 새로운 Access Token + Refresh Token 발급 (Token Rotation).
                    
                    - Refresh Token 유효성 검증
                    - Redis에 저장된 토큰과 일치 여부 확인
                    - 새로운 Access Token(15분) + Refresh Token(7일) 발급
                    - Redis의 기존 Refresh Token을 새 토큰으로 교체
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Token refresh successful"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Invalid or expired refresh token"
            )
    })
    @PostMapping("/refresh")
    public ApiResponse<TokenRefreshResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        log.info("Token refresh request");
        TokenRefreshResponse response = authService.refreshToken(request);
        return ApiResponse.success(HttpStatus.OK.value(), "Token refresh successful", response);
    }
}
