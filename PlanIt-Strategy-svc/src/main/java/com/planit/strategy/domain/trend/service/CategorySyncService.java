package com.planit.strategy.domain.trend.service;

import com.planit.grpc.user.CategoryInfo;
import com.planit.strategy.domain.trend.repository.CategoryRepository;
import com.planit.strategy.grpc.client.UserServiceGrpcClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * User-svc의 category 테이블을 로컬 category 테이블로 동기화합니다.
 *
 * <p>Strategy-svc의 Category 엔티티는 news_keyword 필드를 추가로 보유합니다.
 * 동기화 시 name만 업데이트하고 news_keyword는 기존 값을 유지합니다.
 * 신규 카테고리의 경우 news_keyword를 name으로 초기화합니다.
 *
 * <p>동기화 시점:
 * <ul>
 *   <li>서비스 시작 시 (ApplicationReadyEvent)</li>
 *   <li>매 시간 정각 (@Scheduled cron)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategorySyncService {

    private final UserServiceGrpcClient userServiceGrpcClient;
    private final CategoryRepository categoryRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        log.info("🔄 [CategorySync] 서비스 시작 시 카테고리 동기화 시작...");
        sync();
    }

    @Scheduled(cron = "0 0 * * * *")
    public void syncPeriodically() {
        log.info("🔄 [CategorySync] 정기 카테고리 동기화 시작...");
        sync();
    }

    private void sync() {
        try {
            List<CategoryInfo> categories = userServiceGrpcClient.getCategories();

            for (CategoryInfo info : categories) {
                // news_keyword: 이미 존재하면 DB의 기존 값 유지 (ON DUPLICATE KEY UPDATE에서 제외)
                // 신규 카테고리이면 name을 기본값으로 사용
                String defaultKeyword = info.getName();
                categoryRepository.upsert(info.getCategoryId(), info.getName(), defaultKeyword);
            }

            log.info("✅ [CategorySync] 카테고리 동기화 완료: {}개", categories.size());
        } catch (Exception e) {
            log.error("❌ [CategorySync] 카테고리 동기화 실패 (User-svc 연결 불가): {}", e.getMessage());
        }
    }
}
