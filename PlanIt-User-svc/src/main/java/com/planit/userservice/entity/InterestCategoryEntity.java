package com.planit.userservice.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 관심 카테고리 엔티티 (8대 표준 카테고리)
 * - 활력, 배움, 성장, 관계, 휴식, 창작, 건강, 재정
 */
@Entity
@Table(name = "interest_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterestCategoryEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;
    
    @Column(nullable = false, length = 10)
    private String name;
    
    @Column(name = "color_hex", length = 7)
    private String colorHex; // #FF6B6B
    
    @Column(columnDefinition = "TEXT")
    private String description;
}
