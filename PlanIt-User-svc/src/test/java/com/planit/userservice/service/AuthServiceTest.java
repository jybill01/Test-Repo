package com.planit.userservice.service;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import com.planit.userservice.dto.AuthResponse;
import com.planit.userservice.dto.LoginRequest;
import com.planit.userservice.dto.SignupRequest;
import com.planit.userservice.entity.InterestCategoryEntity;
import com.planit.userservice.entity.TermEntity;
import com.planit.userservice.entity.UserEntity;
import com.planit.userservice.repository.*;
import com.planit.userservice.security.CognitoService;
import com.planit.userservice.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 단위 테스트")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TermRepository termRepository;

    @Mock
    private UserAgreementRepository userAgreementRepository;

    @Mock
    private InterestCategoryRepository interestCategoryRepository;

    @Mock
    private UserInterestRepository userInterestRepository;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private CognitoService cognitoService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private SignupRequest signupRequest;
    private LoginRequest loginRequest;
    private UserEntity userEntity;
    private TermEntity requiredTerm;
    private InterestCategoryEntity category;

    @BeforeEach
    void setUp() {
        // SignupRequest 설정
        signupRequest = new SignupRequest();
        signupRequest.setNickname("테스트유저");
        signupRequest.setEmail("test@example.com");
        signupRequest.setCognitoIdToken("mock-cognito-token");
        signupRequest.setAgreedTermIds(List.of(1L, 2L));
        signupRequest.setInterestCategoryIds(List.of(1L, 2L));
        signupRequest.setRetentionAgreed(false);

        // LoginRequest 설정
        loginRequest = new LoginRequest();
        loginRequest.setCognitoIdToken("mock-cognito-token");

        // UserEntity 설정
        userEntity = UserEntity.builder()
                .userId("test-user-id")
                .nickname("테스트유저")
                .email("test@example.com")
                .cognitoSub("mock-cognito-sub")
                .build();

        // TermEntity 설정
        requiredTerm = TermEntity.builder()
                .termId(1L)
                .title("서비스 이용약관")
                .content("약관 내용")
                .version("1.0")
                .isRequired(true)
                .type("SERVICE")
                .build();

        // InterestCategoryEntity 설정
        category = InterestCategoryEntity.builder()
                .categoryId(1L)
                .name("운동")
                .colorHex("#FF5733")
                .description("운동 관련 카테고리")
                .build();

        // RedisTemplate Mock 설정
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
    }

    @Test
    @DisplayName("회원가입 성공")
    void signup_Success() {
        // given
        given(cognitoService.verifyCognitoToken(anyString())).willReturn("mock-cognito-sub");
        given(userRepository.existsByNickname(anyString())).willReturn(false);
        given(termRepository.findAllById(anyList())).willReturn(List.of(requiredTerm));
        given(interestCategoryRepository.findAllById(anyList())).willReturn(List.of(category));
        given(userRepository.save(any(UserEntity.class))).willReturn(userEntity);
        given(jwtProvider.generateAccessToken(anyString())).willReturn("mock-access-token");
        given(jwtProvider.generateRefreshToken(anyString())).willReturn("mock-refresh-token");

        // when
        AuthResponse response = authService.signup(signupRequest);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getNickname()).isEqualTo("테스트유저");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("mock-refresh-token");

        verify(userRepository).save(any(UserEntity.class));
        verify(userAgreementRepository).saveAll(anyList());
        verify(userInterestRepository).saveAll(anyList());
        verify(valueOperations).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("회원가입 실패 - 닉네임 중복")
    void signup_Fail_DuplicateNickname() {
        // given
        given(cognitoService.verifyCognitoToken(anyString())).willReturn("mock-cognito-sub");
        given(userRepository.existsByNickname(anyString())).willReturn(true);

        // when & then
        assertThatThrownBy(() -> authService.signup(signupRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NICKNAME_DUPLICATE);

        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("회원가입 실패 - 필수 약관 미동의")
    void signup_Fail_RequiredTermNotAgreed() {
        // given
        given(cognitoService.verifyCognitoToken(anyString())).willReturn("mock-cognito-sub");
        given(userRepository.existsByNickname(anyString())).willReturn(false);
        
        TermEntity anotherRequiredTerm = TermEntity.builder()
                .termId(3L)
                .title("개인정보 처리방침")
                .isRequired(true)
                .build();
        
        given(termRepository.findAllById(anyList())).willReturn(List.of(requiredTerm, anotherRequiredTerm));

        // when & then
        assertThatThrownBy(() -> authService.signup(signupRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.REQUIRED_TERM_NOT_AGREED);

        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("로그인 성공")
    void login_Success() {
        // given
        given(cognitoService.verifyCognitoToken(anyString())).willReturn("mock-cognito-sub");
        given(userRepository.findByCognitoSub(anyString())).willReturn(Optional.of(userEntity));
        given(jwtProvider.generateAccessToken(anyString())).willReturn("mock-access-token");
        given(jwtProvider.generateRefreshToken(anyString())).willReturn("mock-refresh-token");

        // when
        AuthResponse response = authService.login(loginRequest);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo("test-user-id");
        assertThat(response.getNickname()).isEqualTo("테스트유저");
        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("mock-refresh-token");

        verify(valueOperations).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("로그인 실패 - 사용자 없음")
    void login_Fail_UserNotFound() {
        // given
        given(cognitoService.verifyCognitoToken(anyString())).willReturn("mock-cognito-sub");
        given(userRepository.findByCognitoSub(anyString())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RESOURCE_NOT_FOUND);
    }

    @Test
    @DisplayName("계정 삭제 성공")
    void withdraw_Success() {
        // given
        String userId = "test-user-id";
        given(userRepository.findById(anyString())).willReturn(Optional.of(userEntity));

        // when
        authService.withdraw(userId);

        // then
        verify(userRepository).findById(userId);
        verify(userInterestRepository).deleteByUser(any(UserEntity.class));
        verify(redisTemplate).delete(anyString());
    }

    @Test
    @DisplayName("계정 삭제 실패 - 사용자 없음")
    void withdraw_Fail_UserNotFound() {
        // given
        String userId = "non-existent-user-id";
        given(userRepository.findById(anyString())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> authService.withdraw(userId))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);

        verify(userInterestRepository, never()).deleteByUser(any(UserEntity.class));
    }
}
