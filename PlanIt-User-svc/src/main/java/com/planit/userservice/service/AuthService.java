package com.planit.userservice.service;

import com.github.f4b6a3.uuid.UuidCreator;
import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import com.planit.userservice.dto.AuthResponse;
import com.planit.userservice.dto.CheckWithdrawnRequest;
import com.planit.userservice.dto.CheckWithdrawnResponse;
import com.planit.userservice.dto.LoginRequest;
import com.planit.userservice.dto.SignupRequest;
import com.planit.userservice.dto.TokenRefreshRequest;
import com.planit.userservice.dto.TokenRefreshResponse;
import com.planit.userservice.entity.*;
import com.planit.userservice.repository.*;
import com.planit.userservice.security.CognitoService;
import com.planit.userservice.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TermRepository termRepository;
    private final UserAgreementRepository userAgreementRepository;
    private final InterestCategoryRepository interestCategoryRepository;
    private final UserInterestRepository userInterestRepository;
    private final FriendRepository friendRepository;
    private final CognitoService cognitoService;
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, String> redisTemplate;

    private static final int REJOIN_RESTRICTION_DAYS = 90;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");

    // Redis 네임스페이스: 방별로 분리
    // auth:{userId}     → refresh token (User-svc 전용)
    private static final String REDIS_REFRESH_TOKEN_PREFIX = "auth:refresh:";

    private String refreshTokenKey(String userId) {
        return REDIS_REFRESH_TOKEN_PREFIX + userId;
    }

    private void saveRefreshTokenToRedis(String userId, String refreshToken) {
        try {
            redisTemplate.opsForValue().set(
                    refreshTokenKey(userId),
                    refreshToken,
                    7,
                    TimeUnit.DAYS
            );
        } catch (Exception e) {
            log.warn("Redis is not available, skipping refresh token storage: {}", e.getMessage());
        }
    }

    private void deleteRefreshTokenFromRedis(String userId) {
        try {
            redisTemplate.delete(refreshTokenKey(userId));
        } catch (Exception e) {
            log.warn("Redis is not available, skipping refresh token deletion: {}", e.getMessage());
        }
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        // 1. refresh token 검증 (만료·위조 체크)
        String userId = jwtProvider.getUserIdFromToken(request.getRefreshToken());

        // 2. Redis에 저장된 토큰과 비교 (Token Rotation 보안)
        try {
            String stored = redisTemplate.opsForValue().get(refreshTokenKey(userId));
            if (stored == null || !stored.equals(request.getRefreshToken())) {
                throw new CustomException(ErrorCode.U4016);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis unavailable during refresh, proceeding without rotation check: {}", e.getMessage());
        }

        // 3. 신규 토큰 발급 (Token Rotation)
        String newAccessToken = jwtProvider.createAccessToken(userId);
        String newRefreshToken = jwtProvider.createRefreshToken(userId);

        // 4. Redis 갱신
        saveRefreshTokenToRedis(userId, newRefreshToken);

        log.info("Token refreshed for userId: {}", userId);
        return TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // 닉네임 중복 체크 (활성 유저만)
        if (userRepository.existsByNicknameAndDeletedAtIsNull(request.getNickname())) {
            throw new CustomException(ErrorCode.U4001);
        }

        // Cognito ID Token 검증 및 cognito_sub 추출
        String cognitoSub = cognitoService.validateIdTokenAndGetCognitoSub(request.getCognitoIdToken());

        // cognito_sub 중복 체크 (활성 유저만)
        if (userRepository.existsByCognitoSubAndDeletedAtIsNull(cognitoSub)) {
            throw new CustomException(ErrorCode.U4013);
        }

        // 탈퇴 유저 90일 재가입 제한 체크 (email 기준 - sub은 재로그인 시 바뀔 수 있음)
        Optional<UserEntity> withdrawnUser = userRepository.findWithdrawnByEmail(request.getEmail());
        if (withdrawnUser.isPresent()) {
            LocalDateTime deletedAt = withdrawnUser.get().getDeletedAt();
            LocalDateTime rejoinAvailableAt = deletedAt.plusDays(REJOIN_RESTRICTION_DAYS);
            if (LocalDateTime.now().isBefore(rejoinAvailableAt)) {
                throw new CustomException(ErrorCode.U4004);
            }
            // 90일 지난 탈퇴 유저 → 완전 삭제 후 재가입 허용
            userRepository.delete(withdrawnUser.get());
            userRepository.flush();
        }

        // 필수 약관 동의 확인
        List<TermEntity> requiredTerms = termRepository.findByIsRequired(true);
        for (TermEntity term : requiredTerms) {
            if (!request.getAgreedTermIds().contains(term.getTermId())) {
                throw new CustomException(ErrorCode.U4003);
            }
        }

        // UUID v7 생성
        String userId = UuidCreator.getTimeOrderedEpoch().toString();

        // User 엔티티 저장
        UserEntity user = UserEntity.builder()
                .userId(userId)
                .nickname(request.getNickname())
                .email(request.getEmail())
                .cognitoSub(cognitoSub)
                .isRetentionAgreed(request.getIsRetentionAgreed())
                .build();
        userRepository.save(user);

        // 약관 동의 이력 저장
        for (Integer termId : request.getAgreedTermIds()) {
            TermEntity term = termRepository.findById(termId)
                    .orElseThrow(() -> new CustomException(ErrorCode.C4041));
            UserAgreementEntity agreement = UserAgreementEntity.builder()
                    .user(user)
                    .term(term)
                    .build();
            userAgreementRepository.save(agreement);
        }

        // 관심 카테고리 저장
        for (Long categoryId : request.getInterestCategoryIds()) {
            InterestCategoryEntity category = interestCategoryRepository.findById(categoryId)
                    .orElseThrow(() -> new CustomException(ErrorCode.U4042));
            UserInterestEntity interest = UserInterestEntity.builder()
                    .user(user)
                    .category(category)
                    .build();
            userInterestRepository.save(interest);
        }

        // JWT 토큰 발급
        String accessToken = jwtProvider.createAccessToken(userId);
        String refreshToken = jwtProvider.createRefreshToken(userId);

        saveRefreshTokenToRedis(userId, refreshToken);

        return AuthResponse.builder()
                .userId(userId)
                .nickname(user.getNickname())
                .email(user.getEmail())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String cognitoSub = cognitoService.validateIdTokenAndGetCognitoSub(request.getCognitoIdToken());

        UserEntity user = userRepository.findByCognitoSubAndDeletedAtIsNull(cognitoSub)
                .orElseThrow(() -> new CustomException(ErrorCode.U4014));

        String accessToken = jwtProvider.createAccessToken(user.getUserId());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());

        saveRefreshTokenToRedis(user.getUserId(), refreshToken);

        return AuthResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // ✅ 탈퇴 유저 90일 재가입 제한 체크 (email 기준)
    public CheckWithdrawnResponse checkWithdrawn(CheckWithdrawnRequest request) {
        String email = cognitoService.extractEmailFromToken(request.getCognitoIdToken());
        log.info("Check withdrawn for email: {}", email);

        Optional<UserEntity> withdrawnUser = userRepository.findWithdrawnByEmail(email);

        if (withdrawnUser.isEmpty()) {
            return CheckWithdrawnResponse.builder()
                    .isRestricted(false)
                    .build();
        }

        LocalDateTime deletedAt = withdrawnUser.get().getDeletedAt();
        LocalDateTime rejoinAvailableAt = deletedAt.plusDays(REJOIN_RESTRICTION_DAYS);

        if (LocalDateTime.now().isBefore(rejoinAvailableAt)) {
            return CheckWithdrawnResponse.builder()
                    .isRestricted(true)
                    .availableAt(rejoinAvailableAt.format(DATE_FORMATTER)) // ex) 2026년 06월 05일
                    .build();
        }

        return CheckWithdrawnResponse.builder()
                .isRestricted(false)
                .build();
    }

    @Transactional
    public void withdraw(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.U4041));

        userRepository.delete(user);
        userInterestRepository.softDeleteByUserId(userId);
        friendRepository.softDeleteByUserId(userId);

        deleteRefreshTokenFromRedis(userId);
        cognitoService.deleteUser(user.getCognitoSub());

        log.info("User withdrawn: {}", userId);
    }
}
