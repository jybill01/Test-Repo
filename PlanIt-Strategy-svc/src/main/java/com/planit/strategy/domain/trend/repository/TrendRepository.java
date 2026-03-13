package com.planit.strategy.domain.trend.repository;

import com.planit.strategy.domain.trend.entity.Category;
import com.planit.strategy.domain.trend.entity.Trend;
import com.planit.strategy.domain.trend.entity.TrendBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrendRepository extends JpaRepository<Trend, Long> {
    
    @Modifying
    @Query(value = "UPDATE trend SET deleted_at = CURRENT_TIMESTAMP(6) WHERE category_id = :#{#category.id} AND deleted_at IS NULL", nativeQuery = true)
    void softDeleteByCategory(@Param("category") Category category);
    
    /**
     * 특정 카테고리의 최신 배치 조회
     */
    @Query("SELECT t.batch FROM Trend t WHERE t.category = :category AND t.deletedAt IS NULL ORDER BY t.batch.createdAt DESC LIMIT 1")
    Optional<TrendBatch> findLatestBatchByCategory(@Param("category") Category category);
    
    /**
     * 특정 배치의 카테고리별 트렌드 조회 (점수 내림차순)
     */
    @Query("SELECT t FROM Trend t WHERE t.batch = :batch AND t.category = :category AND t.deletedAt IS NULL ORDER BY t.score DESC")
    List<Trend> findByBatchAndCategoryOrderByScoreDesc(
            @Param("batch") TrendBatch batch,
            @Param("category") Category category);
}
