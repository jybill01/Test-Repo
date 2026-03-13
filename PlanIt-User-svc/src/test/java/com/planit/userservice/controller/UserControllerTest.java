package com.planit.userservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planit.userservice.dto.UpdateProfileRequest;
import com.planit.userservice.dto.UserResponse;
import com.planit.userservice.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UserController API 테스트
 * - @WebMvcTest: Controller 레이어만 테스트
 * - MockMvc: HTTP 요청/응답 시뮬레이션
 */
@WebMvcTest(UserController.class)
@DisplayName("UserController API 테스트")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("프로필 수정 성공")
    @WithMockUser
    void updateProfile_Success() throws Exception {
        // given
        String userId = "test-user-id";
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .nickname("updatedNickname")
                .interestCategoryIds(Arrays.asList(1L, 2L, 3L))
                .build();

        UserResponse response = UserResponse.builder()
                .userId(userId)
                .nickname("updatedNickname")
                .email("test@example.com")
                .interestCategories(Arrays.asList("운동", "독서", "음악"))
                .build();

        when(userService.updateProfile(eq(userId), any(UpdateProfileRequest.class)))
                .thenReturn(response);

        // when & then
        mockMvc.perform(put("/api/v1/users/profile")
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("프로필 수정 성공"))
                .andExpect(jsonPath("$.data.userId").value(userId))
                .andExpect(jsonPath("$.data.nickname").value("updatedNickname"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.interestCategories").isArray())
                .andExpect(jsonPath("$.data.interestCategories[0]").value("운동"));
    }

    @Test
    @DisplayName("프로필 수정 실패 - 인증되지 않은 사용자")
    void updateProfile_Unauthorized() throws Exception {
        // given
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .nickname("updatedNickname")
                .interestCategoryIds(Arrays.asList(1L, 2L, 3L))
                .build();

        // when & then
        mockMvc.perform(put("/api/v1/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("프로필 수정 실패 - 잘못된 요청 (닉네임 누락)")
    void updateProfile_BadRequest_MissingNickname() throws Exception {
        // given
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .interestCategoryIds(Arrays.asList(1L, 2L, 3L))
                .build();

        // when & then
        mockMvc.perform(put("/api/v1/users/profile")
                        .with(user("test-user-id"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("유저 검색 성공")
    @WithMockUser
    void searchUsers_Success() throws Exception {
        // given
        String searchNickname = "test";
        List<UserResponse> responses = Arrays.asList(
                UserResponse.builder()
                        .userId("user-1")
                        .nickname("testUser1")
                        .email("test1@example.com")
                        .interestCategories(Arrays.asList("운동", "독서"))
                        .build(),
                UserResponse.builder()
                        .userId("user-2")
                        .nickname("testUser2")
                        .email("test2@example.com")
                        .interestCategories(Arrays.asList("음악", "영화"))
                        .build()
        );

        when(userService.searchUsers(searchNickname)).thenReturn(responses);

        // when & then
        mockMvc.perform(get("/api/v1/users/search")
                        .param("nickname", searchNickname))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("유저 검색 성공"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].userId").value("user-1"))
                .andExpect(jsonPath("$.data[0].nickname").value("testUser1"))
                .andExpect(jsonPath("$.data[1].userId").value("user-2"))
                .andExpect(jsonPath("$.data[1].nickname").value("testUser2"));
    }

    @Test
    @DisplayName("유저 검색 성공 - 결과 없음")
    @WithMockUser
    void searchUsers_EmptyResult() throws Exception {
        // given
        String searchNickname = "nonexistent";
        when(userService.searchUsers(searchNickname)).thenReturn(Arrays.asList());

        // when & then
        mockMvc.perform(get("/api/v1/users/search")
                        .param("nickname", searchNickname))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("유저 검색 성공"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("유저 검색 실패 - 닉네임 파라미터 누락")
    @WithMockUser
    void searchUsers_MissingParameter() throws Exception {
        // when & then
        mockMvc.perform(get("/api/v1/users/search"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("유저 검색 실패 - 인증되지 않은 사용자")
    void searchUsers_Unauthorized() throws Exception {
        // when & then
        mockMvc.perform(get("/api/v1/users/search")
                        .param("nickname", "test"))
                .andExpect(status().isUnauthorized());
    }
}
