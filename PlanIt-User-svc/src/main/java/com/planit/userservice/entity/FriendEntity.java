package com.planit.userservice.entity;

import com.planit.basetemplate.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * 친구 관계 엔티티
 * - 상태: PENDING, ACCEPTED, REJECTED
 * - Soft Delete 적용
 */
@Entity
@Table(name = "friends")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE friends SET deleted_at = NOW() WHERE friendship_id = ?")
@SQLRestriction("deleted_at IS NULL")
public class FriendEntity extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "friendship_id")
    private Long friendshipId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private UserEntity requester;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private UserEntity approver;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    private FriendStatus status;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // Helper methods
    public String getRequesterId() {
        return requester != null ? requester.getUserId() : null;
    }
    
    public String getApproverId() {
        return approver != null ? approver.getUserId() : null;
    }
}
