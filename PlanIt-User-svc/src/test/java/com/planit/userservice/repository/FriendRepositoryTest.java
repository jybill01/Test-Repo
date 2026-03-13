package com.planit.userservice.repository;

import com.planit.userservice.entity.FriendEntity;
import com.planit.userservice.entity.FriendStatus;
import com.planit.userservice.entity.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * FriendRepository 통합 테스트
 * - @DataJpaTest: JPA 관련 컴포넌트만 로드하여 테스트
 */
@DataJpaTest
@DisplayName("FriendRepository 통합 테스트")
class FriendRepositoryTest {

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private UserEntity requester;
    private UserEntity approver;

    @BeforeEach
    void setUp() {
        // 테스트용 사용자 생성
        requester = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("requester")
                .email("requester@example.com")
                .cognitoSub("cognito-sub-requester")
                .build();

        approver = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("approver")
                .email("approver@example.com")
                .cognitoSub("cognito-sub-approver")
                .build();

        userRepository.save(requester);
        userRepository.save(approver);
        entityManager.flush();
    }

    @Test
    @DisplayName("친구 관계 저장 및 조회 성공")
    void saveFriendship_Success() {
        // given
        FriendEntity friendship = FriendEntity.builder()
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.PENDING)
                .build();

        // when
        FriendEntity savedFriendship = friendRepository.save(friendship);
        entityManager.flush();
        entityManager.clear();

        // then
        Optional<FriendEntity> found = friendRepository.findById(savedFriendship.getFriendshipId());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(FriendStatus.PENDING);
        assertThat(found.get().getRequester().getUserId()).isEqualTo(requester.getUserId());
        assertThat(found.get().getApprover().getUserId()).isEqualTo(approver.getUserId());
    }

    @Test
    @DisplayName("Approver의 PENDING 상태 친구 요청 조회 성공")
    void findPendingRequestsByApprover_Success() {
        // given
        FriendEntity friendship1 = FriendEntity.builder()
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.PENDING)
                .build();

        FriendEntity friendship2 = FriendEntity.builder()
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.ACCEPTED)
                .build();

        friendRepository.save(friendship1);
        friendRepository.save(friendship2);
        entityManager.flush();
        entityManager.clear();

        // when
        Pageable pageable = PageRequest.of(0, 10);
        Page<FriendEntity> pendingRequests = friendRepository
                .findByApproverIdAndStatusAndDeletedAtIsNull(
                        approver.getUserId(),
                        FriendStatus.PENDING,
                        pageable
                );

        // then
        assertThat(pendingRequests.getContent()).hasSize(1);
        assertThat(pendingRequests.getContent().get(0).getStatus()).isEqualTo(FriendStatus.PENDING);
    }

    @Test
    @DisplayName("사용자의 ACCEPTED 상태 친구 목록 조회 성공")
    void findAcceptedFriendsByUserId_Success() {
        // given
        UserEntity friend1 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("friend1")
                .email("friend1@example.com")
                .cognitoSub("cognito-sub-friend1")
                .build();

        UserEntity friend2 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("friend2")
                .email("friend2@example.com")
                .cognitoSub("cognito-sub-friend2")
                .build();

        userRepository.save(friend1);
        userRepository.save(friend2);

        // requester가 요청한 친구 관계 (ACCEPTED)
        FriendEntity friendship1 = FriendEntity.builder()
                .requester(requester)
                .approver(friend1)
                .status(FriendStatus.ACCEPTED)
                .build();

        // requester가 승인한 친구 관계 (ACCEPTED)
        FriendEntity friendship2 = FriendEntity.builder()
                .requester(friend2)
                .approver(requester)
                .status(FriendStatus.ACCEPTED)
                .build();

        // PENDING 상태 (결과에 포함되지 않아야 함)
        FriendEntity friendship3 = FriendEntity.builder()
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.PENDING)
                .build();

        friendRepository.save(friendship1);
        friendRepository.save(friendship2);
        friendRepository.save(friendship3);
        entityManager.flush();
        entityManager.clear();

        // when
        Pageable pageable = PageRequest.of(0, 10);
        Page<FriendEntity> friends = friendRepository.findFriendsByUserIdAndStatus(
                requester.getUserId(),
                FriendStatus.ACCEPTED,
                pageable
        );

        // then
        assertThat(friends.getContent()).hasSize(2);
        assertThat(friends.getContent())
                .allMatch(f -> f.getStatus() == FriendStatus.ACCEPTED);
    }

    @Test
    @DisplayName("친구 관계 상태 업데이트 성공")
    void updateFriendshipStatus_Success() {
        // given
        FriendEntity friendship = FriendEntity.builder()
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.PENDING)
                .build();

        FriendEntity saved = friendRepository.save(friendship);
        entityManager.flush();
        entityManager.clear();

        // when
        FriendEntity toUpdate = friendRepository.findById(saved.getFriendshipId()).orElseThrow();
        toUpdate.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(toUpdate);
        entityManager.flush();
        entityManager.clear();

        // then
        FriendEntity updated = friendRepository.findById(saved.getFriendshipId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(FriendStatus.ACCEPTED);
    }

    @Test
    @DisplayName("Soft Delete 동작 확인 - 삭제된 친구 관계는 조회되지 않음")
    void softDelete_FriendshipNotFound() {
        // given
        FriendEntity friendship = FriendEntity.builder()
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.ACCEPTED)
                .build();

        FriendEntity saved = friendRepository.save(friendship);
        entityManager.flush();
        entityManager.clear();

        // when - Soft Delete 실행
        friendRepository.delete(saved);
        entityManager.flush();
        entityManager.clear();

        // then - 일반 조회에서는 찾을 수 없음
        Optional<FriendEntity> found = friendRepository.findById(saved.getFriendshipId());
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("사용자 ID로 모든 친구 관계 Soft Delete 성공")
    void softDeleteByUserId_Success() {
        // given
        UserEntity friend1 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("friend1")
                .email("friend1@example.com")
                .cognitoSub("cognito-sub-friend1")
                .build();

        userRepository.save(friend1);

        FriendEntity friendship1 = FriendEntity.builder()
                .requester(requester)
                .approver(friend1)
                .status(FriendStatus.ACCEPTED)
                .build();

        FriendEntity friendship2 = FriendEntity.builder()
                .requester(approver)
                .approver(requester)
                .status(FriendStatus.ACCEPTED)
                .build();

        friendRepository.save(friendship1);
        friendRepository.save(friendship2);
        entityManager.flush();
        entityManager.clear();

        // when - requester의 모든 친구 관계 삭제
        friendRepository.softDeleteByUserId(requester.getUserId());
        entityManager.flush();
        entityManager.clear();

        // then - requester 관련 친구 관계는 조회되지 않음
        Pageable pageable = PageRequest.of(0, 10);
        Page<FriendEntity> friends = friendRepository.findFriendsByUserIdAndStatus(
                requester.getUserId(),
                FriendStatus.ACCEPTED,
                pageable
        );
        assertThat(friends.getContent()).isEmpty();

        // approver와 다른 사용자의 관계는 유지됨
        Page<FriendEntity> approverFriends = friendRepository.findFriendsByUserIdAndStatus(
                approver.getUserId(),
                FriendStatus.ACCEPTED,
                pageable
        );
        assertThat(approverFriends.getContent()).isEmpty(); // requester와의 관계가 삭제되어 0개
    }

    @Test
    @DisplayName("페이지네이션 동작 확인")
    void pagination_Success() {
        // given
        for (int i = 0; i < 15; i++) {
            UserEntity friend = UserEntity.builder()
                    .userId(UUID.randomUUID().toString())
                    .nickname("friend" + i)
                    .email("friend" + i + "@example.com")
                    .cognitoSub("cognito-sub-friend" + i)
                    .build();
            userRepository.save(friend);

            FriendEntity friendship = FriendEntity.builder()
                    .requester(requester)
                    .approver(friend)
                    .status(FriendStatus.ACCEPTED)
                    .build();
            friendRepository.save(friendship);
        }
        entityManager.flush();
        entityManager.clear();

        // when - 첫 번째 페이지 (10개)
        Pageable pageable1 = PageRequest.of(0, 10);
        Page<FriendEntity> page1 = friendRepository.findFriendsByUserIdAndStatus(
                requester.getUserId(),
                FriendStatus.ACCEPTED,
                pageable1
        );

        // when - 두 번째 페이지 (5개)
        Pageable pageable2 = PageRequest.of(1, 10);
        Page<FriendEntity> page2 = friendRepository.findFriendsByUserIdAndStatus(
                requester.getUserId(),
                FriendStatus.ACCEPTED,
                pageable2
        );

        // then
        assertThat(page1.getContent()).hasSize(10);
        assertThat(page1.getTotalElements()).isEqualTo(15);
        assertThat(page1.getTotalPages()).isEqualTo(2);

        assertThat(page2.getContent()).hasSize(5);
        assertThat(page2.getTotalElements()).isEqualTo(15);
    }

    @Test
    @DisplayName("Soft Delete 후 페이지네이션에서 제외됨")
    void softDelete_ExcludedFromPagination() {
        // given
        UserEntity friend1 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("friend1")
                .email("friend1@example.com")
                .cognitoSub("cognito-sub-friend1")
                .build();

        UserEntity friend2 = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .nickname("friend2")
                .email("friend2@example.com")
                .cognitoSub("cognito-sub-friend2")
                .build();

        userRepository.save(friend1);
        userRepository.save(friend2);

        FriendEntity friendship1 = FriendEntity.builder()
                .requester(requester)
                .approver(friend1)
                .status(FriendStatus.ACCEPTED)
                .build();

        FriendEntity friendship2 = FriendEntity.builder()
                .requester(requester)
                .approver(friend2)
                .status(FriendStatus.ACCEPTED)
                .build();

        friendRepository.save(friendship1);
        FriendEntity saved2 = friendRepository.save(friendship2);
        entityManager.flush();
        entityManager.clear();

        // when - friendship2 삭제
        friendRepository.delete(saved2);
        entityManager.flush();
        entityManager.clear();

        // then - 조회 결과에 friendship1만 포함
        Pageable pageable = PageRequest.of(0, 10);
        Page<FriendEntity> friends = friendRepository.findFriendsByUserIdAndStatus(
                requester.getUserId(),
                FriendStatus.ACCEPTED,
                pageable
        );
        assertThat(friends.getContent()).hasSize(1);
        assertThat(friends.getContent().get(0).getApprover().getNickname()).isEqualTo("friend1");
    }
}
