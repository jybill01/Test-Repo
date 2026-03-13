-- 관심 카테고리 초기 데이터 (Schedule-svc category_list 기준)
INSERT IGNORE INTO interest_category (category_id, name, color_hex, description) VALUES
(1, '직무/커리어', '#4F46E5', '직무 역량과 커리어 개발을 위한 활동'),
(2, '어학/자격증', '#0EA5E9', '어학 공부 및 자격증 취득 활동'),
(3, '독서/학습', '#10B981', '독서와 학습을 통한 지식 습득'),
(4, '건강/운동', '#EF4444', '건강 관리와 체력 향상을 위한 운동'),
(5, '재테크/경제', '#F59E0B', '재테크와 경제 지식을 위한 활동'),
(6, '마인드/루틴', '#8B5CF6', '마음챙김과 일상 루틴 관리'),
(7, '취미/관계', '#EC4899', '취미 활동과 대인관계 향상'),
(8, '기타', '#6B7280', '기타 자기계발 활동');

-- 약관 초기 데이터 (프론트엔드 ID 매칭: 1, 2, 3)
INSERT IGNORE INTO terms (term_id, title, content, version, is_required, type) VALUES
(1, '서비스 이용약관', '본 약관은 PlanIt 서비스 이용에 관한 기본적인 사항을 규정합니다...', 'v1.0', TRUE, 'SERVICE'),
(2, '개인정보 처리방침', 'PlanIt은 이용자의 개인정보를 중요시하며, 개인정보 보호법을 준수합니다...', 'v1.0', TRUE, 'PRIVACY'),
(3, '마케팅 정보 수신 동의', '이벤트 및 프로모션 정보를 이메일로 수신하는 것에 동의합니다...', 'v1.0', FALSE, 'MARKETING'),
(4, '90일 보관 정책', '탈퇴 후 90일간 개인정보를 보관하며, 이후 자동으로 삭제됩니다...', 'v1.0', FALSE, 'RETENTION');
