package com.planit.userservice.entity;

import com.planit.basetemplate.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 사용자 엔티티
 * - UUID v7을 PK로 사용
 * - Soft Delete 패턴 적용
 * - Cognito 연동 (cognito_sub)
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE user_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class UserEntity extends BaseTimeEntity {
    
    @Id
    @Column(name = "user_id", length = 36, nullable = false)
    private String userId; // UUID v7
    
    @Column(unique = true, nullable = false, length = 50)
    private String nickname;
    
    @Column(unique = true, nullable = false, length = 100)
    private String email;
    
    @Column(name = "cognito_sub", unique = true, nullable = false, length = 100)
    private String cognitoSub;
    
    @Column(name = "is_retention_agreed")
    @Builder.Default
    private Boolean isRetentionAgreed = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // 관심 카테고리 (1:N)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserInterestEntity> interests = new ArrayList<>();
    
    // 약관 동의 이력 (1:N)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private List<UserAgreementEntity> agreements = new ArrayList<>();
}
