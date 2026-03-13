# PlanIt-FE

PlanIt 서비스의 프론트엔드 웹 애플리케이션입니다.  
React + TypeScript + Vite 기반으로 동작하며, 할 일 관리 / 목표 설정 / AI 계획 생성 / 리포트 조회 기능을 제공합니다.

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| 역할 | 사용자 인터페이스 (웹 클라이언트) |
| 포트 | **3000** |
| 연동 백엔드 | User-svc (8081), Schedule-svc (8082), Strategy-svc (8083), Insight-svc (8084) |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19, TypeScript 5.8 |
| 빌드 도구 | Vite 6 |
| 스타일 | Tailwind CSS 4 |
| 애니메이션 | Framer Motion |
| HTTP 클라이언트 | Axios |
| 라우팅 | React Router DOM 7 |
| 차트 | Recharts |
| 인증 | AWS Amplify (Cognito) |

---

## 주요 기능

- 일간 할 일 CRUD (날짜별 조회, 완료 체크, 미루기)
- 월간 목표 + 주차별 목표 설정 및 진행률 표시
- AI 계획 자동 생성 (Strategy-svc → AI)
- 친구 피드 조회 및 이모지 반응
- AI 월간 분석 리포트 조회
- AWS Cognito 소셜 로그인 (회원가입/로그인)

---

## 실행 전 필요 조건

- Node.js 18 이상
- 백엔드 서비스들이 실행 중이어야 정상 동작 (아래 서버 실행 순서 참고)
- `.env` 파일 설정 (아래 환경 변수 참고)

---

## 환경 변수 설정

루트에 `.env` 파일 생성:

```env
VITE_USER_SERVICE_URL=http://localhost:8081
VITE_SCHEDULE_SERVICE_URL=http://localhost:8082
VITE_INTELLIGENCE_SERVICE_URL=http://localhost:8083
VITE_INSIGHT_SERVICE_URL=http://localhost:8084

# AWS Cognito (소셜 로그인용)
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=your-domain.auth.ap-northeast-2.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:3000/callback
```

---

## 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작 (http://localhost:3000)
npm run dev
```

### 기타 명령어

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 타입 체크
npm run lint

# 테스트 실행
npm run test
```

---

## 전체 시스템 서버 실행 순서

PlanIt은 MSA 구조이므로 아래 순서대로 백엔드를 먼저 실행하세요.

```
1. MariaDB 실행 (DB 서버)
2. Redis 실행 (User-svc 토큰 저장용)
3. PlanIt-User-svc        → 포트 8081, gRPC 9091
4. PlanIt-Schedule-svc    → 포트 8082, gRPC 9092
5. PlanIt-InsightAI-svc   → 포트 8085, gRPC 9095  (HTTP + gRPC 두 개 실행)
6. PlanIt-Insight-svc     → 포트 8084, gRPC 9094
7. PlanIt-Strategy-svc    → 포트 8083, gRPC 9093
8. PlanIt-FE              → 포트 3000
```

---

## 프로젝트 구조

```
src/
├── api/              # 서비스별 HTTP 클라이언트 (schedule, strategy, insight, user)
├── components/       # 공통 컴포넌트
├── config/           # 환경 설정
├── constants/        # 상수 (카테고리 목록 등)
├── features/
│   ├── auth/         # 로그인, 콜백, 온보딩 페이지
│   ├── friends/      # 친구 피드
│   ├── insight/      # AI 리포트, 챗봇
│   └── tasks/        # 할 일 / 목표 관리 (메인)
├── hooks/            # 공통 훅
└── types/            # 공통 타입
```