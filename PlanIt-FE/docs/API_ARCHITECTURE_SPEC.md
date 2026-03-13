# API 아키텍처 명세서

이 프로젝트는 MSA(Microservices Architecture) 구조로 설계된 백엔드 API와 통신합니다.

## 📁 폴더 구조

```
src/api/
├── base.ts                    # 공통 Axios 설정 및 Base Service 클래스
├── index.ts                   # API 모듈 통합 Export
├── user.service.ts            # User Service API (프로필 + 친구 관리)
├── schedule.service.ts        # Schedule Service API (할일 관리)
├── intelligence.service.ts    # Intelligence Service API (AI 기능)
└── insight.service.ts         # Insight Service API (통계/리포트)
```

## 🏗️ MSA 서비스 구조

### 1. User Service (사용자 관리)
**파일:** `user.service.ts`

**기능:**
- 사용자 프로필 조회/수정
- 친구 목록 조회
- 친구 요청 관리 (보내기, 수락, 거절)
- 친구 삭제

**Base URL:** `VITE_USER_SERVICE_URL`

**통합된 기존 API:**
- `user.api.ts` (사용자 프로필)
- `friends.api.ts` (친구 관리)

### 2. Schedule Service (일정 관리)
**파일:** `schedule.service.ts`

**기능:**
- 할일(Task) CRUD
- 할일 완료 상태 토글
- 할일 미루기 (다음날로 연기)
- 기간별 할일 조회
- 친구 할일 조회

**Base URL:** `VITE_SCHEDULE_SERVICE_URL`

**통합된 기존 API:**
- `tasks.api.ts` (할일 관리)

### 3. Intelligence Service (AI 기능)
**파일:** `intelligence.service.ts`

**기능:**
- AI 기반 할일 플랜 생성
- 키워드 기반 할일 추천
- 할일 자동 분류 (카테고리 추천)
- 최적 시간 추천
- 우선순위 분석
- 스마트 할일 재배치

**Base URL:** `VITE_INTELLIGENCE_SERVICE_URL`

### 4. Insight Service (통계/리포트)
**파일:** `insight.service.ts`

**기능:**
- 완료율 통계
- 카테고리별 분석
- 생산성 리포트 (일간/주간/월간)
- 목표 달성률
- 친구와의 비교 통계
- 트렌드 분석

**Base URL:** `VITE_INSIGHT_SERVICE_URL`

## 🔄 Mock 데이터 모드

각 서비스는 개발 환경에서 자동으로 Mock 데이터를 사용합니다.

```typescript
// 개발 환경(DEV)에서는 자동으로 Mock 데이터 사용
private useMock = import.meta.env.DEV;

// 프로덕션 환경에서는 실제 API 호출
if (this.useMock) {
  // Mock 데이터 반환
  return mockData;
}
// 실제 API 호출
return this.get<T>('/api/v1/endpoint');
```

**장점:**
- 백엔드 없이 프론트엔드 개발 가능
- 빠른 프로토타이핑
- 네트워크 지연 시뮬레이션 (300ms)
- 프로덕션 빌드 시 자동으로 실제 API 사용

## � 환경 변수 설정

`.env` 파일에서 각 서비스의 Base URL을 설정합니다:

```env
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_SCHEDULE_SERVICE_URL=http://localhost:3002
VITE_INTELLIGENCE_SERVICE_URL=http://localhost:3003
VITE_INSIGHT_SERVICE_URL=http://localhost:3004
```

### 브랜치별 환경 설정

개발/스테이징/프로덕션 환경에 따라 다른 URL을 사용할 수 있습니다:

```bash
# 개발 환경
.env.development

# 스테이징 환경
.env.staging

# 프로덕션 환경
.env.production
```

자세한 내용은 `docs/ENVIRONMENT_SETUP.md` 참고

## 💡 사용 방법

### 기본 사용법 (권장)

```typescript
import { userService, scheduleService, intelligenceService, insightService } from '@/api';

// 사용자 프로필 조회
const profile = await userService.getProfile();

// 친구 목록 조회
const friends = await userService.getFriends();

// 할일 목록 조회
const tasks = await scheduleService.getTasks('2024-03-15');

// 할일 생성
const newTask = await scheduleService.createTask({
  text: '운동하기',
  date: '2024-03-15',
  category: '운동',
});

// AI 플랜 생성
const plan = await intelligenceService.generatePlan({
  keywords: ['운동', '독서'],
  date: '2024-03-15',
});

// 통계 조회
const stats = await insightService.getCompletionStats('weekly');
```

### 하위 호환성 지원

기존 코드와의 호환성을 위해 별칭 export를 제공합니다:

```typescript
// 기존 방식 (여전히 동작함)
import { userApi, friendsApi, tasksApi } from '@/api';

const profile = await userApi.getProfile();
const friends = await friendsApi.getFriends();
const tasks = await tasksApi.getTasks();

// 새로운 방식 (권장)
import { userService, scheduleService } from '@/api';

const profile = await userService.getProfile();
const friends = await userService.getFriends();
const tasks = await scheduleService.getTasks();
```

### 에러 처리

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorPage from '@/components/common/ErrorPage';

function MyComponent() {
  const { error, handleError, clearError } = useErrorHandler();

  const loadData = async () => {
    try {
      const tasks = await scheduleService.getTasks();
    } catch (err) {
      handleError(err); // 자동으로 에러 타입 분류
    }
  };

  if (error.hasError) {
    return (
      <ErrorPage
        type={error.type}
        onRetry={() => { clearError(); loadData(); }}
      />
    );
  }

  return <div>Content</div>;
}
```

자세한 내용은 `docs/ERROR_HANDLING_GUIDE.md` 참고

## 🔐 인증

모든 API 요청에는 자동으로 인증 토큰이 포함됩니다:

```typescript
// 로그인 후 토큰 저장
localStorage.setItem('accessToken', 'your-token');

// 이후 모든 요청에 자동으로 Authorization 헤더 추가
// Authorization: Bearer your-token
```

**자동 처리:**
- Request Interceptor가 자동으로 토큰 추가
- 401 에러 시 자동으로 로그인 페이지로 리다이렉트
- 토큰 만료 시 자동으로 localStorage에서 제거

## 🎯 주요 기능

### 1. 공통 Axios 인스턴스
- 모든 서비스가 공통 설정을 상속
- Request/Response Interceptor 적용
- 자동 인증 토큰 추가
- 통합 에러 핸들링

### 2. TypeScript 타입 안정성
- 모든 요청/응답에 타입 정의
- IDE 자동완성 지원
- 컴파일 타임 에러 검출

### 3. 재사용 가능한 구조
- BaseApiService 클래스 상속
- 공통 CRUD 메서드 제공 (get, post, put, patch, delete)
- 서비스별 확장 용이

### 4. Mock 데이터 지원
- 개발 환경에서 자동으로 Mock 데이터 사용
- 프로덕션 빌드 시 실제 API 호출
- 네트워크 지연 시뮬레이션

## 📝 API 응답 형식

모든 API는 다음 형식으로 응답합니다:

```typescript
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "Success"
}
```

에러 응답:

```typescript
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔄 마이그레이션 가이드

### 기존 API에서 새 서비스로 마이그레이션

#### 1. User API → User Service

**Before:**
```typescript
import { userApi } from '@/api/user.api';
import { friendsApi } from '@/api/friends.api';

const profile = await userApi.getProfile();
const friends = await friendsApi.getFriends();
```

**After:**
```typescript
import { userService } from '@/api';

const profile = await userService.getProfile();
const friends = await userService.getFriends();
```

#### 2. Tasks API → Schedule Service

**Before:**
```typescript
import { tasksApi } from '@/api/tasks.api';

const tasks = await tasksApi.getTasks();
await tasksApi.addTask({ text: '운동', date: '2024-03-15', category: '운동' });
```

**After:**
```typescript
import { scheduleService } from '@/api';

const tasks = await scheduleService.getTasks();
await scheduleService.createTask({ text: '운동', date: '2024-03-15', category: '운동' });
```

## 🚀 확장 가이드

새로운 서비스를 추가하려면:

### 1. 환경 변수 추가

`.env` 파일에 새 서비스 URL 추가:
```env
VITE_PAYMENT_SERVICE_URL=http://localhost:3005
```

### 2. Base 설정 업데이트

`base.ts`에 서비스 URL과 클라이언트 추가:
```typescript
export const SERVICE_URLS = {
  // ... 기존 서비스
  PAYMENT: import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3005',
};

export const apiClients = {
  // ... 기존 클라이언트
  payment: createApiClient(SERVICE_URLS.PAYMENT),
};
```

### 3. 서비스 클래스 생성

`payment.service.ts` 파일 생성:
```typescript
import { BaseApiService, apiClients } from './base';

// Mock 데이터
let mockPayments = [];

class PaymentService extends BaseApiService {
  private useMock = import.meta.env.DEV;

  constructor() {
    super(apiClients.payment);
  }

  async getPayments() {
    if (this.useMock) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockPayments;
    }
    return this.get('/api/v1/payments');
  }

  // ... 다른 메서드
}

export const paymentService = new PaymentService();
```

### 4. Index에서 Export

`index.ts`에 추가:
```typescript
export { paymentService } from './payment.service';
```

## 📊 서비스별 API 엔드포인트

### User Service
```
GET    /api/v1/profile                      # 프로필 조회
PATCH  /api/v1/profile                      # 프로필 수정
GET    /api/v1/friends                      # 친구 목록
GET    /api/v1/friends/requests             # 친구 요청 목록
POST   /api/v1/friends/requests             # 친구 요청 보내기
POST   /api/v1/friends/requests/:id/accept  # 친구 요청 수락
DELETE /api/v1/friends/requests/:id         # 친구 요청 거절
DELETE /api/v1/friends/:id                  # 친구 삭제
```

### Schedule Service
```
GET    /api/v1/tasks                        # 할일 목록
GET    /api/v1/tasks/:id                    # 할일 조회
POST   /api/v1/tasks                        # 할일 생성
PATCH  /api/v1/tasks/:id                    # 할일 수정
DELETE /api/v1/tasks/:id                    # 할일 삭제
POST   /api/v1/tasks/:id/toggle             # 완료 상태 토글
POST   /api/v1/tasks/:id/postpone           # 할일 미루기
GET    /api/v1/tasks/range                  # 기간별 조회
GET    /api/v1/tasks/friends/:id            # 친구 할일 조회
```

### Intelligence Service
```
POST   /api/v1/ai/generate-plan             # AI 플랜 생성
POST   /api/v1/ai/recommend                 # 할일 추천
POST   /api/v1/ai/categorize                # 자동 분류
POST   /api/v1/ai/suggest-time              # 최적 시간 추천
POST   /api/v1/ai/analyze-priority          # 우선순위 분석
POST   /api/v1/ai/rearrange                 # 스마트 재배치
```

### Insight Service
```
GET    /api/v1/stats/completion             # 완료율 통계
GET    /api/v1/stats/categories             # 카테고리별 통계
GET    /api/v1/stats/compare/:id            # 친구 비교 통계
GET    /api/v1/reports/productivity         # 생산성 리포트
GET    /api/v1/reports/weekly               # 주간 요약
GET    /api/v1/reports/monthly              # 월간 요약
GET    /api/v1/goals/progress               # 목표 달성률
GET    /api/v1/insights/personal            # 개인화 인사이트
GET    /api/v1/insights/trends              # 트렌드 분석
```

## 🧪 테스트

Mock 모드를 활용한 테스트:

```typescript
// 개발 환경에서는 자동으로 Mock 데이터 사용
const tasks = await scheduleService.getTasks();
// → Mock 데이터 반환 (300ms 지연)

// 프로덕션 빌드 시 실제 API 호출
npm run build:production
// → 실제 백엔드 API 호출
```

## 📚 관련 문서

- `docs/ERROR_HANDLING_GUIDE.md` - 에러 처리 가이드
- `docs/ENVIRONMENT_SETUP.md` - 환경 변수 설정 가이드
- `src/api/README.md` - API 모듈 사용 가이드
