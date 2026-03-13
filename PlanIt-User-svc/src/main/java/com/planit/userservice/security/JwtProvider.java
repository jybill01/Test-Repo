package com.planit.userservice.security;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtProvider {
    
    private final SecretKey secretKey;
    private final long accessTokenValidityMs;
    private final long refreshTokenValidityMs;
    
    public JwtProvider(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.access-token-validity}") long accessTokenValidityMs,
        @Value("${jwt.refresh-token-validity}") long refreshTokenValidityMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidityMs = accessTokenValidityMs;
        this.refreshTokenValidityMs = refreshTokenValidityMs;
    }
    
    public String createAccessToken(String userId) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidityMs);
        
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
    
    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidityMs);
        
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.error("JWT token expired: {}", e.getMessage());
            throw new CustomException(ErrorCode.C4011);
        } catch (SignatureException | MalformedJwtException e) {
            log.error("JWT token invalid: {}", e.getMessage());
            throw new CustomException(ErrorCode.U4015);
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.U4015);
        }
    }
    
    public String getUserIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims.getSubject();
        } catch (ExpiredJwtException e) {
            log.error("JWT token expired: {}", e.getMessage());
            throw new CustomException(ErrorCode.C4011);
        } catch (SignatureException | MalformedJwtException e) {
            log.error("JWT token invalid: {}", e.getMessage());
            throw new CustomException(ErrorCode.U4015);
        } catch (Exception e) {
            log.error("JWT parsing failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.U4015);
        }
    }
}
