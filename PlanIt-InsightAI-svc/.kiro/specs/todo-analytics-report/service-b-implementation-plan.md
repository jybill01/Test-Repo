# Service B (Python FastAPI) 구현 계획

## 개요

Service B는 AWS Bedrock의 Claude 3.5 Sonnet v2 모델을 활용하여 AI 기반 리포트 생성과 MCP 챗봇 기능을 제공하는 Python FastAPI 서비스입니다.

## 1. 기술 스택 및 라이브러리 (requirements.txt)

### 핵심 프레임워크
- **FastAPI 0.115.0**: 고성능 비동기 웹 프레임워크
- **Uvicorn 0.32.0**: ASGI 서버
- **Pydantic 2.9.0**: 데이터 검증 및 직렬화

### AWS Bedrock 통합
- **boto3 1.35.0**: AWS SDK for Python
- **botocore 1.35.0**: boto3의 핵심 라이브러리
- ⚠️ **주의**: OpenAI나 Anthropic Direct API가 아닌, 반드시 AWS Bedrock의 Converse API를 사용
- ⚠️ **langchain-aws는 사용하지 않음**: boto3만으로 충분하며, 불필요한 의존성 추가 방지

### 데이터베이스 (Bedrock Tool Use용)
- **aiomysql 0.2.0**: 비동기 MariaDB 연결 (FastAPI 성능 최적화)
- **cryptography 43.0.0**: aiomysql의 보안 연결 지원

### 개발 및 테스트
- **pytest 8.3.0**: 테스트 프레임워크
- **pytest-asyncio 0.24.0**: 비동기 테스트 지원
- **hypothesis 6.115.0**: Property-Based Testing
- **python-dotenv 1.0.0**: 환경 변수 관리

### 유틸리티
- **python-json-logger 2.0.7**: 구조화된 JSON 로깅


## 2. 디렉토리 구조

```
service-b/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI 애플리케이션 진입점
│   ├── config.py                    # 환경 변수 설정 (Pydantic Settings)
│   │
│   ├── models/                      # Pydantic 데이터 모델
│   │   ├── __init__.py
│   │   ├── request.py               # API 요청 모델
│   │   └── response.py              # API 응답 모델
│   │
│   ├── services/                    # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── report_generator.py     # Context Injection 방식 리포트 생성
│   │   └── chatbot.py               # MCP Tool Use 방식 챗봇
│   │
│   ├── clients/                     # 외부 서비스 클라이언트
│   │   ├── __init__.py
│   │   ├── bedrock_client.py       # AWS Bedrock 클라이언트
│   │   └── database_client.py      # MariaDB 클라이언트 (MCP용)
│   │
│   ├── utils/                       # 유틸리티
│   │   ├── __init__.py
│   │   ├── logger.py                # 구조화된 로깅
│   │   └── json_parser.py           # JSON 파싱 유틸리티
│   │
│   └── exceptions/                  # 커스텀 예외
│       ├── __init__.py
│       └── errors.py                # 에러 코드 및 예외 클래스
│
├── tests/                           # 테스트 코드
│   ├── __init__.py
│   ├── conftest.py                  # pytest 설정
│   ├── test_report_generator.py
│   ├── test_chatbot.py
│   └── test_integration.py
│
├── .env.example                     # 환경 변수 예시
├── .gitignore
├── requirements.txt                 # Python 의존성
├── Dockerfile                       # 컨테이너 이미지
└── README.md                        # 실행 가이드
```


## 3. API 엔드포인트 설계

### 3.1 리포트 생성 API (Context Injection)

**Endpoint**: `POST /ai/reports/generate`

**목적**: Java 배치가 조회한 통계 데이터를 받아 AI 피드백 생성

**Request Body**:
```json
{
  "user_id": "USER123",
  "year_month": "2026-02",
  "week": 9,
  "stats_data": {
    "growth": {
      "topic_name": "운동",
      "growth_rate": 24,
      "previous_completion_rate": 65,
      "current_completion_rate": 89
    },
    "timeline": {
      "chart_data": [
        {"month": "2025-11", "completion_rate": 45},
        {"month": "2025-12", "completion_rate": 60},
        {"month": "2026-01", "completion_rate": 72},
        {"month": "2026-02", "completion_rate": 89}
      ]
    },
    "pattern": {
      "daily_stats": [
        {"day": "MONDAY", "total": 10, "completed": 8, "postponed": 2},
        {"day": "TUESDAY", "total": 12, "completed": 10, "postponed": 2},
        {"day": "SUNDAY", "total": 15, "completed": 7, "postponed": 8}
      ]
    },
    "summary": {
      "total_tasks": 84,
      "completed_tasks": 67,
      "completion_rate": 79.8,
      "achievement_trend": "+12%"
    }
  }
}
```

**Response Body**:
```json
{
  "success": true,
  "report_data": {
    "growth": {
      "topicName": "운동",
      "growthRate": 24,
      "message": "운동 주제에서 24% 성장하셨네요! 꾸준한 노력이 빛을 발하고 있어요."
    },
    "timeline": {
      "chartData": [...],
      "message": "지난 4개월간 꾸준히 상승하는 추세예요."
    },
    "pattern": {
      "worstDay": "SUNDAY",
      "avgPostponeCount": 5.2,
      "chartData": [...],
      "message": "일요일에 미루는 경향이 있어요. 주말 계획을 조금 줄여보세요."
    },
    "summary": {
      "message": "이번 달 전체적으로 79.8%의 완료율을 기록하셨어요. 훌륭해요!"
    }
  },
  "generated_at": "2026-03-04T16:30:00Z"
}
```


### 3.2 챗봇 질의 API (Bedrock Tool Use)

**Endpoint**: `POST /ai/chat/query`

**목적**: 사용자의 자연어 질의를 받아 Claude가 Bedrock Tool Use를 통해 자율적으로 데이터 조회 및 분석

**Request Body**:
```json
{
  "user_id": "USER123",
  "query": "지난 주에 내가 가장 많이 미룬 요일은 언제야?"
}
```

**Response Body**:
```json
{
  "answer": "지난 주에 가장 많이 미룬 요일은 일요일이에요. 총 8개의 할 일을 미루셨네요. 주말에는 계획을 조금 줄여보는 것은 어떨까요?",
  "sources": [
    "user_action_logs 테이블 조회 (2026-02-17 ~ 2026-02-23)"
  ],
  "generated_at": "2026-03-04T16:35:00Z"
}
```

**특징**:
- Claude가 Bedrock Tool Use를 통해 자율적으로 MariaDB 조회
- 사용자 질의에 따라 동적으로 필요한 데이터만 조회
- 복잡한 분석 질문도 처리 가능


## 4. 핵심 AI 워크플로우 처리 전략

### 4.1 워크플로우 1: 대시보드 리포트 생성 (Context Injection)

**개념**: Service A가 미리 조회한 통계 데이터를 프롬프트에 주입하여 AI가 피드백 생성

**처리 흐름**:

```
1. FastAPI 엔드포인트 수신
   └─> POST /ai/reports/generate
   └─> Request 데이터 검증 (Pydantic)

2. ReportGeneratorService.generate_report() 호출
   └─> Prompt Chaining 기법 사용 (4단계)

3. Step 1: Growth Feedback 생성
   ├─> 프롬프트 구성: stats_data['growth'] 주입
   ├─> Bedrock Converse API 호출
   │   └─> Model: anthropic.claude-sonnet-4-5-20250929-v1:0
   │   └─> Temperature: 0.7 (창의적 응답)
   │   └─> Max Tokens: 500
   ├─> JSON 응답 파싱
   └─> 결과: {"topicName": "...", "growthRate": 24, "message": "..."}

4. Step 2: Timeline Feedback 생성
   ├─> 프롬프트 구성: stats_data['timeline'] 주입
   ├─> Bedrock Converse API 호출
   ├─> JSON 응답 파싱
   └─> 결과: {"chartData": [...], "message": "..."}

5. Step 3: Pattern Feedback 생성
   ├─> 프롬프트 구성: stats_data['pattern'] 주입
   ├─> Bedrock Converse API 호출
   ├─> JSON 응답 파싱
   └─> 결과: {"worstDay": "SUNDAY", "avgPostponeCount": 5.2, "message": "..."}

6. Step 4: Summary Feedback 생성 (Prompt Chaining)
   ├─> 프롬프트 구성: 이전 3개 결과 + stats_data['summary'] 주입
   ├─> Bedrock Converse API 호출
   ├─> JSON 응답 파싱
   └─> 결과: {"message": "..."}

7. 4개 피드백 통합
   └─> Pydantic 응답 모델로 변환 (alias_generator=to_camel)
   └─> model_dump(by_alias=True)로 camelCase 직렬화

8. FastAPI 응답 반환
   └─> Service A로 JSON 전달
```

**핵심 원칙**:
- AI는 텍스트 생성만 담당 (데이터 조회 X)
- Service A가 제공한 데이터를 프롬프트에 주입
- 규격화된 JSON 형식으로 응답 강제
- Prompt Chaining으로 일관성 있는 피드백 생성


### 4.2 워크플로우 2: 딥다이브 챗봇 (Bedrock Tool Use)

**개념**: Claude가 Bedrock Native Converse API의 Tool Use(Function Calling) 기능을 통해 자율적으로 MariaDB 조회 및 분석

**처리 흐름**:

```
1. FastAPI 엔드포인트 수신
   └─> POST /ai/chat/query
   └─> Request 데이터 검증 (Pydantic)

2. ChatbotService.process_query() 호출
   └─> Bedrock Tool Use 활성화

3. Tool 정의 (Bedrock Tool Spec)
   ├─> Tool 1: query_user_action_logs
   │   └─> 설명: "사용자의 할 일 처리 로그를 조회합니다"
   │   └─> 파라미터: user_id, start_date, end_date, action_type
   │
   ├─> Tool 2: calculate_completion_rate
   │   └─> 설명: "특정 기간의 완료율을 계산합니다"
   │   └─> 파라미터: user_id, period (week/month)
   │
   └─> Tool 3: analyze_postpone_pattern
       └─> 설명: "요일별 미룸 패턴을 분석합니다"
       └─> 파라미터: user_id, start_date, end_date

4. 첫 번째 Bedrock Converse API 호출 (Tool Use 활성화)
   ├─> 사용자 질의: "지난 주에 내가 가장 많이 미룬 요일은 언제야?"
   ├─> Claude가 질의 분석
   └─> Claude 응답: "query_user_action_logs 도구를 사용하겠습니다"
       └─> Tool Input: {
             "user_id": "USER123",
             "start_date": "2026-02-17",
             "end_date": "2026-02-23",
             "action_type": "POSTPONED"
           }

5. Tool 실행 (Python 코드)
   ├─> DatabaseClient.query_action_logs() 호출
   ├─> MariaDB 쿼리 실행:
   │   SELECT day_of_week, COUNT(*) as count
   │   FROM user_action_logs
   │   WHERE user_id = 'USER123'
   │     AND action_type = 'POSTPONED'
   │     AND action_time BETWEEN '2026-02-17' AND '2026-02-23'
   │     AND deleted_at IS NULL
   │   GROUP BY day_of_week
   │   ORDER BY count DESC
   │
   └─> 결과: [
         {"day_of_week": "SUNDAY", "count": 8},
         {"day_of_week": "SATURDAY", "count": 5},
         {"day_of_week": "FRIDAY", "count": 3}
       ]

6. Tool 결과를 Claude에 전달
   └─> toolResult 형식으로 전달

7. 두 번째 Bedrock Converse API 호출
   ├─> 이전 대화 컨텍스트 + Tool 실행 결과 포함
   ├─> Claude가 최종 답변 생성
   └─> 응답: "지난 주에 가장 많이 미룬 요일은 일요일이에요. 
              총 8개의 할 일을 미루셨네요. 
              주말에는 계획을 조금 줄여보는 것은 어떨까요?"

8. FastAPI 응답 반환
   └─> Service A로 자연어 답변 전달
```

**핵심 원칙**:
- Claude가 Bedrock Tool Use로 데이터 조회 시점과 방법을 자율적으로 결정
- 복잡한 질의도 여러 Tool을 조합하여 처리
- 실시간 데이터 조회로 최신 정보 제공
- 자연어 답변으로 사용자 친화적


## 5. 환경 변수 및 보안 전략

### 5.1 환경 변수 관리 (.env)

```env
# 서버 설정
PORT=8000
LOG_LEVEL=INFO
ENVIRONMENT=development

# AWS Bedrock 설정
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_MAX_TOKENS=2000
BEDROCK_TEMPERATURE=0.7

# MariaDB 설정 (MCP Tool Use용)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plainit_db
DB_USER=root
DB_PASSWORD=root
DB_POOL_SIZE=5

# Service A 연동 (향후 확장용)
SERVICE_A_BASE_URL=http://localhost:8080

# 타임아웃 설정
BEDROCK_TIMEOUT=30
DB_QUERY_TIMEOUT=10
```

### 5.2 AWS 자격 증명 전략

**AWS Default Credential Provider Chain 사용**:

boto3는 다음 순서로 자격 증명을 자동으로 찾습니다:

1. **환경 변수** (로컬 개발)
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_SESSION_TOKEN=...  # 임시 자격 증명 사용 시
   ```

2. **~/.aws/credentials 파일** (로컬 개발)
   ```ini
   [default]
   aws_access_key_id = AKIA...
   aws_secret_access_key = ...
   ```

3. **IAM Role** (프로덕션 - ECS/EKS)
   - 컨테이너에 IAM Role 자동 부여
   - 자격 증명 자동 갱신
   - 코드 변경 불필요

**구현 코드**:
```python
import boto3
from botocore.config import Config

def create_bedrock_client():
    """
    AWS Default Credential Provider Chain 사용
    코드에 자격 증명 하드코딩 절대 금지!
    """
    return boto3.client(
        'bedrock-runtime',
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        config=Config(
            connect_timeout=5,
            read_timeout=int(os.getenv('BEDROCK_TIMEOUT', 30)),
            retries={'max_attempts': 3, 'mode': 'adaptive'}
        )
    )
```

**보안 원칙**:
- ✅ 환경 변수 또는 IAM Role 사용
- ✅ .env 파일은 .gitignore에 추가
- ✅ .env.example 파일로 템플릿 제공
- ❌ 코드에 자격 증명 하드코딩 절대 금지
- ❌ Git에 자격 증명 커밋 금지


### 5.3 데이터베이스 접속 정보 보안

**Pydantic Settings를 활용한 환경 변수 관리**:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # 서버 설정
    port: int = 8000
    log_level: str = "INFO"
    environment: str = "development"
    
    # AWS Bedrock
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "anthropic.claude-sonnet-4-5-20250929-v1:0"
    bedrock_max_tokens: int = 2000
    bedrock_temperature: float = 0.7
    bedrock_timeout: int = 30
    
    # MariaDB
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = "plainit_db"
    db_user: str = "root"
    db_password: str = "root"
    db_pool_size: int = 5
    db_query_timeout: int = 10
    
    # Service A
    service_a_base_url: str = "http://localhost:8080"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """싱글톤 패턴으로 설정 객체 반환"""
    return Settings()
```

**사용 예시**:
```python
from app.config import get_settings

settings = get_settings()
db_connection = create_connection(
    host=settings.db_host,
    port=settings.db_port,
    user=settings.db_user,
    password=settings.db_password,
    database=settings.db_name
)
```

**장점**:
- 타입 안정성 (Pydantic 검증)
- 환경별 설정 분리 (.env.dev, .env.prod)
- 기본값 제공으로 로컬 개발 편의성
- 싱글톤 패턴으로 성능 최적화


## 6. 핵심 컴포넌트 설계

### 6.1 BedrockClient (AWS Bedrock 통신)

**책임**:
- Bedrock Converse API 호출
- 에러 처리 및 재시도 로직
- 타임아웃 관리

**주요 메서드**:
```python
class BedrockClient:
    def __init__(self):
        self.client = create_bedrock_client()
        self.model_id = get_settings().bedrock_model_id
    
    async def converse(
        self,
        messages: List[Dict],
        system_prompt: Optional[str] = None,
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict:
        """Bedrock Converse API 호출"""
        pass
    
    def _parse_response(self, response: Dict) -> Dict:
        """Bedrock 응답 파싱"""
        pass
    
    def _handle_error(self, error: Exception) -> None:
        """에러 처리 및 로깅"""
        pass
```

### 6.2 ReportGeneratorService (Context Injection)

**책임**:
- 4가지 피드백 생성 (Growth, Timeline, Pattern, Summary)
- Prompt Chaining 구현
- JSON 파싱 및 검증

**주요 메서드**:
```python
class ReportGeneratorService:
    def __init__(self, bedrock_client: BedrockClient):
        self.bedrock = bedrock_client
    
    async def generate_report(self, stats_data: Dict) -> Dict:
        """4단계 Prompt Chaining으로 리포트 생성"""
        pass
    
    async def _generate_growth_feedback(self, growth_data: Dict) -> Dict:
        """성장 피드백 생성"""
        pass
    
    async def _generate_timeline_feedback(self, timeline_data: Dict) -> Dict:
        """타임라인 피드백 생성"""
        pass
    
    async def _generate_pattern_feedback(self, pattern_data: Dict) -> Dict:
        """패턴 피드백 생성"""
        pass
    
    async def _generate_summary_feedback(
        self,
        growth: Dict,
        timeline: Dict,
        pattern: Dict,
        summary_data: Dict
    ) -> Dict:
        """종합 피드백 생성 (이전 3개 결과 참조)"""
        pass
```


### 6.3 ChatbotService (MCP Tool Use)

**책임**:
- Tool 정의 및 등록
- Claude의 Tool Use 요청 처리
- MariaDB 조회 실행
- 최종 답변 생성

**주요 메서드**:
```python
class ChatbotService:
    def __init__(
        self,
        bedrock_client: BedrockClient,
        db_client: DatabaseClient
    ):
        self.bedrock = bedrock_client
        self.db = db_client
        self.tools = self._define_tools()
    
    def _define_tools(self) -> List[Dict]:
        """Bedrock Tool Spec 정의"""
        pass
    
    async def process_query(self, user_id: str, query: str) -> str:
        """사용자 질의 처리 (MCP 워크플로우)"""
        pass
    
    async def _execute_tool(
        self,
        tool_name: str,
        tool_input: Dict,
        user_id: str
    ) -> Dict:
        """Tool 실행 및 결과 반환"""
        pass
    
    def _has_tool_use(self, response: Dict) -> bool:
        """Bedrock 응답에 Tool Use가 포함되어 있는지 확인"""
        pass
    
    def _extract_text(self, response: Dict) -> str:
        """Bedrock 응답에서 텍스트 추출"""
        pass
```

### 6.4 DatabaseClient (MariaDB 조회)

**책임**:
- MariaDB 연결 풀 관리
- MCP Tool에서 사용할 쿼리 실행
- 쿼리 타임아웃 처리

**주요 메서드**:
```python
class DatabaseClient:
    def __init__(self):
        self.pool = self._create_connection_pool()
    
    async def query_action_logs(
        self,
        user_id: str,
        start_date: str,
        end_date: str,
        action_type: Optional[str] = None
    ) -> List[Dict]:
        """Action Log 조회"""
        pass
    
    async def calculate_completion_rate(
        self,
        user_id: str,
        period: str  # 'week' or 'month'
    ) -> float:
        """완료율 계산"""
        pass
    
    async def analyze_postpone_pattern(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> Dict:
        """요일별 미룸 패턴 분석"""
        pass
    
    def _create_connection_pool(self):
        """연결 풀 생성"""
        pass
```


## 7. 에러 처리 전략

### 7.1 에러 코드 정의

```python
from enum import Enum

class AIErrorCode(str, Enum):
    # Bedrock 관련 에러
    AI5001 = "AI5001"  # Bedrock 호출 실패
    AI5002 = "AI5002"  # Bedrock 타임아웃
    AI5003 = "AI5003"  # Bedrock 응답 파싱 실패
    
    # 데이터베이스 관련 에러
    AI5011 = "AI5011"  # DB 연결 실패
    AI5012 = "AI5012"  # DB 쿼리 실패
    AI5013 = "AI5013"  # DB 타임아웃
    
    # 요청 검증 에러
    AI4001 = "AI4001"  # 잘못된 요청 형식
    AI4002 = "AI4002"  # 필수 파라미터 누락
    AI4003 = "AI4003"  # 유효하지 않은 파라미터 값

class AIException(Exception):
    def __init__(self, error_code: AIErrorCode, message: str):
        self.error_code = error_code
        self.message = message
        super().__init__(message)
```

### 7.2 전역 예외 핸들러

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from datetime import datetime

app = FastAPI()

@app.exception_handler(AIException)
async def ai_exception_handler(request: Request, exc: AIException):
    """커스텀 AI 예외 처리"""
    return JSONResponse(
        status_code=500,
        content={
            "code": exc.error_code.value,
            "message": exc.message,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """전역 예외 처리"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "code": "AI5001",
            "message": "AI 서비스 내부 오류가 발생했습니다",
            "timestamp": datetime.now().isoformat()
        }
    )
```

### 7.3 Bedrock 호출 실패 시 기본 템플릿

```python
DEFAULT_TEMPLATES = {
    "growth": {
        "message": "데이터를 분석 중입니다. 잠시 후 다시 확인해주세요."
    },
    "timeline": {
        "message": "타임라인 데이터를 준비 중입니다."
    },
    "pattern": {
        "message": "패턴 분석을 진행 중입니다."
    },
    "summary": {
        "message": "종합 리포트를 생성 중입니다."
    }
}

async def _generate_growth_feedback(self, growth_data: Dict) -> Dict:
    try:
        # Bedrock 호출
        response = await self.bedrock.converse(...)
        return self._parse_json(response)
    except Exception as e:
        logger.error(f"Growth feedback generation failed: {e}")
        # 기본 템플릿 반환
        return {
            "topicName": growth_data.get("topic_name", ""),
            "growthRate": growth_data.get("growth_rate", 0),
            "message": DEFAULT_TEMPLATES["growth"]["message"]
        }
```


## 8. 로깅 전략

### 8.1 구조화된 JSON 로깅

```python
import logging
from pythonjsonlogger import jsonlogger

def setup_logger():
    logger = logging.getLogger()
    handler = logging.StreamHandler()
    
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s',
        timestamp=True
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    return logger

logger = setup_logger()

# 사용 예시
logger.info(
    "Bedrock API 호출",
    extra={
        "endpoint": "/ai/reports/generate",
        "user_id": "USER123",
        "model_id": "claude-3-5-sonnet",
        "duration_ms": 1234
    }
)
```

### 8.2 주요 로깅 포인트

```python
# 1. API 요청 수신
logger.info(f"API 요청 수신: {endpoint}", extra={
    "user_id": user_id,
    "request_body": request_body
})

# 2. Bedrock 호출 시작
logger.info("Bedrock API 호출 시작", extra={
    "model_id": model_id,
    "prompt_length": len(prompt)
})

# 3. Bedrock 호출 완료
logger.info("Bedrock API 호출 완료", extra={
    "duration_ms": duration,
    "tokens_used": tokens
})

# 4. Tool 실행
logger.info("Tool 실행", extra={
    "tool_name": tool_name,
    "tool_input": tool_input
})

# 5. 에러 발생
logger.error("Bedrock 호출 실패", extra={
    "error_code": error_code,
    "error_message": str(error)
}, exc_info=True)
```


## 9. 테스트 전략

### 9.1 Unit Test (pytest)

```python
import pytest
from app.services.report_generator import ReportGeneratorService

@pytest.mark.asyncio
async def test_generate_growth_feedback_success(mock_bedrock_client):
    """성장 피드백 생성 성공 케이스"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    growth_data = {
        "topic_name": "운동",
        "growth_rate": 24,
        "previous_completion_rate": 65,
        "current_completion_rate": 89
    }
    
    # When
    result = await service._generate_growth_feedback(growth_data)
    
    # Then
    assert "topicName" in result
    assert "growthRate" in result
    assert "message" in result
    assert result["topicName"] == "운동"
    assert result["growthRate"] == 24

@pytest.mark.asyncio
async def test_generate_report_bedrock_failure_returns_default(mock_bedrock_client):
    """Bedrock 호출 실패 시 기본 템플릿 반환"""
    # Given
    mock_bedrock_client.converse.side_effect = Exception("Bedrock error")
    service = ReportGeneratorService(mock_bedrock_client)
    
    # When
    result = await service.generate_report(valid_stats_data)
    
    # Then
    assert result["growth"]["message"] == DEFAULT_TEMPLATES["growth"]["message"]
```

### 9.2 Property-Based Test (Hypothesis)

```python
from hypothesis import given, strategies as st

@given(
    growth_rate=st.integers(min_value=-100, max_value=200),
    topic_name=st.text(min_size=1, max_size=50)
)
def test_growth_feedback_always_contains_required_fields(growth_rate, topic_name):
    """
    Property: 어떤 입력이든 Growth Feedback은 필수 필드를 포함해야 함
    """
    # Given
    growth_data = {"growth_rate": growth_rate, "topic_name": topic_name}
    
    # When
    feedback = generate_growth_feedback_sync(growth_data)
    
    # Then
    assert "topicName" in feedback
    assert "growthRate" in feedback
    assert "message" in feedback
    assert isinstance(feedback["message"], str)
    assert len(feedback["message"]) > 0
```

### 9.3 Integration Test

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_report_api_integration():
    """리포트 생성 API 통합 테스트"""
    # Given
    request_body = {
        "user_id": "USER123",
        "year_month": "2026-02",
        "week": 9,
        "stats_data": create_valid_stats_data()
    }
    
    # When
    response = client.post("/ai/reports/generate", json=request_body)
    
    # Then
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "report_data" in data
    assert "growth" in data["report_data"]
    assert "timeline" in data["report_data"]
    assert "pattern" in data["report_data"]
    assert "summary" in data["report_data"]
```


## 10. 배포 전략

### 10.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY ./app ./app

# 비root 사용자 생성
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 환경 변수
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# 애플리케이션 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 10.2 로컬 실행 가이드

```bash
# 1. 가상 환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (AWS 자격 증명, DB 정보 등)

# 4. 애플리케이션 실행
uvicorn app.main:app --reload --port 8000

# 5. API 문서 확인
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### 10.3 Docker 실행

```bash
# 이미지 빌드
docker build -t planit-ai-service:latest .

# 컨테이너 실행
docker run -d \
  --name planit-ai-service \
  -p 8000:8000 \
  -e AWS_REGION=us-east-1 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_NAME=plainit_db \
  -e DB_USER=root \
  -e DB_PASSWORD=root \
  planit-ai-service:latest

# 로그 확인
docker logs -f planit-ai-service
```


## 11. 성능 최적화 전략

### 11.1 비동기 처리

```python
# FastAPI의 async/await 활용
@app.post("/ai/reports/generate")
async def generate_report(request: ReportGenerationRequest):
    """비동기 처리로 I/O 대기 시간 최소화"""
    result = await report_service.generate_report(request.stats_data)
    return result

# 병렬 처리 (asyncio.gather)
async def generate_report(self, stats_data: Dict) -> Dict:
    """4가지 피드백을 병렬로 생성"""
    growth_task = self._generate_growth_feedback(stats_data['growth'])
    timeline_task = self._generate_timeline_feedback(stats_data['timeline'])
    pattern_task = self._generate_pattern_feedback(stats_data['pattern'])
    
    # 병렬 실행
    growth, timeline, pattern = await asyncio.gather(
        growth_task,
        timeline_task,
        pattern_task
    )
    
    # Summary는 이전 결과를 참조하므로 순차 실행
    summary = await self._generate_summary_feedback(
        growth, timeline, pattern, stats_data['summary']
    )
    
    return {
        "growth": growth,
        "timeline": timeline,
        "pattern": pattern,
        "summary": summary
    }
```

### 11.2 연결 풀 관리

```python
# MariaDB 연결 풀
import aiomysql

class DatabaseClient:
    def __init__(self):
        self.pool = None
    
    async def initialize(self):
        """애플리케이션 시작 시 연결 풀 생성"""
        self.pool = await aiomysql.create_pool(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password,
            db=settings.db_name,
            minsize=1,
            maxsize=settings.db_pool_size,
            autocommit=True
        )
    
    async def query(self, sql: str, params: tuple = None):
        """연결 풀에서 연결을 가져와 쿼리 실행"""
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(sql, params)
                return await cursor.fetchall()
```

### 11.3 타임아웃 설정

```python
# Bedrock 호출 타임아웃
from botocore.config import Config

bedrock_client = boto3.client(
    'bedrock-runtime',
    config=Config(
        connect_timeout=5,
        read_timeout=30,
        retries={'max_attempts': 3, 'mode': 'adaptive'}
    )
)

# FastAPI 요청 타임아웃
from fastapi import Request
import asyncio

@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=60.0)
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={"code": "AI5002", "message": "요청 처리 시간 초과"}
        )
```


## 12. 구현 순서 및 마일스톤

### Phase 1: 기본 인프라 구축 (1-2일)

1. **프로젝트 초기 설정**
   - 디렉토리 구조 생성
   - requirements.txt 작성
   - .env.example 작성
   - .gitignore 설정

2. **FastAPI 애플리케이션 뼈대**
   - main.py 생성 (기본 라우터)
   - config.py 구현 (Pydantic Settings)
   - 헬스체크 엔드포인트 추가

3. **Pydantic 모델 정의**
   - request.py (ReportGenerationRequest, ChatQueryRequest)
   - response.py (ReportGenerationResponse, ChatQueryResponse)

4. **에러 처리 및 로깅**
   - errors.py (AIErrorCode, AIException)
   - logger.py (구조화된 JSON 로깅)
   - 전역 예외 핸들러 등록

### Phase 2: Context Injection 구현 (2-3일)

5. **BedrockClient 구현**
   - AWS SDK 초기화
   - converse() 메서드 구현
   - 에러 처리 및 재시도 로직

6. **ReportGeneratorService 구현**
   - _generate_growth_feedback()
   - _generate_timeline_feedback()
   - _generate_pattern_feedback()
   - _generate_summary_feedback()
   - Prompt Chaining 로직

7. **리포트 생성 API 구현**
   - POST /ai/reports/generate 엔드포인트
   - 요청 검증
   - 응답 포맷팅 (camelCase)

8. **Unit Test 작성**
   - ReportGeneratorService 테스트
   - BedrockClient Mock 테스트

### Phase 3: Bedrock Tool Use 구현 (2-3일)

9. **DatabaseClient 구현**
   - 연결 풀 생성
   - query_action_logs()
   - calculate_completion_rate()
   - analyze_postpone_pattern()

10. **ChatbotService 구현**
    - Tool 정의 (_define_tools)
    - process_query() (Bedrock Tool Use 워크플로우)
    - _execute_tool()
    - Tool Use 응답 파싱

11. **챗봇 API 구현**
    - POST /ai/chat/query 엔드포인트
    - 요청 검증
    - 자연어 응답 반환

12. **Unit Test 작성**
    - ChatbotService 테스트
    - DatabaseClient 테스트

### Phase 4: 통합 테스트 및 최적화 (1-2일)

13. **Integration Test**
    - Service A ↔ Service B 통합 테스트
    - Bedrock 실제 호출 테스트 (선택)

14. **성능 최적화**
    - 비동기 처리 검증
    - 타임아웃 설정 조정
    - 연결 풀 크기 최적화

15. **문서화**
    - README.md 작성
    - API 문서 (Swagger) 정리
    - 환경 변수 가이드

16. **Docker 이미지 빌드**
    - Dockerfile 작성
    - 로컬 테스트
    - 이미지 최적화

### 검증 체크리스트

- [ ] FastAPI 애플리케이션이 정상적으로 시작되는가?
- [ ] Swagger UI에서 API 문서를 확인할 수 있는가?
- [ ] POST /ai/reports/generate가 정상 응답을 반환하는가?
- [ ] Bedrock 호출이 성공하고 JSON 파싱이 정상 동작하는가?
- [ ] camelCase 응답 포맷이 올바르게 적용되는가?
- [ ] POST /ai/chat/query가 Tool Use를 통해 DB를 조회하는가?
- [ ] 에러 발생 시 기본 템플릿이 반환되는가?
- [ ] 모든 Unit Test가 통과하는가?
- [ ] Docker 컨테이너가 정상적으로 실행되는가?
- [ ] Service A와 통합 테스트가 성공하는가?


## 13. 아키텍처 원칙 준수 확인

### 13.1 폴리글랏 MSA 원칙

✅ **Service A (Java)**: 트랜잭션 안정성이 중요한 코어 비즈니스 로직
- MariaDB 데이터 조회 및 집계
- DynamoDB 캐싱
- 배치 스케줄러

✅ **Service B (Python)**: 최신 AI 기능 및 유연한 데이터 처리
- AWS Bedrock 통합
- 자연어 처리
- 동적 Tool Use

### 13.2 캐싱 아키텍처 원칙

✅ **GET API는 DynamoDB만 조회** (Service A)
- 실시간 연산 없음
- 0.01초 이내 응답
- Dumb Pipe 역할

✅ **Write 시점에 데이터 변환** (Service B)
- camelCase 변환은 리포트 생성 시 1회만
- DynamoDB에 저장된 데이터는 완제품
- Read 성능 보장

### 13.3 Context Injection vs Bedrock Tool Use 분리

✅ **Context Injection (배치 리포트)**
- Service A가 데이터 조회
- Service B는 텍스트 생성만
- 규격화된 JSON 응답
- 예측 가능한 성능

✅ **Bedrock Tool Use (챗봇)**
- Claude가 자율적으로 데이터 조회
- 유연한 질의 처리
- 자연어 답변
- 심층 분석 가능

### 13.4 보안 원칙

✅ **자격 증명 관리**
- AWS Default Credential Provider Chain 사용
- 코드에 하드코딩 금지
- 환경 변수 또는 IAM Role

✅ **데이터 접근 제어**
- user_id 기반 필터링
- SQL Injection 방지 (파라미터 바인딩)
- 민감 정보 로깅 금지

## 14. 승인 요청 사항

위 구현 계획이 다음 요구사항을 모두 충족하는지 검토 부탁드립니다:

1. ✅ **기술 스택**: boto3만 사용, langchain-aws 제외, AWS Bedrock Claude 3.5 Sonnet v2
2. ✅ **API 엔드포인트**: Context Injection용, MCP Tool Use용 2개 엔드포인트
3. ✅ **AI 워크플로우**: Prompt Chaining, Tool Use 상세 흐름 정의
4. ✅ **보안 전략**: AWS Default Credential Provider, Pydantic Settings, 환경 변수

추가 수정 사항이나 보완이 필요한 부분이 있으면 말씀해주세요.
승인해주시면 바로 코드 구현을 시작하겠습니다!
