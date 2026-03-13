package com.planit.strategy.domain.trend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 트렌드 생성 배치 엔티티
 * 트렌드 생성(generate-all) 실행 단위를 관리
 * 각 배치는 하나의 트렌드 생성 실행을 나타냄
 */
@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "trend_batch")
@EntityListeners(AuditingEntityListener.class)
public class TrendBatch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
