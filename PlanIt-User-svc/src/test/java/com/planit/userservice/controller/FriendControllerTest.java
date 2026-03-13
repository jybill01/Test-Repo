package com.planit.userservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planit.userservice.dto.FriendResponse;
import com.planit.userservice.dto.ProcessFriendRequestRequest;
import com.planit.userservice.entity.FriendStatus;
import com.planit.userservice.service.FriendService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FriendController API 테스트
 * - @WebMvcTest: Controller 레이어만 테스트
 * - MockMvc: HTTP 요청/응답 시뮬레이션
 */
@WebMvcTest(FriendController.class)
@DisplayName("FriendController API 테스트")
class FriendControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FriendService friendService;

    @Test
    @DisplayName("친구 요청 처리 성공 - 수락")
    @WithMockUser
    void processFriendRequest_Accept_Success() throws Exception {
        // given
        String userId = "test-user-id";
        ProcessFriendRequestRequest request = ProcessFriendRequestRequest.builder()
                .friendshipId(1L)
                .status(FriendStatus.ACCEPTED)
                .build();

        doNothing().when(friendService).processFriendRequest(eq(userId), any(ProcessFriendRequestRequest.class));

        // when & then
        mockMvc.perform(post("/api/v1/users/friends/requests")
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("친구 요청 처리 성공"));
    }

    @Test
    @DisplayName("친구 요청 처리 성공 - 거절")
    @WithMockUser
    void processFriendRequest_Reject_Success() throws Exception {
        // given
        String userId = "test-user-id";
        ProcessFriendRequestRequest request = ProcessFriendRequestRequest.builder()
                .friendshipId(1L)
                .status(FriendStatus.REJECTED)
                .build();

        doNothing().when(friendService).processFriendRequest(eq(userId), any(ProcessFriendRequestRequest.class));

        // when & then
        mockMvc.perform(post("/api/v1/users/friends/requests")
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("친구 요청 처리 성공"));
    }

    @Test
    @DisplayName("친구 요청 처리 실패 - 인증되지 않은 사용자")
    void processFriendRequest_Unauthorized() throws Exception {
        // given
        ProcessFriendRequestRequest request = ProcessFriendRequestRequest.builder()
                .friendshipId(1L)
                .status(FriendStatus.ACCEPTED)
                .build();

        // when & then
        mockMvc.perform(post("/api/v1/users/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("친구 요청 처리 실패 - 잘못된 요청 (friendshipId 누락)")
    @WithMockUser
    void processFriendRequest_BadRequest_MissingFriendshipId() throws Exception {
        // given
        ProcessFriendRequestRequest request = ProcessFriendRequestRequest.builder()
                .status(FriendStatus.ACCEPTED)
                .build();

        // when & then
        mockMvc.perform(post("/api/v1/users/friends/requests")
                        .with(user("test-user-id"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("받은 친구 요청 목록 조회 성공")
    @WithMockUser
    void getReceivedRequests_Success() throws Exception {
        // given
        String userId = "test-user-id";
        List<FriendResponse> friendResponses = Arrays.asList(
                FriendResponse.builder()
                        .friendshipId(1L)
                        .userId("requester-1")
                        .nickname("requester1")
                        .email("requester1@example.com")
                        .status(FriendStatus.PENDING)
                        .build(),
                FriendResponse.builder()
                        .friendshipId(2L)
                        .userId("requester-2")
                        .nickname("requester2")
                        .email("requester2@example.com")
                        .status(FriendStatus.PENDING)
                        .build()
        );

        Page<FriendResponse> page = new PageImpl<>(friendResponses);
        when(friendService.getReceivedRequests(eq(userId), anyInt(), anyInt())).thenReturn(page);

        // when & then
        mockMvc.perform(get("/api/v1/users/friends/requests/received")
                        .with(user(userId))
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("받은 친구 요청 조회 성공"))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].friendshipId").value(1))
                .andExpect(jsonPath("$.data.content[0].nickname").value("requester1"))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("받은 친구 요청 목록 조회 성공 - 결과 없음")
    @WithMockUser
    void getReceivedRequests_EmptyResult() throws Exception {
        // given
        String userId = "test-user-id";
        Page<FriendResponse> emptyPage = new PageImpl<>(Arrays.asList());
        when(friendService.getReceivedRequests(eq(userId), anyInt(), anyInt())).thenReturn(emptyPage);

        // when & then
        mockMvc.perform(get("/api/v1/users/friends/requests/received")
                        .with(user(userId))
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(0));
    }

    @Test
    @DisplayName("받은 친구 요청 목록 조회 실패 - 인증되지 않은 사용자")
    void getReceivedRequests_Unauthorized() throws Exception {
        // when & then
        mockMvc.perform(get("/api/v1/users/friends/requests/received")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("친구 목록 조회 성공")
    @WithMockUser
    void getFriends_Success() throws Exception {
        // given
        String userId = "test-user-id";
        List<FriendResponse> friendResponses = Arrays.asList(
                FriendResponse.builder()
                        .friendshipId(1L)
                        .userId("friend-1")
                        .nickname("friend1")
                        .email("friend1@example.com")
                        .status(FriendStatus.ACCEPTED)
                        .build(),
                FriendResponse.builder()
                        .friendshipId(2L)
                        .userId("friend-2")
                        .nickname("friend2")
                        .email("friend2@example.com")
                        .status(FriendStatus.ACCEPTED)
                        .build()
        );

        Page<FriendResponse> page = new PageImpl<>(friendResponses);
        when(friendService.getFriends(eq(userId), anyInt(), anyInt())).thenReturn(page);

        // when & then
        mockMvc.perform(get("/api/v1/users/friends")
                        .with(user(userId))
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("친구 목록 조회 성공"))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].friendshipId").value(1))
                .andExpect(jsonPath("$.data.content[0].nickname").value("friend1"))
                .andExpect(jsonPath("$.data.content[0].status").value("ACCEPTED"));
    }

    @Test
    @DisplayName("친구 목록 조회 실패 - 인증되지 않은 사용자")
    void getFriends_Unauthorized() throws Exception {
        // when & then
        mockMvc.perform(get("/api/v1/users/friends")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("친구 삭제 성공")
    @WithMockUser
    void deleteFriend_Success() throws Exception {
        // given
        String userId = "test-user-id";
        Long friendshipId = 1L;

        doNothing().when(friendService).deleteFriend(userId, friendshipId);

        // when & then
        mockMvc.perform(delete("/api/v1/users/friends/{friendshipId}", friendshipId)
                        .with(user(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("친구 삭제 성공"));
    }

    @Test
    @DisplayName("친구 삭제 실패 - 인증되지 않은 사용자")
    void deleteFriend_Unauthorized() throws Exception {
        // when & then
        mockMvc.perform(delete("/api/v1/users/friends/{friendshipId}", 1L))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("페이지네이션 파라미터 기본값 테스트")
    @WithMockUser
    void pagination_DefaultValues() throws Exception {
        // given
        String userId = "test-user-id";
        Page<FriendResponse> emptyPage = new PageImpl<>(Arrays.asList());
        when(friendService.getFriends(eq(userId), eq(0), eq(20))).thenReturn(emptyPage);

        // when & then - 파라미터 없이 요청
        mockMvc.perform(get("/api/v1/users/friends")
                        .with(user(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
