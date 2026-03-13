-- User Service 초기 스키마

-- users 테이블
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY COMMENT 'UUID v7',
    nickname VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    cognito_sub VARCHAR(100) NOT NULL UNIQUE,
    is_retention_agreed BOOLEAN DEFAULT FALSE COMMENT '90일 보관 정책 동의 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft Delete',
    INDEX idx_cognito_sub (cognito_sub),
    INDEX idx_nickname (nickname),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- terms 테이블
CREATE TABLE terms (
    term_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(20) NOT NULL COMMENT 'v1.0, v1.1 등',
    is_required BOOLEAN DEFAULT TRUE,
    type VARCHAR(20) COMMENT 'SERVICE, PRIVACY, RETENTION'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_agreements 테이블
CREATE TABLE user_agreements (
    agreement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    term_id INT NOT NULL,
    agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (term_id) REFERENCES terms(term_id),
    INDEX idx_user_id (user_id),
    INDEX idx_term_id (term_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- interest_category 테이블
CREATE TABLE interest_category (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    color_hex VARCHAR(7),
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_interest 테이블
CREATE TABLE user_interest (
    interest_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES interest_category(category_id),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- friends 테이블
CREATE TABLE friends (
    friendship_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id VARCHAR(36) NOT NULL,
    approver_id VARCHAR(36) NOT NULL,
    status VARCHAR(10) NOT NULL COMMENT 'ACCEPTED, REJECTED, PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (requester_id) REFERENCES users(user_id),
    FOREIGN KEY (approver_id) REFERENCES users(user_id),
    INDEX idx_requester_id (requester_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
