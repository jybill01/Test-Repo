package com.planit.userservice.service;

import com.planit.userservice.dto.TermResponse;
import com.planit.userservice.entity.TermEntity;
import com.planit.userservice.repository.TermRepository;
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
public class TermService {
    
    private final TermRepository termRepository;
    
    /**
     * 약관 목록 조회 (Redis 캐싱 적용)
     * - 캐시 키: "terms::{type}" (type이 null이면 "terms::all")
     * - TTL: 1시간 (CacheConfig에서 설정)
     * - 약관은 자주 변경되지 않으므로 캐싱 효과가 큼
     */
    @Cacheable(value = "terms", key = "#type != null ? #type : 'all'")
    @Transactional(readOnly = true)
    public List<TermResponse> getTerms(String type) {
        log.info("Fetching terms from database (cache miss) - type: {}", type);
        List<TermEntity> terms;
        
        if (type != null && !type.isEmpty()) {
            terms = termRepository.findByType(type);
        } else {
            terms = termRepository.findAll();
        }
        
        return terms.stream()
                .map(term -> TermResponse.builder()
                        .termId(term.getTermId())
                        .title(term.getTitle())
                        .content(term.getContent())
                        .version(term.getVersion())
                        .isRequired(term.getIsRequired())
                        .type(term.getType())
                        .build())
                .collect(Collectors.toList());
    }
}
