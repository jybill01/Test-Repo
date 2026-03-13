package com.planit.userservice.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CheckWithdrawnResponse {

    // 프론트 타입이 isRestricted라서 이름을 여기에 맞춰줌
    private boolean isRestricted;
    private String availableAt;
}
