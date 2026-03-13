# PlanIt-User-svc

PlanIt의 사용자 인증·프로필·친구 관리를 담당하는 마이크로서비스입니다.  
다른 모든 서비스에 JWT 검증 및 카테고리 목록을 gRPC로 제공하므로 **가장 먼저 실행**해야 합니다.

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| 역할 | 인증 / 사용자 관리 / 카테고리 마스터 데이터 |
| HTTP 포트 | **8081** |
| gRPC 포트 | **9091** |
| DB | `planit_user_db` (MariaDB) |
| 외부 의존 | MariaDB, Redis, AWS Cognito |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 / 프레임워크 | Java 17, Spring Boot 3.5 |
| ORM | Spring Data JPA (Hibernate) |
| DB | MariaDB |
| 캐시 / 세션 | Redis (Refresh Token 저장) |
| 인증 | AWS Cognito + JWT (jjwt 0.12) |
| ID 전략 | UUID v7 |
| gRPC | grpc-spring-boot-starter |

---

## 주요 기능

- 회원가입 / 로그인 (Cognito ID Token 검증 → 자체 JWT 발급)
- JWT Access Token / Refresh Token 발급 및 갱신
- Soft Delete 기반 계정 삭제
- 프로필 수정 (닉네임, 관심 카테고리)
- 닉네임 기반 유저 검색
- 친구 요청 / 수락 / 거절 / 삭제
- 8대 관심 카테고리 마스터 데이터 보유 및 gRPC 제공

---

## 실행 전 필요 조건

1. **MariaDB** 실행 중 (`planit_user_db` 데이터베이스 생성 필요)
2. **Redis** 실행 중 (기본 포트 6379)
3. **AWS Cognito** User Pool 및 Client ID 설정
4. `.env` 파일 또는 환경 변수 설정

---

## 환경 변수 설정

루트에 `.env` 파일 생성:

```env
# DB
SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:3306/planit_user_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=root

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=planit-user-service-secret-key-change-in-production-please

# AWS Cognito
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY=AKIA...
AWS_SECRET_KEY=...
COGNITO_USER_POOL_ID=ap-northeast-2_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## DB 생성

```sql
CREATE DATABASE planit_user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 애플리케이션 실행 시 `ddl-auto: create`로 테이블이 자동 생성되고, `data.sql`로 기본 데이터(카테고리 8개, 약관)가 자동 삽입됩니다.

---

## 실행 방법

```bash
# 실행
./gradlew clean bootRun

# 빌드만 (jar 생성)
./gradlew clean build
```

서버 기동 후 확인:
- REST: `http://localhost:8081/api/v1/user/actuator/health`
- Swagger: `http://localhost:8081/swagger-ui.html`

---

## 주요 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/auth/signup` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| POST | `/api/v1/users/auth/refresh` | 토큰 갱신 |
| DELETE | `/api/v1/auth/withdraw` | 회원 탈퇴 |
| PUT | `/api/v1/users/profile` | 프로필 수정 |
| GET | `/api/v1/users/search` | 닉네임 검색 |
| GET | `/api/v1/users/friends` | 친구 목록 |
| POST | `/api/v1/users/friends/requests` | 친구 요청 처리 |
| GET | `/api/v1/users/categories` | 카테고리 목록 (인증 불필요) |

---

## gRPC 제공 API

다른 서비스(Schedule, Insight, Strategy)가 시작할 때 이 서비스의 gRPC를 호출하여 카테고리 8개를 동기화합니다.

```protobuf
service UserService {
  rpc GetCategories(GetCategoriesRequest) returns (GetCategoriesResponse);
}
```

## 기술 스택

- Java 17
- Spring Boot 3.5.11
- Spring Data JPA
- MariaDB
- Redis
- AWS Cognito
- JWT (jjwt 0.12.3)
- UUID v7
- Lombok

## 주요 기능

### 인증 (Authentication)
- 회원가입 (Cognito 연동)
- 로그인 (Cognito ID Token 검증)
- 계정 삭제 (Soft Delete)
- JWT 토큰 발급 및 검증

### 프로필 (Profile)
- 프로필 수정 (닉네임, 관심 카테고리)
- 유저 검색 (닉네임 기반)

### 친구 (Friends)
- 친구 요청 처리 (수락/거절)
- 받은 친구 요청 목록 조회
- 친구 목록 조회
- 친구 삭제

### 메타데이터 (Metadata)
- 관심 카테고리 조회 (8대 카테고리)
- 약관 목록 조회

## API 엔드포인트

### 인증 API
- `POST /api/v1/users/auth/signup` - 회원가입
- `POST /api/v1/users/auth/login` - 로그인
- `DELETE /api/v1/users/auth/withdraw` - 계정 삭제

### 프로필 API
- `PUT /api/v1/users/profile` - 프로필 수정
- `GET /api/v1/users/search` - 유저 검색

### 친구 API
- `POST /api/v1/users/friends/requests` - 친구 요청 처리
- `GET /api/v1/users/friends/requests/received` - 받은 친구 요청 목록
- `GET /api/v1/users/friends` - 친구 목록
- `DELETE /api/v1/users/friends/{friendshipId}` - 친구 삭제

### 메타데이터 API
- `GET /api/v1/users/categories` - 카테고리 목록 (인증 불필요)
- `GET /api/v1/users/terms` - 약관 목록 (인증 불필요)

## 환경 설정

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/planit_user_db
    username: root
    password: password
  
  data:
    redis:
      host: localhost
      port: 6379

jwt:
  secret: your-secret-key-here
  access-token-validity: 900000  # 15분
  refresh-token-validity: 604800000  # 7일

aws:
  region: ap-northeast-2
  cognito:
    user-pool-id: your-user-pool-id
  credentials:
    access-key: your-access-key
    secret-key: your-secret-key
```

## 실행 방법

### 1. 데이터베이스 준비
```bash
# MariaDB 실행
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE planit_user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Redis 실행
```bash
redis-server
```

### 3. 애플리케이션 실행
```bash
# 빌드
./gradlew clean build

# 실행
./gradlew bootRun
```

## 데이터베이스 스키마

### users
- user_id (PK, UUID v7)
- nickname (UNIQUE)
- email (UNIQUE)
- cognito_sub (UNIQUE)
- is_retention_agreed
- created_at, updated_at, deleted_at

### terms
- term_id (PK, AUTO_INCREMENT)
- title, content, version
- is_required, type

### user_agreements
- agreement_id (PK, AUTO_INCREMENT)
- user_id (FK), term_id (FK)
- agreed_at

### interest_category
- category_id (PK, AUTO_INCREMENT)
- name, color_hex, description

### user_interest
- interest_id (PK, AUTO_INCREMENT)
- user_id (FK), category_id (FK)
- created_at, deleted_at

### friends
- friendship_id (PK, AUTO_INCREMENT)
- requester_id (FK), approver_id (FK)
- status (PENDING, ACCEPTED, REJECTED)
- created_at, updated_at, deleted_at

## 보안

- JWT 기반 인증
- AWS Cognito 연동
- Refresh Token은 Redis에 저장
- Soft Delete 패턴 적용
- CORS 설정

## 포트

- HTTP: 8080
- gRPC: 9090
