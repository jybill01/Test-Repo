package com.planit.userservice.repository;

import com.planit.userservice.entity.FriendEntity;
import com.planit.userservice.entity.FriendStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendRepository extends JpaRepository<FriendEntity, Long> {
    
    /**
     * Approver의 특정 상태 친구 요청 조회
     * - 인덱스 활용: idx_friends_approver_status_deleted
     * - Fetch Join으로 N+1 문제 해결
     */
    @Query("SELECT f FROM FriendEntity f " +
           "JOIN FETCH f.requester " +
           "WHERE f.approver.userId = :approverId " +
           "AND f.status = :status " +
           "AND f.deletedAt IS NULL " +
           "ORDER BY f.createdAt DESC")
    Page<FriendEntity> findByApproverIdAndStatusWithRequester(
        @Param("approverId") String approverId, 
        @Param("status") FriendStatus status, 
        Pageable pageable
    );
    
    /**
     * 사용자의 친구 목록 조회 (양방향)
     * - 인덱스 활용: idx_friends_requester_status_deleted, idx_friends_approver_status_deleted
     * - Fetch Join으로 N+1 문제 해결
     * - 닉네임 가나다순 정렬
     */
    @Query("SELECT f FROM FriendEntity f " +
           "LEFT JOIN FETCH f.requester r " +
           "LEFT JOIN FETCH f.approver a " +
           "WHERE (f.requester.userId = :userId OR f.approver.userId = :userId) " +
           "AND f.status = :status " +
           "AND f.deletedAt IS NULL " +
           "ORDER BY CASE " +
           "  WHEN f.requester.userId = :userId THEN a.nickname " +
           "  ELSE r.nickname " +
           "END ASC")
    Page<FriendEntity> findFriendsByUserIdAndStatusWithUsers(
        @Param("userId") String userId,
        @Param("status") FriendStatus status,
        Pageable pageable
    );
    
    /**
     * 사용자의 모든 친구 관계 Soft Delete
     * - 인덱스 활용: idx_friends_requester_status_deleted, idx_friends_approver_status_deleted
     */
    @Modifying
    @Query("UPDATE FriendEntity f SET f.deletedAt = CURRENT_TIMESTAMP WHERE " +
           "(f.requester.userId = :userId OR f.approver.userId = :userId) " +
           "AND f.deletedAt IS NULL")
    void softDeleteByUserId(@Param("userId") String userId);
    
    /**
     * 친구 관계 존재 여부 확인
     * - 인덱스 활용: idx_friends_requester_approver_deleted
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FriendEntity f " +
           "WHERE f.requester.userId = :requesterId " +
           "AND f.approver.userId = :approverId " +
           "AND f.deletedAt IS NULL")
    boolean existsByRequesterIdAndApproverIdAndDeletedAtIsNull(
        @Param("requesterId") String requesterId,
        @Param("approverId") String approverId
    );

    /**
     * 두 사용자가 서로 '수락된' 친구 관계인지 확인
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FriendEntity f " +
           "WHERE ((f.requester.userId = :user1 AND f.approver.userId = :user2) " +
           "OR (f.requester.userId = :user2 AND f.approver.userId = :user1)) " +
           "AND f.status = 'ACCEPTED' " +
           "AND f.deletedAt IS NULL")
    boolean existsAcceptedFriendship(@Param("user1") String user1, @Param("user2") String user2);
}
