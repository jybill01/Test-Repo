package com.planit.strategy.domain.trend.repository;

import com.planit.strategy.domain.trend.entity.TrendBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrendBatchRepository extends JpaRepository<TrendBatch, Long> {
    
    /**
     * 최신 배치 조회 (created_at 기준 내림차순)
     */
    @Query("SELECT tb FROM TrendBatch tb ORDER BY tb.createdAt DESC LIMIT 1")
    Optional<TrendBatch> findLatestBatch();
}
