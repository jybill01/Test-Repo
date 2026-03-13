package com.planit.strategy.domain.trend.service;

import com.planit.strategy.agent.AgentExecutionException;
import com.planit.strategy.domain.trend.dto.TrendGenerationSummary;
import com.planit.strategy.domain.trend.orchestrator.CategoryTrendOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TrendCommandService {
    private final CategoryTrendOrchestrator categoryTrendOrchestrator;
    
    public void generateTrends(Long categoryId) throws AgentExecutionException {
        log.info("트렌드 생성 요청 - Category ID: {}", categoryId);
        
        categoryTrendOrchestrator.generateTrendForCategory(categoryId);
        
        log.info("트렌드 생성 완료 - Category ID: {}", categoryId);
    }
    
    public TrendGenerationSummary generateAllTrends() {
        log.info("전체 카테고리 트렌드 생성 요청");
        
        TrendGenerationSummary summary = categoryTrendOrchestrator.generateAllTrends();
        
        log.info("전체 카테고리 트렌드 생성 완료 - Processed: {}/{}, Trends: {}, Goals: {}", 
                summary.getProcessedCategories(), summary.getTotalCategories(), 
                summary.getTotalTrends(), summary.getTotalGoals());
        
        return summary;
    }
}
