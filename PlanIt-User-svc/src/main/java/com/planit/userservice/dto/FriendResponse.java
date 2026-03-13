package com.planit.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    
    private Long friendshipId;
    private String userId;
    private String nickname;
    private String email;
    private String status;
    private LocalDateTime createdAt;
}
