-- 트렌드 배치 관리 구조로 리팩토링
-- Step 1: trend_batch 테이블 생성

CREATE TABLE IF NOT EXISTS trend_batch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    INDEX idx_trend_batch_created_at (created_at DESC)
) COMMENT '트렌드 생성 배치 관리 테이블';

-- Step 2: 기존 데이터 마이그레이션을 위한 임시 배치 생성
INSERT INTO trend_batch (created_at) VALUES (NOW());
SET @default_batch_id = LAST_INSERT_ID();

-- Step 3: trend 테이블에 batch_id 컬럼 추가 (임시로 NULL 허용)
ALTER TABLE trend 
ADD COLUMN batch_id BIGINT COMMENT '트렌드 배치 ID';

-- Step 4: 기존 trend 데이터에 기본 batch_id 설정
UPDATE trend 
SET batch_id = @default_batch_id
WHERE batch_id IS NULL;

-- Step 5: batch_id를 NOT NULL로 변경하고 FK 제약조건 추가
ALTER TABLE trend 
MODIFY COLUMN batch_id BIGINT NOT NULL,
ADD CONSTRAINT fk_trend_batch 
    FOREIGN KEY (batch_id) REFERENCES trend_batch(id);

-- Step 6: 기존 generation_id, generated_date 컬럼 제거
ALTER TABLE trend 
DROP COLUMN generation_id,
DROP COLUMN generated_date;

-- Step 7: 새로운 인덱스 추가 (최신 배치 조회 성능 향상)
CREATE INDEX idx_trend_batch_category ON trend(batch_id, category_id, score DESC);

-- 완료 메시지
SELECT 'Migration completed successfully!' AS status;
