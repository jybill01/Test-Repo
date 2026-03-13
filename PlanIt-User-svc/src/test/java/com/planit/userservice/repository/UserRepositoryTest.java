package com.planit.userservice.repository;

import com.planit.userservice.entity.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * UserRepository 통합 테스트
 * - @DataJpaTest: JPA 관련 컴포넌트만 로드하여 테스트
 * - TestEntityManager: 테스트용 EntityManager
 */
@DataJpaTest
@DisplayName("UserRepository 통합 테스트")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        testUser = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("testuser")
                .email("test@example.com")
                .cognitoSub("cognito-sub-123")
                .isRetentionAgreed(true)
                .build();
    }

    @Test
    @DisplayName("사용자 저장 및 조회 성공")
    void saveAndFindUser_Success() {
        // given
        UserEntity savedUser = userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        // when
        Optional<UserEntity> foundUser = userRepository.findById(savedUser.getUserId());

        // then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getNickname()).isEqualTo("testuser");
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
        assertThat(foundUser.get().getCognitoSub()).isEqualTo("cognito-sub-123");
    }

    @Test
    @DisplayName("CognitoSub로 사용자 조회 성공")
    void findByCognitoSub_Success() {
        // given
        userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        // when
        Optional<UserEntity> foundUser = userRepository.findByCognitoSub("cognito-sub-123");

        // then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getNickname()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("CognitoSub로 사용자 조회 실패 - 존재하지 않음")
    void findByCognitoSub_NotFound() {
        // when
        Optional<UserEntity> foundUser = userRepository.findByCognitoSub("non-existent-sub");

        // then
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("닉네임으로 사용자 조회 성공")
    void findByNickname_Success() {
        // given
        userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        // when
        Optional<UserEntity> foundUser = userRepository.findByNickname("testuser");

        // then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("닉네임 존재 여부 확인 - 존재함")
    void existsByNickname_True() {
        // given
        userRepository.save(testUser);
        entityManager.flush();

        // when
        boolean exists = userRepository.existsByNickname("testuser");

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("닉네임 존재 여부 확인 - 존재하지 않음")
    void existsByNickname_False() {
        // when
        boolean exists = userRepository.existsByNickname("nonexistent");

        // then
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("CognitoSub 존재 여부 확인 - 존재함")
    void existsByCognitoSub_True() {
        // given
        userRepository.save(testUser);
        entityManager.flush();

        // when
        boolean exists = userRepository.existsByCognitoSub("cognito-sub-123");

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("닉네임 부분 검색 성공 - 대소문자 무시")
    void findByNicknameContaining_Success() {
        // given
        UserEntity user1 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("TestUser1")
                .email("test1@example.com")
                .cognitoSub("sub-1")
                .build();

        UserEntity user2 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("TestUser2")
                .email("test2@example.com")
                .cognitoSub("sub-2")
                .build();

        UserEntity user3 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("AnotherUser")
                .email("another@example.com")
                .cognitoSub("sub-3")
                .build();

        userRepository.save(user1);
        userRepository.save(user2);
        userRepository.save(user3);
        entityManager.flush();
        entityManager.clear();

        // when
        List<UserEntity> results = userRepository.findByNicknameContainingIgnoreCaseAndDeletedAtIsNull("testuser");

        // then
        assertThat(results).hasSize(2);
        assertThat(results).extracting(UserEntity::getNickname)
                .containsExactlyInAnyOrder("TestUser1", "TestUser2");
    }

    @Test
    @DisplayName("Soft Delete 동작 확인 - 삭제된 사용자는 조회되지 않음")
    void softDelete_UserNotFound() {
        // given
        UserEntity savedUser = userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        // when - Soft Delete 실행
        userRepository.delete(savedUser);
        entityManager.flush();
        entityManager.clear();

        // then - 일반 조회에서는 찾을 수 없음
        Optional<UserEntity> foundUser = userRepository.findById(savedUser.getUserId());
        assertThat(foundUser).isEmpty();

        Optional<UserEntity> foundByCognito = userRepository.findByCognitoSub("cognito-sub-123");
        assertThat(foundByCognito).isEmpty();
    }

    @Test
    @DisplayName("Soft Delete 후 닉네임 검색에서 제외됨")
    void softDelete_ExcludedFromSearch() {
        // given
        UserEntity user1 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("TestUser1")
                .email("test1@example.com")
                .cognitoSub("sub-1")
                .build();

        UserEntity user2 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("TestUser2")
                .email("test2@example.com")
                .cognitoSub("sub-2")
                .build();

        userRepository.save(user1);
        UserEntity savedUser2 = userRepository.save(user2);
        entityManager.flush();
        entityManager.clear();

        // when - user2 삭제
        userRepository.delete(savedUser2);
        entityManager.flush();
        entityManager.clear();

        // then - 검색 결과에 user1만 포함
        List<UserEntity> results = userRepository.findByNicknameContainingIgnoreCaseAndDeletedAtIsNull("testuser");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getNickname()).isEqualTo("TestUser1");
    }

    @Test
    @DisplayName("사용자 정보 업데이트 성공")
    void updateUser_Success() {
        // given
        UserEntity savedUser = userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        // when
        UserEntity userToUpdate = userRepository.findById(savedUser.getUserId()).orElseThrow();
        userToUpdate.setNickname("updatedNickname");
        userToUpdate.setIsRetentionAgreed(false);
        userRepository.save(userToUpdate);
        entityManager.flush();
        entityManager.clear();

        // then
        UserEntity updatedUser = userRepository.findById(savedUser.getUserId()).orElseThrow();
        assertThat(updatedUser.getNickname()).isEqualTo("updatedNickname");
        assertThat(updatedUser.getIsRetentionAgreed()).isFalse();
    }
}
