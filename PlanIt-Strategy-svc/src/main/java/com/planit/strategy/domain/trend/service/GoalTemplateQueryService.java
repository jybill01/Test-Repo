package com.planit.strategy.domain.trend.service;

import com.planit.strategy.domain.trend.dto.AllGoalsResponse;
import com.planit.strategy.domain.trend.dto.GoalTemplateResponse;
import com.planit.strategy.domain.trend.entity.AiGoalTemplate;
import com.planit.strategy.domain.trend.entity.Category;
import com.planit.strategy.domain.trend.entity.Trend;
import com.planit.strategy.domain.trend.repository.AiGoalTemplateRepository;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
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
public class GoalTemplateQueryService {
    private final TrendRepository trendRepository;
    private final AiGoalTemplateRepository aiGoalTemplateRepository;
    private final CategoryRepository categoryRepository;
    
    public List<GoalTemplateResponse> getGoalsByTrend(Long trendId) {
        log.info("트렌드별 목표 조회 - Trend ID: {}", trendId);
        
        Trend trend = trendRepository.findById(trendId)
                .orElseThrow(() -> new IllegalArgumentException("Trend not found: " + trendId));
        
        List<AiGoalTemplate> goalTemplates = aiGoalTemplateRepository.findByTrendAndDeletedAtIsNull(trend);
        
        log.info("목표 조회 완료 - Trend: {}, Count: {}", trend.getHeadline(), goalTemplates.size());
        
        return goalTemplates.stream()
                .map(GoalTemplateResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 전체 카테고리의 트렌드별 목표 조회
     */
    public AllGoalsResponse getAllGoals() {
        log.info("전체 카테고리 트렌드별 목표 조회 시작");
        
        List<Category> categories = categoryRepository.findByDeletedAtIsNull();
        List<AllGoalsResponse.CategoryGoals> categoryGoalsList = new ArrayList<>();
        
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
            
            if (trends.isEmpty()) {
                continue;
            }
            
            // 각 트렌드별 목표 조회
            List<AllGoalsResponse.TrendGoals> trendGoalsList = new ArrayList<>();
            for (Trend trend : trends) {
                List<AiGoalTemplate> goalTemplates = aiGoalTemplateRepository.findByTrendAndDeletedAtIsNull(trend);
                
                if (!goalTemplates.isEmpty()) {
                    List<GoalTemplateResponse> goals = goalTemplates.stream()
                            .map(GoalTemplateResponse::from)
                            .collect(Collectors.toList());
                    
                    trendGoalsList.add(AllGoalsResponse.TrendGoals.builder()
                            .trendId(trend.getId())
                            .mainKeyword(trend.getMainKeyword())
                            .headline(trend.getHeadline())
                            .goals(goals)
                            .build());
                }
            }
            
            if (!trendGoalsList.isEmpty()) {
                categoryGoalsList.add(AllGoalsResponse.CategoryGoals.builder()
                        .categoryId(category.getId())
                        .categoryName(category.getName())
                        .trends(trendGoalsList)
                        .build());
                
                log.debug("카테고리 목표 조회 완료 - Category: {}, Trends: {}, Total Goals: {}", 
                        category.getName(), 
                        trendGoalsList.size(),
                        trendGoalsList.stream().mapToInt(t -> t.getGoals().size()).sum());
            }
        }
        
        int totalGoals = categoryGoalsList.stream()
                .flatMap(c -> c.getTrends().stream())
                .mapToInt(t -> t.getGoals().size())
                .sum();
        
        log.info("전체 카테고리 트렌드별 목표 조회 완료 - Categories: {}, Total Goals: {}", 
                categoryGoalsList.size(), totalGoals);
        
        return AllGoalsResponse.builder()
                .categories(categoryGoalsList)
                .build();
    }
}
