package com.planit.strategy.grpc.client;

import com.planit.grpc.schedule.CreatePlanRequest;
import com.planit.grpc.schedule.CreatePlanResponse;
import com.planit.grpc.schedule.ScheduleServiceGrpc;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ScheduleGrpcClient {

    @GrpcClient("schedule-service")
    private ScheduleServiceGrpc.ScheduleServiceBlockingStub scheduleStub;

    public Long createPlan(CreatePlanRequest request) {
        log.info("[gRPC Client] CreatePlanRequest.categoryName = {}", request.getCategoryName());
        
        CreatePlanResponse response = scheduleStub.createPlan(request);

        return response.getGoalId();
    }
}