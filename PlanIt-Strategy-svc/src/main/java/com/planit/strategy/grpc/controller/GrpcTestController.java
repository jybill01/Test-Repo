package com.planit.strategy.grpc.controller;

import com.planit.strategy.grpc.client.ScheduleGrpcClient;
import com.planit.grpc.schedule.CreatePlanRequest;
import com.planit.grpc.schedule.Goal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class GrpcTestController {

    private final ScheduleGrpcClient scheduleGrpcClient;

    @GetMapping("/test/grpc")
    public Long testGrpc() {

        Goal goal = Goal.newBuilder()
                .setTitle("AWS 자격증 취득")
                .setStartDate("2026-03-03")
                .setEndDate("2026-03-28")
                .build();

        CreatePlanRequest request = CreatePlanRequest.newBuilder()
                .setUserId("test-user")
                .setCategoryName("어학/자격증")
                .setGoal(goal)
                .build();

        return scheduleGrpcClient.createPlan(request);
    }
}