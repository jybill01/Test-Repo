package com.planit.userservice.repository;

import com.planit.userservice.entity.UserInterestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterestEntity, Long> {
    
    @Query("SELECT ui FROM UserInterestEntity ui WHERE ui.user.userId = :userId AND ui.deletedAt IS NULL")
    List<UserInterestEntity> findByUserIdAndDeletedAtIsNull(@Param("userId") String userId);
    
    @Modifying
    @Query("UPDATE UserInterestEntity ui SET ui.deletedAt = CURRENT_TIMESTAMP WHERE ui.user.userId = :userId AND ui.deletedAt IS NULL")
    void softDeleteByUserId(@Param("userId") String userId);
}
