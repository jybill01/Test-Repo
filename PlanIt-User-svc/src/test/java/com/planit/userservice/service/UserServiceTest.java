package com.planit.userservice.service;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import com.planit.userservice.dto.UpdateProfileRequest;
import com.planit.userservice.dto.UserResponse;
import com.planit.userservice.entity.InterestCategoryEntity;
import com.planit.userservice.entity.UserEntity;
import com.planit.userservice.entity.UserInterestEntity;
import com.planit.userservice.repository.InterestCategoryRepository;
import com.planit.userservice.repository.UserInterestRepository;
import com.planit.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 단위 테스트")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private InterestCategoryRepository interestCategoryRepository;

    @Mock
    private UserInterestRepository userInterestRepository;

    @InjectMocks
    private UserService userService;

    private UserEntity userEntity;
    private InterestCategoryEntity category1;
    private InterestCategoryEntity category2;
    private UpdateProfileRequest updateRequest;

    @BeforeEach
    void setUp() {
        // UserEntity 설정
        userEntity = UserEntity.builder()
                .userId("test-user-id")
                .nickname("테스트유저")
                .email("test@example.com")
                .cognitoSub("mock-cognito-sub")
                .build();

        // InterestCategoryEntity 설정
        category1 = InterestCategoryEntity.builder()
                .categoryId(1L)
                .name("운동")
                .colorHex("#FF5733")
                .description("운동 관련 카테고리")
                .build();

        category2 = InterestCategoryEntity.builder()
                .categoryId(2L)
                .name("독서")
                .colorHex("#33FF57")
                .description("독서 관련 카테고리")
                .build();

        // UpdateProfileRequest 설정
        updateRequest = new UpdateProfileRequest();
        updateRequest.setNickname("수정된유저");
        updateRequest.setInterestCategoryIds(List.of(1L, 2L));
    }

    @Test
    @DisplayName("프로필 수정 성공")
    void updateProfile_Success() {
        // given
        given(userRepository.findById(anyString())).willReturn(Optional.of(userEntity));
        given(userRepository.existsByNicknameAndUserIdNot(anyString(), anyString())).willReturn(false);
        given(interestCategoryRepository.findAllById(anyList())).willReturn(List.of(category1, category2));

        // when
        UserResponse response = userService.updateProfile("test-user-id", updateRequest);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getNickname()).isEqualTo("수정된유저");
        assertThat(userEntity.getNickname()).isEqualTo("수정된유저");

        verify(userInterestRepository).deleteByUser(userEntity);
        verify(userInterestRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("프로필 수정 실패 - 닉네임 중복")
    void updateProfile_Fail_DuplicateNickname() {
        // given
        given(userRepository.findById(anyString())).willReturn(Optional.of(userEntity));
        given(userRepository.existsByNicknameAndUserIdNot(anyString(), anyString())).willReturn(true);

        // when & then
        assertThatThrownBy(() -> userService.updateProfile("test-user-id", updateRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NICKNAME_DUPLICATE);

        verify(userInterestRepository, never()).deleteByUser(any());
    }

    @Test
    @DisplayName("프로필 수정 실패 - 사용자 없음")
    void updateProfile_Fail_UserNotFound() {
        // given
        given(userRepository.findById(anyString())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.updateProfile("non-existent-user-id", updateRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("유저 검색 성공")
    void searchUsers_Success() {
        // given
        String nickname = "테스트";
        UserEntity user1 = UserEntity.builder()
                .userId("user-1")
                .nickname("테스트유저1")
                .email("test1@example.com")
                .build();

        UserEntity user2 = UserEntity.builder()
                .userId("user-2")
                .nickname("테스트유저2")
                .email("test2@example.com")
                .build();

        given(userRepository.findByNicknameContaining(anyString(), any(PageRequest.class)))
                .willReturn(List.of(user1, user2));

        // when
        List<UserResponse> results = userService.searchUsers(nickname);

        // then
        assertThat(results).hasSize(2);
        assertThat(results.get(0).getNickname()).isEqualTo("테스트유저1");
        assertThat(results.get(1).getNickname()).isEqualTo("테스트유저2");

        verify(userRepository).findByNicknameContaining(eq(nickname), any(PageRequest.class));
    }

    @Test
    @DisplayName("유저 검색 - 결과 없음")
    void searchUsers_NoResults() {
        // given
        String nickname = "존재하지않는유저";
        given(userRepository.findByNicknameContaining(anyString(), any(PageRequest.class)))
                .willReturn(List.of());

        // when
        List<UserResponse> results = userService.searchUsers(nickname);

        // then
        assertThat(results).isEmpty();
    }
}
