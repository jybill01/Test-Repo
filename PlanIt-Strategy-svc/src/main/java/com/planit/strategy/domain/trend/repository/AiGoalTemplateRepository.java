package com.planit.strategy.domain.trend.repository;

import com.planit.strategy.domain.trend.entity.AiGoalTemplate;
import com.planit.strategy.domain.trend.entity.Trend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiGoalTemplateRepository extends JpaRepository<AiGoalTemplate, Long> {
    List<AiGoalTemplate> findByTrendAndDeletedAtIsNull(Trend trend);
}
