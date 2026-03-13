package com.planit.userservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {
    
    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9_]+$", message = "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다")
    private String nickname;
    
    @NotEmpty(message = "관심 카테고리는 최소 1개 이상 선택해야 합니다")
    @Size(min = 1, max = 8, message = "관심 카테고리는 1개 이상 8개 이하로 선택해야 합니다")
    private List<Long> interestCategoryIds;
}
