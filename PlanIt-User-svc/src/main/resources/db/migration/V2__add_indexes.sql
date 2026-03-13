-- 성능 최적화를 위한 인덱스 추가

-- users 테이블 인덱스
-- cognito_sub는 이미 UNIQUE 제약조건으로 인덱스가 자동 생성됨
-- nickname은 이미 UNIQUE 제약조건으로 인덱스가 자동 생성됨

-- 탈퇴하지 않은 사용자 조회 최적화
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- 닉네임 검색 최적화 (부분 일치 검색용)
CREATE INDEX idx_users_nickname_deleted_at ON users(nickname, deleted_at);

-- friends 테이블 인덱스
-- 친구 요청 상태별 조회 최적화
CREATE INDEX idx_friends_status ON friends(status);

-- Approver의 PENDING 요청 조회 최적화
CREATE INDEX idx_friends_approver_status_deleted ON friends(approver_id, status, deleted_at);

-- 사용자별 친구 목록 조회 최적화
CREATE INDEX idx_friends_requester_status_deleted ON friends(requester_id, status, deleted_at);

-- 양방향 친구 관계 조회 최적화 (복합 인덱스)
CREATE INDEX idx_friends_users_status ON friends(requester_id, approver_id, status, deleted_at);

-- Soft Delete 조회 최적화
CREATE INDEX idx_friends_deleted_at ON friends(deleted_at);

-- user_interest 테이블 인덱스
-- 사용자별 관심 카테고리 조회 최적화
CREATE INDEX idx_user_interest_user_id ON user_interest(user_id);

-- 카테고리별 사용자 조회 최적화
CREATE INDEX idx_user_interest_category_id ON user_interest(category_id);

-- Soft Delete 조회 최적화
CREATE INDEX idx_user_interest_deleted_at ON user_interest(deleted_at);

-- user_agreements 테이블 인덱스
-- 사용자별 약관 동의 이력 조회 최적화
CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);

-- 약관별 동의 이력 조회 최적화
CREATE INDEX idx_user_agreements_term_id ON user_agreements(term_id);

-- terms 테이블 인덱스
-- 약관 타입별 조회 최적화
CREATE INDEX idx_terms_type ON terms(type);

-- 필수 약관 조회 최적화
CREATE INDEX idx_terms_is_required ON terms(is_required);
