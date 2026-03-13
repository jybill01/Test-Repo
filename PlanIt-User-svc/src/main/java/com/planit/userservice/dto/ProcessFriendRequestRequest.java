package com.planit.userservice.dto;

import com.planit.userservice.entity.FriendStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessFriendRequestRequest {
    
    @NotNull(message = "친구 요청 ID는 필수입니다")
    @Positive(message = "친구 요청 ID는 양수여야 합니다")
    private Long friendshipId;
    
    @NotNull(message = "처리 상태는 필수입니다")
    private FriendStatus status; // ACCEPTED or REJECTED
}
