package com.planit.strategy.domain.trend.entity;

import com.planit.strategy.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "trend")
@SQLDelete(sql = "UPDATE trend SET deleted_at = CURRENT_TIMESTAMP(6) WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Trend extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 트렌드 생성 배치
     * 같은 배치에서 생성된 트렌드들은 동일한 batch를 참조
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private TrendBatch batch;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @Column(nullable = false)
    private String mainKeyword;
    
    @Column(nullable = false)
    private String headline;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(nullable = false)
    private Double score;
}
