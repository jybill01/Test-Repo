package com.planit.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermResponse {
    
    private Integer termId;
    private String title;
    private String content;
    private String version;
    private Boolean isRequired;
    private String type;
}
