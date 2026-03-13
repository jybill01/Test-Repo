package com.planit.strategy.domain.trend.service;

import com.planit.strategy.domain.trend.dto.CategoryResponse;
import com.planit.strategy.domain.trend.entity.Category;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryQueryService {
    private final CategoryRepository categoryRepository;
    
    public List<CategoryResponse> getCategories() {
        log.info("카테고리 목록 조회");
        
        List<Category> categories = categoryRepository.findByDeletedAtIsNull();
        
        log.info("카테고리 조회 완료 - Count: {}", categories.size());
        
        return categories.stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }
}
