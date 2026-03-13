package com.planit.strategy.domain.trend.orchestrator;

import com.planit.strategy.agent.AgentExecutionException;
import com.planit.strategy.domain.trend.agent.TrendGoalGenerationAgent;
import com.planit.strategy.domain.trend.collector.GlobalNewsCollector;
import com.planit.strategy.domain.trend.dto.TrendGenerationInput;
import com.planit.strategy.domain.trend.dto.TrendGenerationSummary;
import com.planit.strategy.domain.trend.dto.llm.GeneratedGoalTemplate;
import com.planit.strategy.domain.trend.dto.llm.GeneratedTrend;
import com.planit.strategy.domain.trend.dto.llm.TrendGenerationOutput;
import com.planit.strategy.domain.trend.entity.AiGoalTemplate;
import com.planit.strategy.domain.trend.entity.Category;
import com.planit.strategy.domain.trend.entity.Trend;
import com.planit.strategy.domain.trend.entity.TrendBatch;
import com.planit.strategy.domain.trend.repository.AiGoalTemplateRepository;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import com.planit.strategy.domain.trend.repository.TrendBatchRepository;
import com.planit.strategy.domain.trend.repository.TrendRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
@Transactional
public class CategoryTrendOrchestrator {
    private final TrendGoalGenerationAgent trendGoalGenerationAgent;
    private final GlobalNewsCollector globalNewsCollector;
    private final CategoryRepository categoryRepository;
    private final TrendRepository trendRepository;
    private final TrendBatchRepository trendBatchRepository;
    private final AiGoalTemplateRepository aiGoalTemplateRepository;

    /**
     * 모든 카테고리에 대해 트렌드 생성 (배치 처리)
     * 뉴스 수집은 병렬 처리로 성능 최적화
     * LLM 호출은 3개 카테고리씩 배치로 나눠서 처리 (응답 잘림 방지)
     * @return 생성 결과 요약
     */
    public TrendGenerationSummary generateAllTrends() {
        log.info("전체 카테고리 트렌드 생성 시작");
        
        // 1. 트렌드 배치 생성
        TrendBatch batch = trendBatchRepository.save(TrendBatch.builder().build());
        log.info("트렌드 배치 생성 완료 - Batch ID: {}", batch.getId());
        
        List<Category> categories = categoryRepository.findByDeletedAtIsNull();
        log.info("활성 카테고리 수: {}", categories.size());
        
        long startTime = System.currentTimeMillis();
        
        // 배치 크기 설정 (LLM 응답 잘림 방지)
        final int BATCH_SIZE = 3;
        
        // 2. 카테고리별 뉴스 수집 (병렬 처리)
        log.info("뉴스 수집 시작 (병렬 처리) - Categories: {}", categories.size());
        
        List<CompletableFuture<CategoryNewsResult>> futures = categories.stream()
                .map(category -> CompletableFuture.supplyAsync(() -> {
                    try {
                        log.info("뉴스 수집 시작 - Category: {} (ID: {}), Keyword: {}", 
                                category.getName(), category.getId(), category.getNewsKeyword());
                        
                        List<TrendGenerationInput.NewsArticle> news = 
                                globalNewsCollector.collect(category.getNewsKeyword());
                        
                        log.info("뉴스 수집 완료 - Category: {} (ID: {}), Count: {}", 
                                category.getName(), category.getId(), news.size());
                        
                        return new CategoryNewsResult(category, news, null);
                    } catch (Exception e) {
                        log.error("뉴스 수집 실패 - Category: {} (ID: {})", 
                                category.getName(), category.getId(), e);
                        return new CategoryNewsResult(category, new ArrayList<>(), e);
                    }
                }))
                .toList();
        
        // 모든 뉴스 수집 완료 대기
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0]));
        
        allFutures.join();
        
        long newsCollectionTime = System.currentTimeMillis() - startTime;
        log.info("뉴스 수집 완료 (병렬 처리) - 소요 시간: {}ms", newsCollectionTime);
        
        // 결과 수집
        Map<Category, List<TrendGenerationInput.NewsArticle>> categoryNewsMap = new HashMap<>();
        int totalNewsCount = 0;
        int totalNewsForLLM = 0;
        int failedCategories = 0;
        
        for (CompletableFuture<CategoryNewsResult> future : futures) {
            try {
                CategoryNewsResult result = future.get();
                categoryNewsMap.put(result.category, result.news);
                totalNewsCount += result.news.size();
                
                // LLM에 전달될 뉴스는 최대 10개
                int newsForLLM = Math.min(result.news.size(), 10);
                totalNewsForLLM += newsForLLM;
                
                if (result.exception != null) {
                    failedCategories++;
                }
            } catch (Exception e) {
                log.error("뉴스 수집 결과 처리 실패", e);
                failedCategories++;
            }
        }
        
        log.info("전체 뉴스 수집 완료 - Total Collected: {}, For LLM: {}, Failed: {}", 
                totalNewsCount, totalNewsForLLM, failedCategories);

        // 뉴스가 1건도 없는 카테고리는 LLM 입력에서 제외한다.
        List<Category> categoriesForLlm = categories.stream()
                .filter(category -> {
                    List<TrendGenerationInput.NewsArticle> news = categoryNewsMap.get(category);
                    return news != null && !news.isEmpty();
                })
                .toList();

        int skippedNoNewsCategories = categories.size() - categoriesForLlm.size();
        if (skippedNoNewsCategories > 0) {
            log.warn("뉴스 없음으로 LLM 처리 제외된 카테고리 수: {}", skippedNoNewsCategories);
        }

        if (categoriesForLlm.isEmpty()) {
            log.warn("모든 카테고리 뉴스가 비어 있어 트렌드 생성을 종료합니다.");
            return TrendGenerationSummary.builder()
                    .totalCategories(categories.size())
                    .processedCategories(0)
                    .totalTrends(0)
                    .totalGoals(0)
                    .categorySummaries(new ArrayList<>())
                    .build();
        }
        
        // 3. 카테고리를 배치로 나눠서 처리
        int totalBatches = (int) Math.ceil((double) categoriesForLlm.size() / BATCH_SIZE);
        log.info("배치 처리 시작 - Total Categories: {}, Batch Size: {}, Total Batches: {}", 
                categoriesForLlm.size(), BATCH_SIZE, totalBatches);
        
        long totalLlmTime = 0;
        int processedCategories = 0;
        List<TrendGenerationSummary.CategorySummary> categorySummaries = new ArrayList<>();
        
        for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            int startIdx = batchIndex * BATCH_SIZE;
                        int endIdx = Math.min(startIdx + BATCH_SIZE, categoriesForLlm.size());
                        List<Category> batchCategories = categoriesForLlm.subList(startIdx, endIdx);
            
            log.info("배치 {}/{} 처리 시작 - Categories: {} ({}~{})", 
                    batchIndex + 1, totalBatches, batchCategories.size(), startIdx, endIdx - 1);
            
            // 배치에 해당하는 카테고리 뉴스만 추출
            List<TrendGenerationInput.CategoryNews> batchCategoryNewsList = new ArrayList<>();
            for (Category category : batchCategories) {
                List<TrendGenerationInput.NewsArticle> allNews = categoryNewsMap.get(category);
                if (allNews == null) {
                    allNews = new ArrayList<>();
                }
                
                // 최대 10개만 사용
                List<TrendGenerationInput.NewsArticle> limitedNews = allNews.stream()
                        .limit(10)
                        .toList();
                
                batchCategoryNewsList.add(TrendGenerationInput.CategoryNews.builder()
                        .categoryId(category.getId())
                        .categoryName(category.getName())
                        .news(limitedNews)
                        .build());
            }

                        if (batchCategoryNewsList.isEmpty()) {
                                log.warn("배치 {}/{}는 유효 뉴스가 없어 건너뜁니다.", batchIndex + 1, totalBatches);
                                continue;
                        }
            
            TrendGenerationInput batchInput = TrendGenerationInput.builder()
                    .categories(batchCategoryNewsList)
                    .build();
            
            // LLM 호출
            long batchLlmStartTime = System.currentTimeMillis();
            
            TrendGenerationOutput batchOutput;
            try {
                batchOutput = trendGoalGenerationAgent.execute(batchInput);
            } catch (AgentExecutionException e) {
                log.error("배치 {}/{} LLM 호출 실패", batchIndex + 1, totalBatches, e);
                continue; // 다음 배치 계속 처리
            }
            
            long batchLlmTime = System.currentTimeMillis() - batchLlmStartTime;
            totalLlmTime += batchLlmTime;
            
            log.info("배치 {}/{} LLM 호출 완료 - Categories: {}, 소요 시간: {}ms", 
                    batchIndex + 1, totalBatches, batchOutput.getCategoryTrends().size(), batchLlmTime);
            
            // 배치 결과 저장
            for (TrendGenerationOutput.CategoryTrend categoryTrend : batchOutput.getCategoryTrends()) {
                Long categoryId = categoryTrend.getCategoryId();
                
                Category category = batchCategories.stream()
                        .filter(c -> c.getId().equals(categoryId))
                        .findFirst()
                        .orElse(null);
                
                if (category == null) {
                    log.warn("카테고리를 찾을 수 없음 - Category ID: {}", categoryId);
                    continue;
                }
                
                try {
                    int trendCount = categoryTrend.getTrends().size();
                    int goalCount = categoryTrend.getTrends().stream()
                            .mapToInt(t -> t.getGoals().size())
                            .sum();
                    
                    saveTrendsForCategory(category, categoryTrend.getTrends(), batch);
                    processedCategories++;
                    
                    // 카테고리별 요약 정보 추가
                    categorySummaries.add(TrendGenerationSummary.CategorySummary.builder()
                            .categoryId(category.getId())
                            .categoryName(category.getName())
                            .trendCount(trendCount)
                            .goalCount(goalCount)
                            .build());
                    
                    log.info("트렌드 저장 완료 - Category: {} (ID: {}), Trends: {}, Goals: {}", 
                            category.getName(), categoryId, trendCount, goalCount);
                } catch (Exception e) {
                    log.error("트렌드 저장 실패 - Category: {} (ID: {})", category.getName(), categoryId, e);
                }
            }
            
            log.info("배치 {}/{} 처리 완료 - Processed: {}/{}", 
                    batchIndex + 1, totalBatches, processedCategories, categoriesForLlm.size());
        }
        
        // 전체 통계 계산
        int totalTrends = categorySummaries.stream()
                .mapToInt(TrendGenerationSummary.CategorySummary::getTrendCount)
                .sum();
        int totalGoals = categorySummaries.stream()
                .mapToInt(TrendGenerationSummary.CategorySummary::getGoalCount)
                .sum();
        
        long totalTime = System.currentTimeMillis() - startTime;
        log.info("전체 카테고리 트렌드 생성 완료 - 총 소요 시간: {}ms (뉴스 수집: {}ms, LLM: {}ms, 배치: {}개)", 
                totalTime, newsCollectionTime, totalLlmTime, totalBatches);
        
        // 요약 정보 반환
        return TrendGenerationSummary.builder()
                .totalCategories(categories.size())
                .processedCategories(processedCategories)
                .totalTrends(totalTrends)
                .totalGoals(totalGoals)
                .categorySummaries(categorySummaries)
                .build();
    }
    
    /**
     * 특정 카테고리에 대해 트렌드 생성
     * 단일 카테고리 처리용 (테스트 또는 수동 실행)
     */
    public void generateTrendForCategory(Long categoryId) throws AgentExecutionException {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        
        // 트렌드 배치 생성
        TrendBatch batch = trendBatchRepository.save(TrendBatch.builder().build());
        
        log.info("단일 카테고리 트렌드 생성 시작 - Category: {} (ID: {}), Batch ID: {}", 
                category.getName(), category.getId(), batch.getId());
        
        // 1. 뉴스 수집
        List<TrendGenerationInput.NewsArticle> allNews = 
                globalNewsCollector.collect(category.getNewsKeyword());
        
        // 최대 10개만 사용
        List<TrendGenerationInput.NewsArticle> limitedNews = allNews.stream()
                .limit(10)
                .toList();
        
        log.info("뉴스 수집 완료 - Category: {} (ID: {}), Collected: {}, For LLM: {}", 
                category.getName(), category.getId(), allNews.size(), limitedNews.size());

        if (limitedNews.isEmpty()) {
            log.warn("카테고리 '{}' (ID: {}) 뉴스가 비어 있어 LLM 호출을 생략합니다.",
                    category.getName(), category.getId());
            return;
        }
        
        // 2. LLM 입력 생성 (단일 카테고리)
        TrendGenerationInput input = TrendGenerationInput.builder()
                .categories(List.of(
                        TrendGenerationInput.CategoryNews.builder()
                                .categoryId(category.getId())
                                .categoryName(category.getName())
                                .news(limitedNews)
                                .build()
                ))
                .build();
        
        // 3. LLM 호출
        log.info("LLM 호출 시작 - Category: {} (ID: {}), News: {}", 
                category.getName(), category.getId(), limitedNews.size());
        
        TrendGenerationOutput output = trendGoalGenerationAgent.execute(input);
        
        log.info("LLM 호출 완료 - Category Trends: {}", output.getCategoryTrends().size());
        
        // 4. 트렌드 저장
        if (!output.getCategoryTrends().isEmpty()) {
            saveTrendsForCategory(category, output.getCategoryTrends().get(0).getTrends(), batch);
        }
        
        log.info("단일 카테고리 트렌드 생성 완료 - Category: {} (ID: {})", category.getName(), category.getId());
    }
    
    /**
     * 카테고리별 트렌드 저장
     */
    private void saveTrendsForCategory(Category category, List<GeneratedTrend> generatedTrends, 
                                      TrendBatch batch) {
        // 1. 기존 트렌드 soft delete
        trendRepository.softDeleteByCategory(category);
        
        // 2. 새 트렌드 저장
        for (GeneratedTrend generatedTrend : generatedTrends) {
            Trend trend = Trend.builder()
                    .batch(batch)
                    .category(category)
                    .mainKeyword(generatedTrend.getMainKeyword())
                    .headline(generatedTrend.getHeadline())
                    .summary(generatedTrend.getSummary())
                    .score(generatedTrend.getScore())
                    .build();
            
            Trend savedTrend = trendRepository.save(trend);
            
            // 3. 목표 저장
            for (GeneratedGoalTemplate generatedGoal : generatedTrend.getGoals()) {
                AiGoalTemplate goalTemplate = AiGoalTemplate.builder()
                        .trend(savedTrend)
                        .title(generatedGoal.getTitle())
                        .description(generatedGoal.getDescription())
                        .build();
                
                aiGoalTemplateRepository.save(goalTemplate);
            }
        }
    }
    
    /**
     * 뉴스 수집 결과를 담는 내부 클래스
     */
    private static class CategoryNewsResult {
        final Category category;
        final List<TrendGenerationInput.NewsArticle> news;
        final Exception exception;
        
        CategoryNewsResult(Category category, List<TrendGenerationInput.NewsArticle> news, Exception exception) {
            this.category = category;
            this.news = news;
            this.exception = exception;
        }
    }
}
