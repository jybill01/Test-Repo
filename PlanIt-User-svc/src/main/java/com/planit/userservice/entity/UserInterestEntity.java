package com.planit.userservice.entity;

import com.planit.basetemplate.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * 유저별 관심 카테고리 엔티티
 * - Soft Delete 적용
 */
@Entity
@Table(name = "user_interest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE user_interest SET deleted_at = NOW() WHERE interest_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class UserInterestEntity extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interest_id")
    private Long interestId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private InterestCategoryEntity category;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // Helper methods
    public Long getCategoryId() {
        return category != null ? category.getCategoryId() : null;
    }
    
    public String getUserId() {
        return user != null ? user.getUserId() : null;
    }
}
