package com.planit.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendFriendRequestRequest {
    
    @NotBlank(message = "Target user ID is required")
    private String targetUserId;
}
