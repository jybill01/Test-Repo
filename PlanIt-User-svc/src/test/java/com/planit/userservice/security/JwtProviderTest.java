package com.planit.userservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtProvider 단위 테스트")
class JwtProviderTest {

    private JwtProvider jwtProvider;
    private String secretKey;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider();
        
        // 테스트용 시크릿 키 (최소 256비트)
        secretKey = "test-secret-key-for-jwt-token-generation-must-be-at-least-256-bits-long";
        key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        
        // ReflectionTestUtils를 사용하여 private 필드 설정
        ReflectionTestUtils.setField(jwtProvider, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtProvider, "accessTokenExpiration", 900000L); // 15분
        ReflectionTestUtils.setField(jwtProvider, "refreshTokenExpiration", 604800000L); // 7일
        
        // @PostConstruct 메서드 수동 호출
        ReflectionTestUtils.invokeMethod(jwtProvider, "init");
    }

    @Test
    @DisplayName("Access Token 생성 성공")
    void generateAccessToken_Success() {
        // given
        String userId = "test-user-id";

        // when
        String token = jwtProvider.generateAccessToken(userId);

        // then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        
        // 토큰 검증
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        assertThat(claims.getSubject()).isEqualTo(userId);
        assertThat(claims.get("type")).isEqualTo("access");
    }

    @Test
    @DisplayName("Refresh Token 생성 성공")
    void generateRefreshToken_Success() {
        // given
        String userId = "test-user-id";

        // when
        String token = jwtProvider.generateRefreshToken(userId);

        // then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        
        // 토큰 검증
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        assertThat(claims.getSubject()).isEqualTo(userId);
        assertThat(claims.get("type")).isEqualTo("refresh");
    }

    @Test
    @DisplayName("토큰에서 userId 추출 성공")
    void getUserIdFromToken_Success() {
        // given
        String userId = "test-user-id";
        String token = jwtProvider.generateAccessToken(userId);

        // when
        String extractedUserId = jwtProvider.getUserIdFromToken(token);

        // then
        assertThat(extractedUserId).isEqualTo(userId);
    }

    @Test
    @DisplayName("토큰 검증 성공")
    void validateToken_Success() {
        // given
        String userId = "test-user-id";
        String token = jwtProvider.generateAccessToken(userId);

        // when
        boolean isValid = jwtProvider.validateToken(token);

        // then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("토큰 검증 실패 - 잘못된 토큰")
    void validateToken_Fail_InvalidToken() {
        // given
        String invalidToken = "invalid.token.here";

        // when
        boolean isValid = jwtProvider.validateToken(invalidToken);

        // then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("토큰 검증 실패 - 만료된 토큰")
    void validateToken_Fail_ExpiredToken() {
        // given
        String userId = "test-user-id";
        Date now = new Date();
        Date expiredDate = new Date(now.getTime() - 1000); // 1초 전 만료
        
        String expiredToken = Jwts.builder()
                .subject(userId)
                .claim("type", "access")
                .issuedAt(new Date(now.getTime() - 2000))
                .expiration(expiredDate)
                .signWith(key)
                .compact();

        // when
        boolean isValid = jwtProvider.validateToken(expiredToken);

        // then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Access Token과 Refresh Token 구분")
    void tokenType_Distinction() {
        // given
        String userId = "test-user-id";

        // when
        String accessToken = jwtProvider.generateAccessToken(userId);
        String refreshToken = jwtProvider.generateRefreshToken(userId);

        // then
        Claims accessClaims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(accessToken)
                .getPayload();
        
        Claims refreshClaims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(refreshToken)
                .getPayload();
        
        assertThat(accessClaims.get("type")).isEqualTo("access");
        assertThat(refreshClaims.get("type")).isEqualTo("refresh");
        
        // Refresh Token이 Access Token보다 만료 시간이 길어야 함
        assertThat(refreshClaims.getExpiration())
                .isAfter(accessClaims.getExpiration());
    }

    @Test
    @DisplayName("토큰 만료 시간 확인")
    void tokenExpiration_Check() {
        // given
        String userId = "test-user-id";
        String token = jwtProvider.generateAccessToken(userId);

        // when
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // then
        Date expiration = claims.getExpiration();
        Date now = new Date();
        
        // 만료 시간이 현재 시간보다 미래여야 함
        assertThat(expiration).isAfter(now);
        
        // 만료 시간이 대략 15분 후여야 함 (오차 1분 허용)
        long diff = expiration.getTime() - now.getTime();
        assertThat(diff).isBetween(840000L, 960000L); // 14분 ~ 16분
    }
}
