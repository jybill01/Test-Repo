package com.planit.strategy.domain.trend.collector;

import com.planit.strategy.domain.trend.dto.TrendGenerationInput;
import com.planit.strategy.infrastructure.news.GNewsArticle;
import com.planit.strategy.infrastructure.news.GNewsClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class GlobalNewsCollector {
    
    private final GNewsClient gNewsClient;
    
    public List<TrendGenerationInput.NewsArticle> collect(String newsKeyword) {
        log.info("뉴스 수집 시작 - Keyword: {}", newsKeyword);
        
        try {
            List<GNewsArticle> gNewsArticles = gNewsClient.searchNews(newsKeyword, 20);
            
            List<TrendGenerationInput.NewsArticle> newsArticles = gNewsArticles.stream()
                    .map(this::mapToNewsArticle)
                    .toList();
            
            log.info("뉴스 수집 완료 - Keyword: {}, Count: {}", newsKeyword, newsArticles.size());
            return newsArticles;
        } catch (Exception e) {
            log.error("뉴스 수집 실패 - Keyword: {}", newsKeyword, e);
            return new ArrayList<>();
        }
    }
    
    private TrendGenerationInput.NewsArticle mapToNewsArticle(GNewsArticle gNewsArticle) {
        return TrendGenerationInput.NewsArticle.builder()
                .title(gNewsArticle.getTitle())
                .description(gNewsArticle.getDescription())
                .url(gNewsArticle.getUrl())
                .source(gNewsArticle.getSource())
                .build();
    }
}
