package com.planit.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class CheckWithdrawnRequest {

    @NotBlank
    private String cognitoIdToken;
}
