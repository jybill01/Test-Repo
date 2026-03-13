package com.planit.userservice.service;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import com.planit.userservice.dto.FriendResponse;
import com.planit.userservice.dto.ProcessFriendRequestRequest;
import com.planit.userservice.entity.FriendEntity;
import com.planit.userservice.entity.FriendStatus;
import com.planit.userservice.entity.UserEntity;
import com.planit.userservice.repository.FriendRepository;
import com.planit.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("FriendService 단위 테스트")
class FriendServiceTest {

    @Mock
    private FriendRepository friendRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FriendService friendService;

    private UserEntity requester;
    private UserEntity approver;
    private FriendEntity friendEntity;
    private ProcessFriendRequestRequest processRequest;

    @BeforeEach
    void setUp() {
        // UserEntity 설정
        requester = UserEntity.builder()
                .userId("requester-id")
                .nickname("요청자")
                .email("requester@example.com")
                .build();

        approver = UserEntity.builder()
                .userId("approver-id")
                .nickname("승인자")
                .email("approver@example.com")
                .build();

        // FriendEntity 설정
        friendEntity = FriendEntity.builder()
                .friendshipId(1L)
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.PENDING)
                .build();

        // ProcessFriendRequestRequest 설정
        processRequest = new ProcessFriendRequestRequest();
        processRequest.setFriendshipId(1L);
        processRequest.setAction("ACCEPTED");
    }

    @Test
    @DisplayName("친구 요청 수락 성공")
    void processFriendRequest_Accept_Success() {
        // given
        given(friendRepository.findById(anyLong())).willReturn(Optional.of(friendEntity));

        // when
        friendService.processFriendRequest("approver-id", processRequest);

        // then
        assertThat(friendEntity.getStatus()).isEqualTo(FriendStatus.ACCEPTED);
        verify(friendRepository).findById(1L);
    }

    @Test
    @DisplayName("친구 요청 거절 성공")
    void processFriendRequest_Reject_Success() {
        // given
        processRequest.setAction("REJECTED");
        given(friendRepository.findById(anyLong())).willReturn(Optional.of(friendEntity));

        // when
        friendService.processFriendRequest("approver-id", processRequest);

        // then
        assertThat(friendEntity.getStatus()).isEqualTo(FriendStatus.REJECTED);
        verify(friendRepository).findById(1L);
    }

    @Test
    @DisplayName("친구 요청 처리 실패 - 권한 없음")
    void processFriendRequest_Fail_Unauthorized() {
        // given
        given(friendRepository.findById(anyLong())).willReturn(Optional.of(friendEntity));

        // when & then
        assertThatThrownBy(() -> friendService.processFriendRequest("wrong-user-id", processRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED_ACTION);
    }

    @Test
    @DisplayName("친구 요청 처리 실패 - 요청 없음")
    void processFriendRequest_Fail_NotFound() {
        // given
        given(friendRepository.findById(anyLong())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> friendService.processFriendRequest("approver-id", processRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    @Test
    @DisplayName("받은 친구 요청 목록 조회 성공")
    void getReceivedRequests_Success() {
        // given
        String userId = "approver-id";
        Pageable pageable = PageRequest.of(0, 20);
        
        FriendEntity request1 = FriendEntity.builder()
                .friendshipId(1L)
                .requester(requester)
                .approver(approver)
                .status(FriendStatus.PENDING)
                .build();

        Page<FriendEntity> friendPage = new PageImpl<>(List.of(request1), pageable, 1);
        given(friendRepository.findByApproverUserIdAndStatus(anyString(), any(FriendStatus.class), any(Pageable.class)))
                .willReturn(friendPage);

        // when
        Page<FriendResponse> results = friendService.getReceivedRequests(userId, 0, 20);

        // then
        assertThat(results).isNotNull();
        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getNickname()).isEqualTo("요청자");

        verify(friendRepository).findByApproverUserIdAndStatus(eq(userId), eq(FriendStatus.PENDING), any(Pageable.class));
    }

    @Test
    @DisplayName("친구 목록 조회 성공")
    void getFriends_Success() {
        // given
        String userId = "requester-id";
        Pageable pageable = PageRequest.of(0, 20);
        
        friendEntity.setStatus(FriendStatus.ACCEPTED);
        Page<FriendEntity> friendPage = new PageImpl<>(List.of(friendEntity), pageable, 1);
        
        given(friendRepository.findAcceptedFriends(anyString(), any(Pageable.class)))
                .willReturn(friendPage);

        // when
        Page<FriendResponse> results = friendService.getFriends(userId, 0, 20);

        // then
        assertThat(results).isNotNull();
        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getStatus()).isEqualTo("ACCEPTED");

        verify(friendRepository).findAcceptedFriends(eq(userId), any(Pageable.class));
    }

    @Test
    @DisplayName("친구 삭제 성공")
    void deleteFriend_Success() {
        // given
        String userId = "requester-id";
        Long friendshipId = 1L;
        
        friendEntity.setStatus(FriendStatus.ACCEPTED);
        given(friendRepository.findById(anyLong())).willReturn(Optional.of(friendEntity));

        // when
        friendService.deleteFriend(userId, friendshipId);

        // then
        verify(friendRepository).findById(friendshipId);
        verify(friendRepository).delete(friendEntity);
    }

    @Test
    @DisplayName("친구 삭제 실패 - 권한 없음")
    void deleteFriend_Fail_Unauthorized() {
        // given
        String userId = "wrong-user-id";
        Long friendshipId = 1L;
        
        given(friendRepository.findById(anyLong())).willReturn(Optional.of(friendEntity));

        // when & then
        assertThatThrownBy(() -> friendService.deleteFriend(userId, friendshipId))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED_ACTION);
    }

    @Test
    @DisplayName("친구 삭제 실패 - 친구 관계 없음")
    void deleteFriend_Fail_NotFound() {
        // given
        String userId = "requester-id";
        Long friendshipId = 999L;
        
        given(friendRepository.findById(anyLong())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> friendService.deleteFriend(userId, friendshipId))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FRIEND_NOT_FOUND);
    }
}
