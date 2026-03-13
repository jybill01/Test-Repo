package com.planit.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

/**
 * 캐시 무효화 서비스
 * - 관리자가 카테고리나 약관을 수정할 때 캐시를 무효화
 * - 수동으로 캐시를 초기화할 수 있는 메서드 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {
    
    private final CacheManager cacheManager;
    
    /**
     * 카테고리 캐시 무효화
     */
    @CacheEvict(value = "categories", allEntries = true)
    public void evictCategoriesCache() {
        log.info("Categories cache evicted");
    }
    
    /**
     * 약관 캐시 무효화
     */
    @CacheEvict(value = "terms", allEntries = true)
    public void evictTermsCache() {
        log.info("Terms cache evicted");
    }
    
    /**
     * 특정 타입의 약관 캐시만 무효화
     */
    @CacheEvict(value = "terms", key = "#type")
    public void evictTermsCacheByType(String type) {
        log.info("Terms cache evicted for type: {}", type);
    }
    
    /**
     * 모든 캐시 무효화
     */
    public void evictAllCaches() {
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.info("Cache cleared: {}", cacheName);
            }
        });
        log.info("All caches evicted");
    }
}
