-- 카테고리 초기 데이터
-- Spring Boot가 시작될 때 자동으로 실행됨 (spring.sql.init.mode=always 설정 필요)

INSERT INTO category (id, name, news_keyword, created_at, updated_at) VALUES
(1, '직무/커리어', 'career development', NOW(), NOW()),
(2, '어학/자격증', 'language learning', NOW(), NOW()),
(3, '독서/학습', 'self development', NOW(), NOW()),
(4, '건강/운동', 'fitness health', NOW(), NOW()),
(5, '재테크/경제', 'finance investing', NOW(), NOW()),
(6, '마인드/루틴', 'productivity habits', NOW(), NOW()),
(7, '취미/관계', 'hobbies lifestyle', NOW(), NOW()),
(8, '기타', 'lifestyle trends', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name, news_keyword = VALUES(news_keyword);

-- AUTO_INCREMENT를 9부터 시작하도록 설정
ALTER TABLE category AUTO_INCREMENT = 9;
