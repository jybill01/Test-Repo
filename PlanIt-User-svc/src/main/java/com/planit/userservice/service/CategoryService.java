package com.planit.userservice.service;

import com.planit.userservice.dto.CategoryResponse;
import com.planit.userservice.entity.InterestCategoryEntity;
import com.planit.userservice.repository.InterestCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final InterestCategoryRepository interestCategoryRepository;
    
    /**
     * 카테고리 목록 조회
     * - 카테고리는 자주 변경되지 않으므로 캐싱 효과가 큼
     * - TODO: Redis 설정 후 @Cacheable 어노테이션 추가
     */
    // @Cacheable(value = "categories", key = "'all'")
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        log.info("Fetching categories from database");
        List<InterestCategoryEntity> categories = interestCategoryRepository.findAll();
        
        return categories.stream()
                .map(category -> CategoryResponse.builder()
                        .categoryId(category.getCategoryId())
                        .name(category.getName())
                        .colorHex(category.getColorHex())
                        .description(category.getDescription())
                        .build())
                .collect(Collectors.toList());
    }
}
