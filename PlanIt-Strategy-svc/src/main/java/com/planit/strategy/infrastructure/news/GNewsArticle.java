package com.planit.strategy.infrastructure.news;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GNewsArticle {
    private String title;
    private String description;
    private String url;
    private String source;
}
