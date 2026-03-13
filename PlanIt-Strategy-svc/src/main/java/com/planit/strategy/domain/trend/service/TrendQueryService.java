package com.planit.strategy.domain.trend.service;

import com.planit.strategy.domain.trend.dto.AllTrendsResponse;
import com.planit.strategy.domain.trend.dto.CategoryTrendsResponse;
import com.planit.strategy.domain.trend.dto.TrendItemResponse;
import com.planit.strategy.domain.trend.entity.Category;
import com.planit.strategy.domain.trend.entity.Trend;
import com.planit.strategy.domain.trend.entity.TrendBatch;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import com.planit.strategy.domain.trend.repository.TrendBatchRepository;
import com.planit.strategy.domain.trend.repository.TrendRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrendQueryService {
    private final CategoryRepository categoryRepository;
    private final TrendRepository trendRepository;
    
    public CategoryTrendsResponse getTrendsByCategory(Long categoryId) {
        log.info("카테고리별 최신 트렌드 조회 - Category ID: {}", categoryId);
        
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        
        // 해당 카테고리의 최신 배치 조회
        var latestBatch = trendRepository.findLatestBatchByCategory(category);
        
        if (latestBatch.isEmpty()) {
            log.info("트렌드 없음 - Category: {}", category.getName());
            return CategoryTrendsResponse.builder()
                    .categoryId(category.getId())
                    .categoryName(category.getName())
                    .trends(List.of())
                    .build();
        }
        
        // 최신 배치의 트렌드만 조회 (점수 내림차순)
        List<Trend> trends = trendRepository.findByBatchAndCategoryOrderByScoreDesc(
                latestBatch.get(), category);
        
        log.info("최신 트렌드 조회 완료 - Category: {}, Batch ID: {}, Count: {}", 
                category.getName(), latestBatch.get().getId(), trends.size());
        
        List<TrendItemResponse> trendItems = trends.stream()
                .map(TrendItemResponse::from)
                .collect(Collectors.toList());
        
        return CategoryTrendsResponse.builder()
                .categoryId(category.getId())
                .categoryName(category.getName())
                .trends(trendItems)
                .build();
    }
    
    /**
     * 전체 카테고리의 최신 트렌드 조회
     */
    public AllTrendsResponse getAllTrends() {
        log.info("전체 카테고리 최신 트렌드 조회 시작");
        
        List<Category> categories = categoryRepository.findByDeletedAtIsNull();
        List<AllTrendsResponse.CategoryTrends> categoryTrendsList = new ArrayList<>();
        
        for (Category category : categories) {
            // 각 카테고리의 최신 배치 조회
            var latestBatch = trendRepository.findLatestBatchByCategory(category);
            
            if (latestBatch.isEmpty()) {
                log.debug("트렌드 없음 - Category: {}", category.getName());
                continue;
            }
            
            // 최신 배치의 트렌드 조회
            List<Trend> trends = trendRepository.findByBatchAndCategoryOrderByScoreDesc(
                    latestBatch.get(), category);
            
            if (!trends.isEmpty()) {
                List<TrendItemResponse> trendItems = trends.stream()
                        .map(TrendItemResponse::from)
                        .collect(Collectors.toList());
                
                categoryTrendsList.add(AllTrendsResponse.CategoryTrends.builder()
                        .categoryId(category.getId())
                        .categoryName(category.getName())
                        .trends(trendItems)
                        .build());
                
                log.debug("카테고리 트렌드 조회 완료 - Category: {}, Batch ID: {}, Count: {}", 
                        category.getName(), latestBatch.get().getId(), trends.size());
            }
        }
        
        log.info("전체 카테고리 최신 트렌드 조회 완료 - Categories: {}, Total Trends: {}", 
                categoryTrendsList.size(), 
                categoryTrendsList.stream().mapToInt(ct -> ct.getTrends().size()).sum());
        
        return AllTrendsResponse.builder()
                .categories(categoryTrendsList)
                .build();
    }
}
