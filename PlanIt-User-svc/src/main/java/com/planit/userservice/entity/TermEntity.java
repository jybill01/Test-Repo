package com.planit.userservice.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 약관 마스터 엔티티
 * - 서비스 이용약관, 개인정보 처리방침, 90일 보관 정책 등
 */
@Entity
@Table(name = "terms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TermEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "term_id")
    private Integer termId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false, length = 20)
    private String version; // v1.0, v1.1 등
    
    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = true;
    
    @Column(length = 20)
    private String type; // SERVICE, PRIVACY, RETENTION
}
