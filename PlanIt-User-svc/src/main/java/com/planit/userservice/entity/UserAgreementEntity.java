package com.planit.userservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 유저별 약관 동의 이력 엔티티
 * - 90일 보관 정책 근거 데이터
 */
@Entity
@Table(name = "user_agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAgreementEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agreement_id")
    private Long agreementId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "term_id", nullable = false)
    private TermEntity term;
    
    @Column(name = "agreed_at")
    @Builder.Default
    private LocalDateTime agreedAt = LocalDateTime.now();
    
    // Helper methods
    public String getUserId() {
        return user != null ? user.getUserId() : null;
    }
}
