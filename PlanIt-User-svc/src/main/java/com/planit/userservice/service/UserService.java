package com.planit.userservice.service;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import com.planit.userservice.dto.CategoryResponse;
import com.planit.userservice.dto.UpdateProfileRequest;
import com.planit.userservice.dto.UserResponse;
import com.planit.userservice.entity.InterestCategoryEntity;
import com.planit.userservice.entity.UserEntity;
import com.planit.userservice.entity.UserInterestEntity;
import com.planit.userservice.repository.InterestCategoryRepository;
import com.planit.userservice.repository.UserInterestRepository;
import com.planit.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final InterestCategoryRepository interestCategoryRepository;
    
    @Transactional(readOnly = true)
    public UserResponse getProfile(String userId) {
        // 사용자 조회
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.U4041));
        
        // 관심 카테고리 조회
        List<UserInterestEntity> interests = userInterestRepository.findByUserIdAndDeletedAtIsNull(userId);
        List<Long> categoryIds = interests.stream()
                .map(UserInterestEntity::getCategoryId)
                .collect(Collectors.toList());
        
        List<InterestCategoryEntity> categories = interestCategoryRepository.findByIdIn(categoryIds);
        List<CategoryResponse> categoryResponses = categories.stream()
                .map(c -> CategoryResponse.builder()
                        .categoryId(c.getCategoryId())
                        .name(c.getName())
                        .colorHex(c.getColorHex())
                        .description(c.getDescription())
                        .build())
                .collect(Collectors.toList());
        
        return UserResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .interests(categoryResponses)
                .build();
    }
    
    @Transactional
    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        // 사용자 조회
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.U4041));
        
        // 닉네임 중복 체크 (자신 제외)
        if (!user.getNickname().equals(request.getNickname()) &&
            userRepository.existsByNickname(request.getNickname())) {
            throw new CustomException(ErrorCode.U4001);
        }
        
        // User 엔티티 업데이트
        user.setNickname(request.getNickname());
        userRepository.save(user);
        
        // 기존 관심 카테고리 삭제
        userInterestRepository.softDeleteByUserId(userId);
        
        // 새 관심 카테고리 저장
        for (Long categoryId : request.getInterestCategoryIds()) {
            InterestCategoryEntity category = interestCategoryRepository.findById(categoryId)
                    .orElseThrow(() -> new CustomException(ErrorCode.U4042));
            UserInterestEntity interest = UserInterestEntity.builder()
                    .user(user)
                    .category(category)
                    .build();
            userInterestRepository.save(interest);
        }
        
        // 관심 카테고리 조회
        List<UserInterestEntity> interests = userInterestRepository.findByUserIdAndDeletedAtIsNull(userId);
        List<Long> categoryIds = interests.stream()
                .map(UserInterestEntity::getCategoryId)
                .collect(Collectors.toList());
        
        List<InterestCategoryEntity> categories = interestCategoryRepository.findByIdIn(categoryIds);
        List<CategoryResponse> categoryResponses = categories.stream()
                .map(c -> CategoryResponse.builder()
                        .categoryId(c.getCategoryId())
                        .name(c.getName())
                        .colorHex(c.getColorHex())
                        .description(c.getDescription())
                        .build())
                .collect(Collectors.toList());
        
        return UserResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .interests(categoryResponses)
                .build();
    }
    
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String nickname, String myUserId) {
        // 닉네임 부분 일치 검색
        List<UserEntity> users = userRepository.searchByNickname(nickname);
        
        return users.stream()
                .filter(user -> !user.getUserId().equals(myUserId)) // 🎯 나 자신 제외
                .limit(20)
                .map(user -> {
                    // 관심 카테고리 조회
                    List<UserInterestEntity> interests = 
                            userInterestRepository.findByUserIdAndDeletedAtIsNull(user.getUserId());
                    List<Long> categoryIds = interests.stream()
                            .map(UserInterestEntity::getCategoryId)
                            .collect(Collectors.toList());
                    
                    List<InterestCategoryEntity> categories = 
                            interestCategoryRepository.findByIdIn(categoryIds);
                    List<CategoryResponse> categoryResponses = categories.stream()
                            .map(c -> CategoryResponse.builder()
                                    .categoryId(c.getCategoryId())
                                    .name(c.getName())
                                    .colorHex(c.getColorHex())
                                    .description(c.getDescription())
                                    .build())
                            .collect(Collectors.toList());
                    
                    return UserResponse.builder()
                            .userId(user.getUserId())
                            .nickname(user.getNickname())
                            .email(user.getEmail())
                            .interests(categoryResponses)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
