/**
 * [PlanIt Strategy Service - Plan Proto Mapper]
 * AI 응답 DTO를 gRPC proto 객체로 변환하는 매퍼
 */
package com.planit.strategy.grpc.mapper;

import com.planit.grpc.schedule.CreatePlanRequest;
import com.planit.grpc.schedule.Goal;
import com.planit.grpc.schedule.Task;
import com.planit.grpc.schedule.WeekGoal;
import com.planit.strategy.domain.plan.dto.AiPlanResponse;
import com.planit.strategy.domain.plan.dto.GoalDto;
import com.planit.strategy.domain.plan.dto.TaskDto;
import com.planit.strategy.domain.plan.dto.WeekGoalDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PlanProtoMapper {
    
    /**
     * AI 응답 DTO를 gRPC CreatePlanRequest로 변환
     * 
     * @param userId 사용자 ID
     * @param aiResponse AI가 생성한 계획 응답
     * @return gRPC CreatePlanRequest 객체
     */
    public CreatePlanRequest toCreatePlanRequest(String userId, AiPlanResponse aiResponse) {
        CreatePlanRequest request = CreatePlanRequest.newBuilder()
                .setUserId(userId)
                .setCategoryName(aiResponse.getCategoryName())
                .setGoal(toGoalProto(aiResponse.getGoal()))
                .build();
        
        org.slf4j.LoggerFactory.getLogger(this.getClass())
                .info("[Mapper] CreatePlanRequest.categoryName = {}", request.getCategoryName());
        
        return request;
    }
    
    /**
     * GoalDto를 gRPC Goal proto로 변환
     */
    private Goal toGoalProto(GoalDto goalDto) {
        Goal.Builder goalBuilder = Goal.newBuilder()
                .setTitle(goalDto.getTitle())
                .setStartDate(goalDto.getStartDate().toString())  // LocalDate.toString() = yyyy-MM-dd
                .setEndDate(goalDto.getEndDate().toString());      // LocalDate.toString() = yyyy-MM-dd
        
        if (goalDto.getWeekGoals() != null) {
            List<WeekGoal> weekGoals = goalDto.getWeekGoals().stream()
                    .map(this::toWeekGoalProto)
                    .collect(Collectors.toList());
            goalBuilder.addAllWeekGoals(weekGoals);
        }
        
        return goalBuilder.build();
    }
    
    /**
     * WeekGoalDto를 gRPC WeekGoal proto로 변환
     */
    private WeekGoal toWeekGoalProto(WeekGoalDto weekGoalDto) {
        WeekGoal.Builder weekGoalBuilder = WeekGoal.newBuilder()
                .setTitle(weekGoalDto.getTitle());
        
        if (weekGoalDto.getTasks() != null) {
            List<Task> tasks = weekGoalDto.getTasks().stream()
                    .map(this::toTaskProto)
                    .collect(Collectors.toList());
            weekGoalBuilder.addAllTasks(tasks);
        }
        
        return weekGoalBuilder.build();
    }
    
    /**
     * TaskDto를 gRPC Task proto로 변환
     */
    private Task toTaskProto(TaskDto taskDto) {
        return Task.newBuilder()
                .setContent(taskDto.getContent())
                .setTargetDate(taskDto.getTargetDate().toString())  // LocalDate.toString() = yyyy-MM-dd
                .build();
    }
}
