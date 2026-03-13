-- 카테고리 데이터를 Schedule-svc category_list 기준으로 교체
-- user_interest FK 제약 때문에 먼저 삭제 후 재삽입

DELETE FROM user_interest;
DELETE FROM interest_category;

INSERT INTO interest_category (name, color_hex, description) VALUES
('직무/커리어', '#4F46E5', '직무 역량과 커리어 개발을 위한 활동'),
('어학/자격증', '#0EA5E9', '어학 공부 및 자격증 취득 활동'),
('독서/학습', '#10B981', '독서와 학습을 통한 지식 습득'),
('건강/운동', '#EF4444', '건강 관리와 체력 향상을 위한 운동'),
('재테크/경제', '#F59E0B', '재테크와 경제 지식을 위한 활동'),
('마인드/루틴', '#8B5CF6', '마음챙김과 일상 루틴 관리'),
('취미/관계', '#EC4899', '취미 활동과 대인관계 향상'),
('기타', '#6B7280', '기타 자기계발 활동');
