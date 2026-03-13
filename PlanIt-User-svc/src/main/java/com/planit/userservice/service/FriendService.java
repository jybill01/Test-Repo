package com.planit.userservice.service;

import com.planit.basetemplate.common.CustomException;
import com.planit.basetemplate.common.ErrorCode;
import com.planit.userservice.dto.FriendResponse;
import com.planit.userservice.dto.ProcessFriendRequestRequest;
import com.planit.userservice.entity.FriendEntity;
import com.planit.userservice.entity.FriendStatus;
import com.planit.userservice.entity.UserEntity;
import com.planit.userservice.repository.FriendRepository;
import com.planit.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FriendService {
    
    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public void sendFriendRequest(String requesterId, String targetUserId) {
        // 자기 자신에게 요청 불가
        if (requesterId.equals(targetUserId)) {
            throw new CustomException(ErrorCode.U4009);
        }
        
        // 대상 사용자 존재 확인
        UserEntity requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new CustomException(ErrorCode.U4041));
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.U4041));
        
        // 이미 친구 관계가 있는지 확인
        boolean alreadyExists = friendRepository.existsByRequesterIdAndApproverIdAndDeletedAtIsNull(
                requesterId, targetUserId) ||
                friendRepository.existsByRequesterIdAndApproverIdAndDeletedAtIsNull(
                        targetUserId, requesterId);
        
        if (alreadyExists) {
            throw new CustomException(ErrorCode.U4010);
        }
        
        // 친구 요청 생성
        FriendEntity friendship = FriendEntity.builder()
                .requester(requester)
                .approver(target)
                .status(FriendStatus.PENDING)
                .build();
        
        friendRepository.save(friendship);
        
        log.info("Friend request sent: {} -> {}", requesterId, targetUserId);
    }
    
    @Transactional
    public void processFriendRequest(String userId, ProcessFriendRequestRequest request) {
        // 친구 요청 조회
        FriendEntity friendship = friendRepository.findById(request.getFriendshipId())
                .orElseThrow(() -> new CustomException(ErrorCode.U4043));
        
        // 권한 확인 (approver만 처리 가능)
        if (!friendship.getApprover().getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.U4043);
        }
        
        // 상태 업데이트
        friendship.setStatus(request.getStatus());
        friendRepository.save(friendship);
        
        log.info("Friend request processed: {} -> {}", request.getFriendshipId(), request.getStatus());
    }
    
    @Transactional(readOnly = true)
    public Page<FriendResponse> getReceivedRequests(String userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        // Fetch Join으로 N+1 문제 해결
        Page<FriendEntity> friendships = friendRepository.findByApproverIdAndStatusWithRequester(
                userId,
                FriendStatus.PENDING,
                pageRequest
        );
        
        return friendships.map(friendship -> {
            UserEntity requester = friendship.getRequester();
            
            return FriendResponse.builder()
                    .friendshipId(friendship.getFriendshipId())
                    .userId(requester.getUserId())
                    .nickname(requester.getNickname())
                    .email(requester.getEmail())
                    .status(friendship.getStatus().name())
                    .createdAt(friendship.getCreatedAt())
                    .build();
        });
    }
    
    @Transactional(readOnly = true)
    public Page<FriendResponse> getFriends(String userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        
        // Fetch Join으로 N+1 문제 해결
        Page<FriendEntity> friendships = friendRepository.findFriendsByUserIdAndStatusWithUsers(
                userId,
                FriendStatus.ACCEPTED,
                pageRequest
        );
        
        return friendships.map(friendship -> {
            // 상대방 찾기 (이미 Fetch Join으로 로드됨)
            UserEntity friend = friendship.getRequester().getUserId().equals(userId) 
                    ? friendship.getApprover() 
                    : friendship.getRequester();
            
            return FriendResponse.builder()
                    .friendshipId(friendship.getFriendshipId())
                    .userId(friend.getUserId())
                    .nickname(friend.getNickname())
                    .email(friend.getEmail())
                    .status(friendship.getStatus().name())
                    .createdAt(friendship.getCreatedAt())
                    .build();
        });
    }
    
    @Transactional
    public void deleteFriend(String userId, Long friendshipId) {
        // 친구 관계 조회
        FriendEntity friendship = friendRepository.findById(friendshipId)
                .orElseThrow(() -> new CustomException(ErrorCode.U4044));
        
        // 권한 확인
        if (!friendship.getRequesterId().equals(userId) && !friendship.getApproverId().equals(userId)) {
            throw new CustomException(ErrorCode.U4044);
        }
        
        // Soft Delete
        friendRepository.delete(friendship);
        
        log.info("Friend deleted: {}", friendshipId);
    }
}
