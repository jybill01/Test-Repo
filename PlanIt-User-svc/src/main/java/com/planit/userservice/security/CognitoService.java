package com.planit.userservice.security;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDeleteUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserResponse;

import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class CognitoService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;
    private final boolean isLocalProfile;

    public CognitoService(
            CognitoIdentityProviderClient cognitoClient,
            @Value("${aws.cognito.user-pool-id}") String userPoolId,
            @Value("${spring.profiles.active:default}") String activeProfile) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
        this.isLocalProfile = "local-no-redis".equals(activeProfile) || "dummy".equals(userPoolId);
    }

    public String validateIdTokenAndGetCognitoSub(String idToken) {
        // ID Token은 JWT 형식이므로 로컬 메모리에서 물리적으로 파싱하여 sub를 추출할 수 있습니다.
        // GetUser API는 Access Token을 요구하므로 ID Token을 보내면 Invalid Access Token 오류가
        // 발생합니다.
        log.info("Extracting sub from ID Token locally to avoid unnecessary network overhead and token type mismatch");
        return extractSubFromToken(idToken);
    }

    // JWT Base64URL 패딩 보정 (JWT는 표준상 패딩 없이 인코딩됨)
    private String addBase64Padding(String base64) {
        int remainder = base64.length() % 4;
        if (remainder == 2)
            return base64 + "==";
        if (remainder == 3)
            return base64 + "=";
        return base64;
    }

    // ✅ 추가 - idToken에서 email 추출
    public String extractEmailFromToken(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new CustomException(ErrorCode.U4013);
            }

            byte[] decodedBytes = Base64.getUrlDecoder().decode(addBase64Padding(parts[1]));
            String payload = new String(decodedBytes);

            Matcher matcher = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"").matcher(payload);
            if (matcher.find()) {
                String email = matcher.group(1);
                log.info("Extracted email from token: {}", email);
                return email;
            }

            throw new CustomException(ErrorCode.U4013);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract email from token: {}", e.getMessage());
            throw new CustomException(ErrorCode.U4013);
        }
    }

    private String extractSubFromToken(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new CustomException(ErrorCode.U4013);
            }

            byte[] decodedBytes = Base64.getUrlDecoder().decode(addBase64Padding(parts[1]));
            String payload = new String(decodedBytes);
            log.info("Token payload: {}", payload);

            Matcher matcher = Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]+)\"").matcher(payload);
            if (matcher.find()) {
                String sub = matcher.group(1);
                log.info("Extracted sub from token: {}", sub);
                return sub;
            }

            throw new CustomException(ErrorCode.U4013);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract sub from token: {}", e.getMessage());
            throw new CustomException(ErrorCode.U4013);
        }
    }

    public void deleteUser(String cognitoSub) {
        if (isLocalProfile) {
            log.info("Local profile detected - skipping Cognito user deletion");
            return;
        }

        try {
            AdminDeleteUserRequest request = AdminDeleteUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(cognitoSub)
                    .build();
            cognitoClient.adminDeleteUser(request);
            log.info("Cognito user deleted: {}", cognitoSub);
        } catch (Exception e) {
            log.error("Failed to delete Cognito user: {}", e.getMessage());
        }
    }
}
