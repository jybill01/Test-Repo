/**
 * [PlanIt Strategy Service - Bedrock Client]
 * AWS Bedrock을 사용한 LLM 클라이언트 구현
 * Claude 모델 호출 시 anthropic_version 필드 포함
 * @since 2026-03-03
 */
package com.planit.strategy.infrastructure.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class BedrockClient implements LlmClient {
    private final BedrockRuntimeClient client;
    private final String modelId;
    private final double temperature;
    private final ObjectMapper objectMapper;

    public BedrockClient(
            @Value("${BEDROCK_MODEL_ID:us.anthropic.claude-sonnet-4-20250514-v1:0}") String modelId,
            @Value("${BEDROCK_TEMPERATURE:0.7}") double temperature,
            @Value("${BEDROCK_SOCKET_TIMEOUT_SECONDS:180}") int socketTimeoutSeconds,
            @Value("${BEDROCK_CONNECTION_TIMEOUT_SECONDS:10}") int connectionTimeoutSeconds,
            @Value("${BEDROCK_API_TIMEOUT_SECONDS:180}") int apiTimeoutSeconds,
            @Value("${AWS_REGION:ap-northeast-2}") String region,
            @Value("${AWS_ACCESS_KEY:}") String accessKey,
            @Value("${AWS_SECRET_KEY:}") String secretKey) {
        this.modelId = modelId.trim();
        this.temperature = temperature;
        this.objectMapper = new ObjectMapper();
        
        String trimmedRegion = region.trim();
        software.amazon.awssdk.auth.credentials.AwsCredentialsProvider credentialsProvider;
        
        if (accessKey != null && !accessKey.isBlank()) {
            log.info("🔑 Bedrock용 수동 설정된 AWS Credentials 사용");
            credentialsProvider = software.amazon.awssdk.auth.credentials.StaticCredentialsProvider.create(
                software.amazon.awssdk.auth.credentials.AwsBasicCredentials.create(accessKey.trim(), secretKey.trim())
            );
        } else {
            log.info("💻 Bedrock용 기본 AWS 자격 증명 시스템(DefaultCredentialsProvider) 사용");
            credentialsProvider = DefaultCredentialsProvider.create();
        }

        ClientOverrideConfiguration overrideConfiguration = ClientOverrideConfiguration.builder()
            .apiCallTimeout(Duration.ofSeconds(apiTimeoutSeconds))
            .apiCallAttemptTimeout(Duration.ofSeconds(apiTimeoutSeconds))
            .build();
        
        this.client = BedrockRuntimeClient.builder()
                .region(Region.of(trimmedRegion))
                .credentialsProvider(credentialsProvider)
            .httpClientBuilder(ApacheHttpClient.builder()
                .socketTimeout(Duration.ofSeconds(socketTimeoutSeconds))
                .connectionTimeout(Duration.ofSeconds(connectionTimeoutSeconds)))
            .overrideConfiguration(overrideConfiguration)
                .build();
        log.info("✅ Bedrock Client 초기화 완료 - Region: {}, Model: {}, SocketTimeout: {}s, ApiTimeout: {}s",
            trimmedRegion, this.modelId, socketTimeoutSeconds, apiTimeoutSeconds);
    }

    @Override
    public String generate(String systemPrompt, String userPrompt) throws LlmException {
        try {
            String payload = buildPayload(systemPrompt, userPrompt);
            log.debug("Bedrock 요청 페이로드: {}", payload);
            
            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(modelId)
                    .body(SdkBytes.fromUtf8String(payload))
                    .build();

            log.info("Bedrock API 호출 - Model: {}", modelId);
            InvokeModelResponse response = client.invokeModel(request);
            String responseBody = response.body().asUtf8String();
            log.debug("Bedrock 응답: {}", responseBody);
            
            return extractTextFromResponse(responseBody);
        } catch (LlmException e) {
            log.error("❌ LLM 처리 로직 에러: {}", e.getMessage());
            throw e;
        } catch (software.amazon.awssdk.services.bedrockruntime.model.ValidationException e) {
            log.error("❌ Bedrock 모델 ID 또는 페이로드 오류 (ValidationException): {}", e.getMessage());
            throw new LlmException("유효하지 않은 Bedrock 모델 설정: " + e.getMessage(), e);
        } catch (software.amazon.awssdk.services.bedrockruntime.model.AccessDeniedException e) {
            log.error("❌ Bedrock 접근 권한 없음 (AccessDeniedException): {}", e.getMessage());
            throw new LlmException("AWS Bedrock 권한 오류: 해당 모델 사용 권한을 확인하세요.", e);
        } catch (Exception e) {
            log.error("❌ Bedrock 호출 중 알 수 없는 에러 발생 - Model: {}, Error Type: {}, Message: {}", 
                    modelId, e.getClass().getSimpleName(), e.getMessage());
            e.printStackTrace();
            throw new LlmException("Bedrock LLM 호출 실패: " + e.getMessage(), e);
        }
    }

    /**
     * Claude 모델용 요청 페이로드 생성
     * 필수 필드: anthropic_version, messages, max_tokens, temperature
     */
    private String buildPayload(String systemPrompt, String userPrompt) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        
        // 1. anthropic_version 필드 (필수)
        payload.put("anthropic_version", "bedrock-2023-05-31");
        
        // 2. max_tokens 필드 (3개 카테고리 배치 처리에 충분한 크기)
        payload.put("max_tokens", 4096);
        
        // 3. temperature 필드
        payload.put("temperature", temperature);
        
        // 4. system 필드 (시스템 프롬프트)
        payload.put("system", systemPrompt);
        
        // 5. messages 배열 구조
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", userPrompt);
        messages.add(userMessage);
        payload.put("messages", messages);
        
        return objectMapper.writeValueAsString(payload);
    }

    /**
     * Claude 모델 응답에서 텍스트 추출
     * 응답 형식: { "content": [{ "type": "text", "text": "..." }], ... }
     */
    private String extractTextFromResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        
        // content 배열에서 첫 번째 항목의 text 필드 추출
        JsonNode content = root.get("content");
        if (content != null && content.isArray() && content.size() > 0) {
            JsonNode firstContent = content.get(0);
            JsonNode text = firstContent.get("text");
            if (text != null) {
                return text.asText();
            }
        }
        
        throw new LlmException("Bedrock 응답에서 텍스트를 추출할 수 없습니다. 응답: " + responseBody);
    }
}
