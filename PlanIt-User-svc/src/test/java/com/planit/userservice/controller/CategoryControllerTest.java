package com.planit.userservice.controller;

import com.planit.userservice.dto.CategoryResponse;
import com.planit.userservice.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
@DisplayName("CategoryController API 테스트")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryService categoryService;

    @Test
    @DisplayName("GET /api/v1/users/categories - 카테고리 조회 성공")
    void getCategories_Success() throws Exception {
        // Given
        List<CategoryResponse> categories = Arrays.asList(
                CategoryResponse.builder().id(1L).name("운동").build(),
                CategoryResponse.builder().id(2L).name("독서").build(),
                CategoryResponse.builder().id(3L).name("음악").build(),
                CategoryResponse.builder().id(4L).name("요리").build(),
                CategoryResponse.builder().id(5L).name("여행").build(),
                CategoryResponse.builder().id(6L).name("언어").build(),
                CategoryResponse.builder().id(7L).name("재테크").build(),
                CategoryResponse.builder().id(8L).name("자기계발").build()
        );

        when(categoryService.getCategories()).thenReturn(categories);

        // When & Then
        mockMvc.perform(get("/api/v1/users/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(8))
                .andExpect(jsonPath("$.data[0].name").value("운동"))
                .andExpect(jsonPath("$.data[7].name").value("자기계발"));

        verify(categoryService).getCategories();
    }
}
