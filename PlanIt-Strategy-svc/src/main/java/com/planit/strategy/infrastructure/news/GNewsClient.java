package com.planit.strategy.infrastructure.news;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class GNewsClient {
    private final WebClient webClient;
    private final String apiKey;
    private final ObjectMapper objectMapper;
    
    public GNewsClient(
            @Value("${gnews.base-url:https://gnews.io/api/v4}") String baseUrl,
            @Value("${gnews.api-key}") String apiKey,
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .build();
    }
    
    /**
     * GNews API를 호출하여 뉴스 기사 검색
     * 
     * @param keyword 검색 키워드
     * @param maxResults 최대 결과 수 (기본 20개)
     * @return 뉴스 기사 리스트
     */
    public List<GNewsArticle> searchNews(String keyword, int maxResults) {
        try {
            log.info("GNews API 호출 시작 - Keyword: {}, Max: {}", keyword, maxResults);
            
            String response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("q", keyword)
                            .queryParam("lang", "en")
                            .queryParam("max", maxResults)
                            .queryParam("token", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            List<GNewsArticle> articles = parseResponse(response);
            log.info("GNews API 호출 성공 - 기사 수: {}", articles.size());
            
            return articles;
        } catch (WebClientResponseException e) {
            log.error("GNews API 호출 실패 - Status: {}, Body: {}", 
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("GNews API 호출 중 예외 발생", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * GNews API 응답 JSON 파싱
     * 
     * 응답 구조:
     * {
     *   "articles": [
     *     {
     *       "title": "...",
     *       "description": "...",
     *       "url": "...",
     *       "source": {
     *         "name": "TechCrunch"
     *       }
     *     }
     *   ]
     * }
     */
    private List<GNewsArticle> parseResponse(String response) throws Exception {
        List<GNewsArticle> articles = new ArrayList<>();
        
        JsonNode root = objectMapper.readTree(response);
        JsonNode articlesNode = root.get("articles");
        
        if (articlesNode == null || !articlesNode.isArray()) {
            log.warn("GNews API 응답에 articles 배열이 없음");
            return articles;
        }
        
        for (JsonNode articleNode : articlesNode) {
            try {
                String title = articleNode.get("title").asText();
                String description = articleNode.has("description") 
                        ? articleNode.get("description").asText() 
                        : "";
                String url = articleNode.get("url").asText();
                
                String sourceName = "Unknown";
                if (articleNode.has("source")) {
                    JsonNode sourceNode = articleNode.get("source");
                    if (sourceNode.has("name")) {
                        sourceName = sourceNode.get("name").asText();
                    }
                }
                
                GNewsArticle article = GNewsArticle.builder()
                        .title(title)
                        .description(description)
                        .url(url)
                        .source(sourceName)
                        .build();
                
                articles.add(article);
            } catch (Exception e) {
                log.warn("기사 파싱 실패, 건너뜀", e);
            }
        }
        
        return articles;
    }
}
