package com.planit.userservice.controller;

import com.planit.basetemplate.common.ApiResponse;
import com.planit.userservice.dto.FriendResponse;
import com.planit.userservice.dto.ProcessFriendRequestRequest;
import com.planit.userservice.dto.SendFriendRequestRequest;
import com.planit.userservice.service.FriendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/users/friends")
@RequiredArgsConstructor
@Tag(name = "Friend API", description = "Friend relationship API (request, accept/reject, list, delete)")
public class FriendController {
    
    private final FriendService friendService;
    
    @Operation(
            summary = "Send Friend Request",
            description = """
                    Send friend request to another user.
                    
                    - Creates PENDING status friend request
                    - Cannot send duplicate requests
                    - Cannot send request to yourself
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Friend request sent successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Bad request (U4003: Already friends or request exists)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Target user not found (U4041: User not found)"
            )
    })
    @PostMapping("/requests/send")
    public ApiResponse<Void> sendFriendRequest(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId,
            @Parameter(description = "Target user ID", required = true)
            @RequestBody SendFriendRequestRequest request
    ) {
        log.info("Send friend request: {} -> {}", userId, request.getTargetUserId());
        friendService.sendFriendRequest(userId, request.getTargetUserId());
        return ApiResponse.success(HttpStatus.CREATED.value(), "Friend request sent successfully", null);
    }
    
    @Operation(
            summary = "Process Friend Request",
            description = """
                    Accept or reject received friend request.
                    
                    - Only the approver (receiver) can process the request
                    - Status changes to ACCEPTED or REJECTED
                    - If ACCEPTED, establishes bidirectional friend relationship
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Friend request processed successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Bad request (U4002: No permission)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Friend request not found (U4041: Request not found)"
            )
    })
    @PostMapping("/requests")
    public ApiResponse<Void> processFriendRequest(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId,
            @Valid @RequestBody ProcessFriendRequestRequest request
    ) {
        log.info("Process friend request: {} by {}", request.getFriendshipId(), userId);
        friendService.processFriendRequest(userId, request);
        return ApiResponse.success(HttpStatus.OK.value(), "Friend request processed successfully", null);
    }
    
    @Operation(
            summary = "Get Received Friend Requests",
            description = """
                    Retrieve list of received friend requests.
                    
                    - Retrieves requests with PENDING status
                    - Supports pagination
                    - Sorted by latest request first
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Received friend requests retrieved successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            )
    })
    @GetMapping("/requests/received")
    public ApiResponse<Page<FriendResponse>> getReceivedRequests(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId,
            @Parameter(description = "Page number (starts from 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Get received requests: {}", userId);
        Page<FriendResponse> response = friendService.getReceivedRequests(userId, page, size);
        return ApiResponse.success(HttpStatus.OK.value(), "Received friend requests retrieved successfully", response);
    }
    
    @Operation(
            summary = "Get Friends List",
            description = """
                    Retrieve my friends list.
                    
                    - Retrieves friends with ACCEPTED status
                    - Supports pagination
                    - Sorted alphabetically by nickname
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Friends list retrieved successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            )
    })
    @GetMapping
    public ApiResponse<Page<FriendResponse>> getFriends(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId,
            @Parameter(description = "Page number (starts from 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Get friends: {}", userId);
        Page<FriendResponse> response = friendService.getFriends(userId, page, size);
        return ApiResponse.success(HttpStatus.OK.value(), "Friends list retrieved successfully", response);
    }
    
    @Operation(
            summary = "Delete Friend",
            description = """
                    Delete friend relationship (Soft Delete).
                    
                    - Deletes both sides of the friend relationship
                    - Logical deletion, retained for 90 days
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Friend deleted successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Authentication failed (C4001: Invalid token)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Friend relationship not found (U4041: Relationship not found)"
            )
    })
    @DeleteMapping("/{friendshipId}")
    public ApiResponse<Void> deleteFriend(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId,
            @Parameter(description = "Friend relationship ID", required = true)
            @PathVariable Long friendshipId
    ) {
        log.info("Delete friend: {} by {}", friendshipId, userId);
        friendService.deleteFriend(userId, friendshipId);
        return ApiResponse.success(HttpStatus.OK.value(), "Friend deleted successfully", null);
    }
}
