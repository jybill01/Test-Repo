# Common Components

공통으로 사용되는 UI 컴포넌트 모음

## ErrorPage

다양한 에러 상황에 대응하는 에러 페이지 컴포넌트

### 사용법

```tsx
import ErrorPage from '@/components/common/ErrorPage';

// 404 에러
<ErrorPage 
  type="404" 
  onRetry={() => window.location.reload()}
  onGoHome={() => navigate('/')}
/>

// 네트워크 에러
<ErrorPage 
  type="network" 
  onRetry={handleRetry}
/>

// 커스텀 에러
<ErrorPage 
  type="generic"
  title="커스텀 제목"
  message="커스텀 메시지"
  onRetry={handleRetry}
  showHomeButton={false}
/>
```

### Props

- `type`: 에러 타입 ('404' | '500' | 'network' | 'unauthorized' | 'forbidden' | 'generic')
- `title`: 커스텀 제목 (선택)
- `message`: 커스텀 메시지 (선택)
- `onRetry`: 재시도 버튼 클릭 핸들러 (선택)
- `onGoHome`: 홈 버튼 클릭 핸들러 (선택)
- `showHomeButton`: 홈 버튼 표시 여부 (기본: true)

## ErrorBoundary

React 컴포넌트 트리에서 발생하는 에러를 캐치하는 Error Boundary

### 사용법

```tsx
import ErrorBoundary from '@/components/common/ErrorBoundary';

// 기본 사용
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 커스텀 fallback
<ErrorBoundary 
  fallback={<CustomErrorPage />}
  onError={(error, errorInfo) => {
    console.error('Error:', error);
    // 에러 로깅 서비스로 전송
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## LoadingSpinner

로딩 상태를 표시하는 스피너 컴포넌트

### 사용법

```tsx
import LoadingSpinner from '@/components/common/LoadingSpinner';

// 기본 사용
<LoadingSpinner />

// 크기 및 메시지 지정
<LoadingSpinner 
  size="large" 
  message="데이터를 불러오는 중..." 
/>

// 전체 화면 로딩
<LoadingSpinner 
  fullScreen 
  message="잠시만 기다려주세요" 
/>
```

### Props

- `size`: 스피너 크기 ('small' | 'medium' | 'large')
- `message`: 로딩 메시지 (선택)
- `fullScreen`: 전체 화면 표시 여부 (기본: false)

## useErrorHandler Hook

API 에러 처리를 위한 커스텀 훅

### 사용법

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorPage from '@/components/common/ErrorPage';

function MyComponent() {
  const { error, handleError, clearError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
    } catch (err) {
      handleError(err);
    }
  };

  if (error.hasError) {
    return (
      <ErrorPage
        type={error.type}
        title={error.title}
        message={error.message}
        onRetry={() => {
          clearError();
          fetchData();
        }}
      />
    );
  }

  return <div>Content</div>;
}
```

## 통합 예제

```tsx
import { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ErrorPage from '@/components/common/ErrorPage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { scheduleService } from '@/api';

function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const { error, handleError, clearError } = useErrorHandler();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getTasks();
      setTasks(data);
    } catch (err) {
      handleError(err);
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
      />
    );
  }

  return (
    <ErrorBoundary>
      <div>
        {/* Tasks content */}
      </div>
    </ErrorBoundary>
  );
}

export default TasksPage;
```
