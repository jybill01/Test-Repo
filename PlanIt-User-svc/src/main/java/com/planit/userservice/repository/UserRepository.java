package com.planit.userservice.repository;

import com.planit.userservice.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findByCognitoSub(String cognitoSub);

    Optional<UserEntity> findByNickname(String nickname);

    boolean existsByNickname(String nickname);

    boolean existsByCognitoSub(String cognitoSub);

    boolean existsByNicknameAndDeletedAtIsNull(String nickname);

    boolean existsByCognitoSubAndDeletedAtIsNull(String cognitoSub);

    Optional<UserEntity> findByCognitoSubAndDeletedAtIsNull(String cognitoSub);

    // ✅ nativeQuery로 @Where 글로벌 필터 완전 우회
    @Query(value = "SELECT * FROM users WHERE email = :email AND deleted_at IS NOT NULL LIMIT 1",
           nativeQuery = true)
    Optional<UserEntity> findWithdrawnByEmail(@Param("email") String email);

    @Query(value = "SELECT * FROM users WHERE cognito_sub = :cognitoSub AND deleted_at IS NOT NULL LIMIT 1",
           nativeQuery = true)
    Optional<UserEntity> findWithdrawnByCognitoSub(@Param("cognitoSub") String cognitoSub);

    @Query("SELECT u FROM UserEntity u WHERE " +
           "LOWER(u.nickname) LIKE LOWER(CONCAT('%', :nickname, '%')) " +
           "AND u.deletedAt IS NULL " +
           "ORDER BY u.nickname ASC")
    List<UserEntity> searchByNickname(@Param("nickname") String nickname);
}
