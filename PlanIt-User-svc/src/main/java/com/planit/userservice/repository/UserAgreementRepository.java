package com.planit.userservice.repository;

import com.planit.userservice.entity.UserAgreementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAgreementRepository extends JpaRepository<UserAgreementEntity, Long> {
    
    @Query("SELECT ua FROM UserAgreementEntity ua WHERE ua.user.userId = :userId")
    List<UserAgreementEntity> findByUserId(@Param("userId") String userId);
    
    @Query("SELECT ua FROM UserAgreementEntity ua WHERE ua.user.userId = :userId AND ua.term.termId = :termId")
    List<UserAgreementEntity> findByUserIdAndTermId(@Param("userId") String userId, @Param("termId") Integer termId);
    
    @Query("SELECT ua FROM UserAgreementEntity ua WHERE ua.user.userId = :userId AND ua.term.type = :type")
    List<UserAgreementEntity> findByUserIdAndTermType(@Param("userId") String userId, @Param("type") String type);
}
