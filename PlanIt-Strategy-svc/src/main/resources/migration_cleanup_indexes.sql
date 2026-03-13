-- 인덱스 정리 및 최적화

-- 최신 배치 조회 성능 향상을 위한 복합 인덱스 추가
-- (기존 idx_trend_category_date는 FK 제약조건에 사용되므로 유지)
CREATE INDEX idx_trend_batch_category_score ON trend(batch_id, category_id, score DESC);

-- 완료 메시지
SELECT 'Index optimization completed successfully!' AS status;
