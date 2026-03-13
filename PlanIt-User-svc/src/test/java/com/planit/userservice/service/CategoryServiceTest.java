package com.planit.userservice.service;

import com.planit.userservice.dto.CategoryResponse;
import com.planit.userservice.entity.InterestCategoryEntity;
import com.planit.userservice.repository.InterestCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("CategoryService 단위 테스트")
class CategoryServiceTest {

    @Mock
    private InterestCategoryRepository interestCategoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private List<InterestCategoryEntity> categories;

    @BeforeEach
    void setUp() {
        // 8대 카테고리 설정
        categories = List.of(
                InterestCategoryEntity.builder()
                        .categoryId(1L)
                        .name("운동")
                        .colorHex("#FF5733")
                        .description("운동 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(2L)
                        .name("독서")
                        .colorHex("#33FF57")
                        .description("독서 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(3L)
                        .name("공부")
                        .colorHex("#3357FF")
                        .description("공부 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(4L)
                        .name("취미")
                        .colorHex("#FF33A1")
                        .description("취미 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(5L)
                        .name("건강")
                        .colorHex("#A1FF33")
                        .description("건강 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(6L)
                        .name("자기계발")
                        .colorHex("#33A1FF")
                        .description("자기계발 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(7L)
                        .name("여행")
                        .colorHex("#FFA133")
                        .description("여행 관련 카테고리")
                        .build(),
                InterestCategoryEntity.builder()
                        .categoryId(8L)
                        .name("기타")
                        .colorHex("#A133FF")
                        .description("기타 카테고리")
                        .build()
        );
    }

    @Test
    @DisplayName("카테고리 목록 조회 성공")
    void getCategories_Success() {
        // given
        given(interestCategoryRepository.findAll()).willReturn(categories);

        // when
        List<CategoryResponse> results = categoryService.getCategories();

        // then
        assertThat(results).isNotNull();
        assertThat(results).hasSize(8);
        assertThat(results.get(0).getName()).isEqualTo("운동");
        assertThat(results.get(0).getColorHex()).isEqualTo("#FF5733");
        assertThat(results.get(1).getName()).isEqualTo("독서");
        assertThat(results.get(7).getName()).isEqualTo("기타");

        verify(interestCategoryRepository).findAll();
    }

    @Test
    @DisplayName("카테고리 목록 조회 - 빈 목록")
    void getCategories_EmptyList() {
        // given
        given(interestCategoryRepository.findAll()).willReturn(List.of());

        // when
        List<CategoryResponse> results = categoryService.getCategories();

        // then
        assertThat(results).isEmpty();
        verify(interestCategoryRepository).findAll();
    }

    @Test
    @DisplayName("카테고리 응답 DTO 변환 확인")
    void categoryResponse_Mapping() {
        // given
        InterestCategoryEntity category = categories.get(0);

        // when
        CategoryResponse response = CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .colorHex(category.getColorHex())
                .description(category.getDescription())
                .build();

        // then
        assertThat(response.getCategoryId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("운동");
        assertThat(response.getColorHex()).isEqualTo("#FF5733");
        assertThat(response.getDescription()).isEqualTo("운동 관련 카테고리");
    }
}
