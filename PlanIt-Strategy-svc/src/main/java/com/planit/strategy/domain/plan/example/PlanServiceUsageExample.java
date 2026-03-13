/**
 * [PlanIt Strategy Service - Plan Service Usage Example]
 * PlanService 사용 예시 코드
 * 
 * 이 클래스는 실제 서비스 코드가 아니며, 사용 방법을 보여주기 위한 예시입니다.
 */
package com.planit.strategy.domain.plan.example;

import com.planit.grpc.schedule.CreatePlanRequest;
import com.planit.strategy.domain.plan.dto.AiPlanResponse;
import com.planit.strategy.domain.plan.dto.GoalDto;
import com.planit.strategy.domain.plan.dto.TaskDto;
import com.planit.strategy.domain.plan.dto.WeekGoalDto;
import com.planit.strategy.grpc.client.ScheduleGrpcClient;
import com.planit.strategy.grpc.mapper.PlanProtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;

/**
 * 사용 예시:
 * 
 * 1. AI 응답 DTO 생성
 * 2. Proto Mapper로 변환
 * 3. gRPC Client로 Schedule Service 호출
 */
@Slf4j
@RequiredArgsConstructor
public class PlanServiceUsageExample {
    
    private final PlanProtoMapper planProtoMapper;
    private final ScheduleGrpcClient scheduleGrpcClient;
    
    /**
     * 예시 1: AI 응답을 gRPC로 전송하는 전체 플로우
     */
    public Long exampleFullFlow() {
        // 1. AI 응답 DTO 생성 (실제로는 AI Agent에서 받아옴)
        AiPlanResponse aiResponse = createMockAiResponse();
        
        // 2. gRPC proto 객체로 변환
        String userId = "test-user-123";
        CreatePlanRequest grpcRequest = planProtoMapper.toCreatePlanRequest(userId, aiResponse);
        
        // 3. Schedule Service에 gRPC 호출
        Long goalId = scheduleGrpcClient.createPlan(grpcRequest);
        
        log.info("계획 저장 완료 - GoalId: {}", goalId);
        return goalId;
    }
    
    /**
     * 예시 2: 단계별 변환 과정
     */
    public void exampleStepByStep() {
        // Step 1: AI가 생성한 JSON을 DTO로 파싱 (Jackson 사용)
        // {
        //   "categoryName": "어학/자격증",
        //   "goal": {
        //     "title": "AWS 자격증 취득",
        //     "startDate": "2026-03-03",
        //     "endDate": "2026-03-28",
        //     "weekGoals": [...]
        //   }
        // }
        
        AiPlanResponse aiResponse = AiPlanResponse.builder()
                .categoryName("어학/자격증")
                .goal(GoalDto.builder()
                        .title("AWS 자격증 취득")
                        .startDate(LocalDate.parse("2026-03-03"))
                        .endDate(LocalDate.parse("2026-03-28"))
                        .weekGoals(List.of(
                                WeekGoalDto.builder()
                                        .title("AWS 기초 개념 학습")
                                        .tasks(List.of(
                                                TaskDto.builder()
                                                        .content("IAM, EC2, S3 개념 학습")
                                                        .targetDate(LocalDate.parse("2026-03-04"))
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .build())
                .build();
        
        // Step 2: Proto 객체로 변환
        CreatePlanRequest grpcRequest = planProtoMapper.toCreatePlanRequest("user-123", aiResponse);
        
        // Step 3: gRPC 호출
        Long goalId = scheduleGrpcClient.createPlan(grpcRequest);
        
        log.info("저장된 Goal ID: {}", goalId);
    }
    
    /**
     * Mock AI 응답 생성 (테스트용)
     */
    private AiPlanResponse createMockAiResponse() {
        TaskDto task1 = TaskDto.builder()
                .content("IAM, EC2, S3 개념 학습")
                .targetDate(LocalDate.parse("2026-03-04"))
                .build();
        
        TaskDto task2 = TaskDto.builder()
                .content("VPC, Route53 개념 학습")
                .targetDate(LocalDate.parse("2026-03-05"))
                .build();
        
        WeekGoalDto weekGoal1 = WeekGoalDto.builder()
                .title("AWS 기초 개념 학습")
                .tasks(List.of(task1, task2))
                .build();
        
        WeekGoalDto weekGoal2 = WeekGoalDto.builder()
                .title("실습 및 모의고사")
                .tasks(List.of(
                        TaskDto.builder()
                                .content("AWS 콘솔 실습")
                                .targetDate(LocalDate.parse("2026-03-10"))
                                .build()
                ))
                .build();
        
        GoalDto goal = GoalDto.builder()
                .title("AWS 자격증 취득")
                .startDate(LocalDate.parse("2026-03-03"))
                .endDate(LocalDate.parse("2026-03-28"))
                .weekGoals(List.of(weekGoal1, weekGoal2))
                .build();
        
        return AiPlanResponse.builder()
                .categoryName("어학/자격증")
                .goal(goal)
                .build();
    }
}
