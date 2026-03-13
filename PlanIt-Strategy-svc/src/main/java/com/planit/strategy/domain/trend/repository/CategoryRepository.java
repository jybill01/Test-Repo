package com.planit.strategy.domain.trend.repository;

import com.planit.strategy.domain.trend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByDeletedAtIsNull();

    // User-svc에서 동기화 시 upsert
    // name만 업데이트하고 news_keyword는 유지 (Strategy-svc 고유 필드)
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO category (id, name, news_keyword, created_at, updated_at) " +
            "VALUES (:id, :name, :newsKeyword, NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW()",
            nativeQuery = true)
    void upsert(@Param("id") Long id,
                @Param("name") String name,
                @Param("newsKeyword") String newsKeyword);
}
