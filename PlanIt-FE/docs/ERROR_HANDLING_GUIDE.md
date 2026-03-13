# ErrorPage 사용 가이드

## 📋 목차
1. [기본 사용법](#기본-사용법)
2. [API 통신에서 에러 처리](#api-통신에서-에러-처리)
3. [실전 예제](#실전-예제)

---

## 기본 사용법

### 1. 필요한 파일들
- `src/components/common/ErrorPage.tsx` - 에러 페이지 컴포넌트
- `src/components/common/ErrorBoundary.tsx` - React 에러 경계
- `src/components/common/LoadingSpinner.tsx` - 로딩 스피너
- `src/hooks/useErrorHandler.ts` - 에러 처리 훅

---

## API 통신에서 에러 처리

### 방법 1: useErrorHandler 훅 사용 (권장)

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '@/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorPage from '@/components/common/ErrorPage';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function TasksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  
  // 에러 핸들러 훅 사용
  const { error, handleError, clearError } = useErrorHandler();

  const loadTasks = async () => {
    try {
      setLoading(true);
      clearError(); // 이전 에러 초기화
      
      const data = await scheduleService.getTasks();
      setTasks(data);
    } catch (err) {
      handleError(err); // 에러 자동 분류 및 처리
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // 로딩 중
  if (loading) {
    return <LoadingSpinner message="할일을 불러오는 중..." />;
  }

  // 에러 발생 시
  if (error.hasError) {
    return (
      <ErrorPage
        type={error.type}
        title={error.title}
        message={error.message}
        onRetry={() => {
          clearError();
          loadTasks();
        }}
        onGoHome={() => navigate('/home')}
      />
    );
  }

  // 정상 렌더링
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>{task.text}</div>
      ))}
    </div>
  );
}
```

### 방법 2: 직접 에러 처리

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { scheduleService } from '@/api';
import ErrorPage, { ErrorType } from '@/components/common/ErrorPage';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function TasksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState<{
    show: boolean;
    type: ErrorType;
    message?: string;
  }>({ show: false, type: 'generic' });

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError({ show: false, type: 'generic' });
      
      const data = await scheduleService.getTasks();
      setTasks(data);
    } catch (err) {
      // Axios 에러 처리
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        
        if (status === 401) {
          setError({ 
            show: true, 
            type: 'unauthorized',
            message: '로그인이 필요합니다.' 
          });
        } else if (status === 404) {
          setError({ 
            show: true, 
            type: '404',
            message: '할일 목록을 찾을 수 없습니다.' 
          });
        } else if (status === 500) {
          setError({ 
            show: true, 
            type: '500',
            message: '서버 오류가 발생했습니다.' 
          });
        } else if (err.code === 'ERR_NETWORK') {
          setError({ 
            show: true, 
            type: 'network',
            message: '네트워크 연결을 확인해주세요.' 
          });
        } else {
          setError({ 
            show: true, 
            type: 'generic',
            message: '오류가 발생했습니다.' 
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) {
    return <LoadingSpinner message="할일을 불러오는 중..." />;
  }

  if (error.show) {
    return (
      <ErrorPage
        type={error.type}
        message={error.message}
        onRetry={() => loadTasks()}
        onGoHome={() => navigate('/home')}
      />
    );
  }

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>{task.text}</div>
      ))}
    </div>
  );
}
```

---

## 실전 예제

### 예제 1: 친구 목록 페이지

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { userService } from '@/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorPage from '@/components/common/ErrorPage';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function FriendsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const { error, handleError, clearError } = useErrorHandler();

  const loadFriends = async () => {
    try {
      setLoading(true);
      clearError();
      
      const data = await userService.getFriends();
      setFriends(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  if (loading) {
    return <LoadingSpinner size="large" message="친구 목록을 불러오는 중..." />;
  }

  if (error.hasError) {
    return (
      <ErrorPage
        type={error.type}
        title={error.title}
        message={error.message}
        onRetry={() => {
          clearError();
          loadFriends();
        }}
        onGoHome={() => navigate('/home')}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2>친구 목록</h2>
      {friends.map(friend => (
        <div key={friend.id}>{friend.nickname}</div>
      ))}
    </motion.div>
  );
}

export default FriendsPage;
```

### 예제 2: AI 플랜 생성 페이지

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { intelligenceService } from '@/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorPage from '@/components/common/ErrorPage';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function AiPlanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const { error, handleError, clearError } = useErrorHandler();

  const generatePlan = async (keywords: string[]) => {
    try {
      setLoading(true);
      clearError();
      
      const result = await intelligenceService.generatePlan({
        keywords,
        date: new Date().toISOString().split('T')[0],
      });
      
      setPlan(result);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="large" 
        message="AI가 플랜을 생성하는 중..." 
      />
    );
  }

  if (error.hasError) {
    return (
      <ErrorPage
        type={error.type}
        title={error.title}
        message={error.message}
        onRetry={() => {
          clearError();
          // 이전 키워드로 다시 시도
        }}
        onGoHome={() => navigate('/home')}
      />
    );
  }

  return (
    <div>
      <button onClick={() => generatePlan(['운동', '독서'])}>
        플랜 생성
      </button>
      {plan && <div>{/* 플랜 표시 */}</div>}
    </div>
  );
}

export default AiPlanPage;
```

### 예제 3: 전역 ErrorBoundary 적용

```tsx
// App.tsx
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 에러 로깅 서비스로 전송 (예: Sentry)
        console.error('App Error:', error, errorInfo);
      }}
    >
      <div className="app">
        {/* 앱 컨텐츠 */}
      </div>
    </ErrorBoundary>
  );
}
```

---

## 에러 타입별 자동 분류

`useErrorHandler` 훅은 다음과 같이 자동으로 에러를 분류합니다:

| HTTP Status | ErrorType | 설명 |
|------------|-----------|------|
| 401 | unauthorized | 로그인 필요 |
| 403 | forbidden | 접근 권한 없음 |
| 404 | 404 | 리소스를 찾을 수 없음 |
| 500, 502, 503 | 500 | 서버 오류 |
| ERR_NETWORK | network | 네트워크 연결 오류 |
| 기타 | generic | 일반 오류 |

---

## 주요 포인트

1. **useErrorHandler 훅 사용 권장** - 에러 타입 자동 분류
2. **로딩 상태 관리** - LoadingSpinner로 사용자 경험 개선
3. **재시도 기능 제공** - onRetry로 같은 요청 다시 시도
4. **홈 이동 제공** - onGoHome으로 안전한 페이지로 이동
5. **에러 초기화** - clearError()로 이전 에러 상태 제거

---

## 체크리스트

- [ ] API 호출 전 `clearError()` 호출
- [ ] try-catch로 에러 캐치
- [ ] `handleError(err)`로 에러 처리
- [ ] 로딩 상태 관리 (loading state)
- [ ] ErrorPage에 onRetry, onGoHome 핸들러 제공
- [ ] 전역 ErrorBoundary 적용 (선택)
