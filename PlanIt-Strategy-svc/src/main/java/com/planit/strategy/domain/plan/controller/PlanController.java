/**
 * [PlanIt Strategy Service - Plan Controller]
 * 계획 생성 API 컨트롤러
 */
package com.planit.strategy.domain.plan.controller;

import com.planit.strategy.common.ApiResponse;
import com.planit.strategy.domain.plan.dto.PlanRequest;
import com.planit.strategy.domain.plan.dto.PlanResponse;
import com.planit.strategy.domain.plan.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/strategy/plans")
@RequiredArgsConstructor
public class PlanController {
    
    private final PlanService planService;
    
    /**
     * 실행 계획 생성 (AI 호출, DB 저장 없음)
     * 
     * @param request 계획 생성 요청
     * @return AI가 생성한 계획 (PlanResponse)
     */
    @PostMapping("/generate")
    public ApiResponse<PlanResponse> generatePlan(@RequestBody PlanRequest request) {
        log.info("계획 생성 요청 - Goal: {}", request.getGoalText());
        PlanResponse response = planService.generatePlan(request);
        return ApiResponse.success(response);
    }
    
    /**
     * 계획 저장 (AI 호출 없음, gRPC만 호출)
     * 프론트에서 /generate로 받은 PlanResponse를 그대로 전달받아 Schedule Service에 저장
     * 
     * @param userId 사용자 ID
     * @param planResponse /generate API에서 받은 계획 데이터
     * @return 생성된 Goal ID
     */
    @PostMapping("/save")
    public ApiResponse<Long> savePlan(
            @AuthenticationPrincipal String userId,
            @RequestBody PlanResponse planResponse) {
        log.info("계획 저장 요청 - UserId: {}, Goal: {}", userId, planResponse.getGoal().getTitle());
        log.info("[Controller] PlanResponse.categoryName = {}", planResponse.getCategoryName());
        log.info("[Controller] PlanResponse.goal.title = {}", planResponse.getGoal().getTitle());
        Long goalId = planService.savePlan(userId, planResponse);
        return ApiResponse.success(goalId);
    }
}
