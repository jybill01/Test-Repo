-- 기존 category 테이블에 news_keyword 컬럼 추가
-- 이미 데이터가 있는 경우 사용하는 마이그레이션 스크립트

-- 1. news_keyword 컬럼 추가
ALTER TABLE category ADD COLUMN IF NOT EXISTS news_keyword VARCHAR(100);

-- 2. 기존 데이터에 news_keyword 값 설정
UPDATE category SET news_keyword = 'career development' WHERE name = '직무/커리어';
UPDATE category SET news_keyword = 'language learning' WHERE name = '어학/자격증';
UPDATE category SET news_keyword = 'self development' WHERE name = '독서/학습';
UPDATE category SET news_keyword = 'fitness health' WHERE name = '건강/운동';
UPDATE category SET news_keyword = 'finance investing' WHERE name = '재테크/경제';
UPDATE category SET news_keyword = 'productivity habits' WHERE name = '마인드/루틴';
UPDATE category SET news_keyword = 'hobbies lifestyle' WHERE name = '취미/관계';
UPDATE category SET news_keyword = 'lifestyle trends' WHERE name = '기타';
