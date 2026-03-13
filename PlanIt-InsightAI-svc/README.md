# PlanIt-InsightAI-svc

AWS Bedrock(Claude)을 활용한 AI 리포트 생성 및 챗봇 서비스입니다.  
Python FastAPI + gRPC 서버로 동작하며, Insight-svc(Java)로부터 요청을 받아 AI 분석 결과를 반환합니다.

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| 역할 | AI 리포트 생성, AI 챗봇 (Bedrock Claude 호출) |
| HTTP 포트 | **8085** |
| gRPC 포트 | **9095** |
| 외부 의존 | AWS Bedrock, MariaDB (챗봇 Tool Use용) |

> **중요**: HTTP 서버와 gRPC 서버를 **별도 프로세스로** 각각 실행해야 합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 / 프레임워크 | Python 3.11+, FastAPI 0.115 |
| ASGI 서버 | Uvicorn |
| AI | AWS Bedrock (Claude Sonnet 4.5) |
| RPC | gRPC (grpcio 1.78) |
| DB | aiomysql (비동기 MariaDB, 챗봇 Tool Use용) |
| 설정 관리 | pydantic-settings, python-dotenv |

---

## 주요 기능

- **리포트 생성**: Insight-svc가 조회한 통계 데이터 수신 → Prompt Chaining으로 성장/타임라인/패턴/요약 피드백 생성
- **챗봇**: 사용자 자연어 질의 수신 → Claude Tool Use로 MariaDB 자율 조회 → 심층 분석 응답

---

## 실행 전 필요 조건

1. Python 3.11 이상
2. AWS Bedrock 접근 권한 (Claude 모델 활성화 필요, **리전: us-east-1**)
3. MariaDB 실행 중 (챗봇 Tool Use용, `planit_schedule_db` 조회)
4. `.env` 파일 설정

---

## 환경 변수 설정

루트에 `.env` 파일 생성:

```env
# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-5-20250929-v1:0

# MariaDB (챗봇 Tool Use)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=planit_schedule_db
DB_USER=root
DB_PASSWORD=root

# 포트
PORT=8085
GRPC_PORT=9095

# Insight-svc 주소 (챗봇 콜백용)
SERVICE_A_BASE_URL=http://localhost:8084
```

---

## 설치 및 실행 방법

```bash
# 1. 의존성 설치
pip install -r requirements.txt

# 2-A. HTTP 서버 실행 (포트 8085)
uvicorn app.main:app --host 0.0.0.0 --port 8085 --reload

# 2-B. gRPC 서버 실행 (포트 9095) — 별도 터미널에서 실행
python -m app.main_grpc
```

---

## Proto 재컴파일 (proto 파일 변경 시)

```bash
./compile_proto.sh
```

---

## 테스트 실행

```bash
pytest tests/ -v
```

---

## 프로젝트 구조

```
app/
├── api/
│   ├── reports.py       # HTTP: 리포트 생성 API
│   └── chatbot.py       # HTTP: 챗봇 API
├── clients/
│   ├── bedrock_client.py    # AWS Bedrock 클라이언트
│   └── database_client.py   # MariaDB 클라이언트 (Tool Use)
├── core/
│   └── config.py        # 환경 변수 설정
├── grpc_server/         # gRPC 서버 구현
├── services/
│   ├── report_generator.py  # 리포트 생성 서비스
│   └── chatbot_service.py   # 챗봇 서비스
├── main.py              # FastAPI HTTP 서버 진입점
└── main_grpc.py         # gRPC 서버 진입점
proto/
├── chat_service.proto   # 챗봇 gRPC 스펙
└── report_service.proto # 리포트 gRPC 스펙
```

2. **챗봇 (Bedrock Tool Use)**
   - 사용자의 자연어 질의를 받아 Claude가 자율적으로 데이터 조회
   - MariaDB 실시간 조회를 통한 심층 분석
   - 복잡한 질문도 여러 Tool을 조합하여 처리

## 🛠 기술 스택

- **FastAPI 0.115.0**: 고성능 비동기 웹 프레임워크
- **AWS Bedrock**: Claude Sonnet 4.5 모델 (anthropic.claude-3-sonnet-20240229-v1:0)
- **boto3 1.35.0**: AWS SDK for Python
- **aiomysql 0.2.0**: 비동기 MariaDB 연결
- **Pydantic 2.9.0**: 데이터 검증 및 직렬화
- **pytest 8.3.0**: 테스트 프레임워크

## 📁 프로젝트 구조

```
PlanIt-InsightAI-svc/
├── app/
│   ├── api/                    # API 엔드포인트
│   │   ├── reports.py          # 리포트 생성 API
│   │   └── chatbot.py          # 챗봇 API
│   ├── clients/                # 외부 서비스 클라이언트
│   │   ├── bedrock_client.py   # AWS Bedrock 클라이언트
│   │   └── database_client.py  # MariaDB 클라이언트
│   ├── core/                   # 핵심 설정
│   │   └── config.py           # 환경 변수 설정
│   ├── models/                 # Pydantic 모델
│   │   ├── request.py          # 요청 모델
│   │   └── response.py         # 응답 모델
│   ├── services/               # 비즈니스 로직
│   │   ├── report_generator.py # 리포트 생성 서비스
│   │   └── chatbot.py          # 챗봇 서비스
│   └── main.py                 # FastAPI 애플리케이션 진입점
├── tests/                      # 테스트 코드 (63개 테스트)
│   ├── conftest.py
│   ├── test_bedrock_client.py
│   ├── test_chatbot_service.py
│   ├── test_database_client.py
│   ├── test_integration.py
│   └── test_report_generator.py
├── .env.example                # 환경 변수 예시
├── Dockerfile                  # Docker 이미지 빌드
├── requirements.txt            # Python 의존성
└── README.md
```

## 🚀 시작하기

### 1. 환경 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일 편집 (AWS 자격 증명, DB 정보 등)
```

### 2. AWS 자격 증명 설정

다음 중 하나의 방법으로 AWS 자격 증명을 설정하세요:

**방법 1: 환경 변수 (.env 파일)**
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

**방법 2: AWS CLI 설정**
```bash
aws configure
```

**방법 3: IAM Role (프로덕션 - ECS/EKS)**
- 컨테이너에 IAM Role 자동 부여
- 자격 증명 자동 갱신

### 3. 로컬 실행

```bash
# 가상 환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn app.main:app --reload --port 8085
```

### 4. API 문서 확인

- Swagger UI: http://localhost:8085/docs
- ReDoc: http://localhost:8085/redoc
- Health Check: http://localhost:8085/health

## 🐳 Docker 실행

### 이미지 빌드

```bash
docker build -t planit-insightai-svc:latest .
```

### 컨테이너 실행

```bash
docker run -d \
  --name planit-insightai-svc \
  -p 8085:8085 \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=AKIA... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_NAME=plainit_db \
  -e DB_USER=root \
  -e DB_PASSWORD=root \
  planit-insightai-svc:latest
```

### 로그 확인

```bash
docker logs -f planit-insightai-svc
```

## 🧪 테스트

### 전체 테스트 실행

```bash
pytest tests/ -v
```

### 특정 테스트 실행

```bash
# Unit Tests
pytest tests/test_bedrock_client.py -v
pytest tests/test_report_generator.py -v
pytest tests/test_chatbot_service.py -v
pytest tests/test_database_client.py -v

# Integration Tests
pytest tests/test_integration.py -v
```

### 테스트 커버리지

```bash
pytest tests/ --cov=app --cov-report=html
```

## 📡 API 엔드포인트

### 1. 리포트 생성 (Context Injection)

**POST** `/ai/reports/generate`

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
    "timeline": { ... },
    "pattern": { ... },
    "summary": { ... }
  }
}
```

**Response:**
```json
{
  "success": true,
  "reportData": {
    "growth": {
      "topicName": "운동",
      "growthRate": 24,
      "message": "운동 주제에서 24% 성장하셨네요!"
    },
    "timeline": { ... },
    "pattern": { ... },
    "summary": { ... }
  },
  "generatedAt": "2026-03-04T16:30:00Z"
}
```

### 2. 챗봇 질의 (Bedrock Tool Use)

**POST** `/ai/chat/query`

```json
{
  "user_id": "USER123",
  "query": "지난 주에 내가 가장 많이 미룬 요일은 언제야?"
}
```

**Response:**
```json
{
  "answer": "지난 주에 가장 많이 미룬 요일은 일요일이에요. 총 8개의 할 일을 미루셨네요.",
  "generatedAt": "2026-03-04T16:35:00Z"
}
```

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | 8085 |
| `LOG_LEVEL` | 로그 레벨 | INFO |
| `ENVIRONMENT` | 환경 (development/production) | development |
| `AWS_REGION` | AWS 리전 | us-east-1 |
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID | anthropic.claude-3-sonnet-20240229-v1:0 |
| `BEDROCK_MAX_TOKENS` | 최대 토큰 수 | 2000 |
| `BEDROCK_TEMPERATURE` | Temperature | 0.7 |
| `BEDROCK_TIMEOUT` | Bedrock 타임아웃 (초) | 30 |
| `DB_HOST` | MariaDB 호스트 | localhost |
| `DB_PORT` | MariaDB 포트 | 3306 |
| `DB_NAME` | 데이터베이스 이름 | plainit_db |
| `DB_USER` | 데이터베이스 사용자 | root |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | root |
| `DB_POOL_SIZE` | 연결 풀 크기 | 5 |

## 📊 테스트 현황

- **총 테스트**: 63개
- **Unit Tests**: 45개
  - BedrockClient: 14개
  - ReportGenerator: 7개
  - ChatbotService: 11개
  - DatabaseClient: 13개
- **Integration Tests**: 18개
  - Health Check: 2개
  - Report Generation: 5개
  - Chatbot: 4개
  - API Documentation: 3개
  - Error Handling: 3개
  - Concurrency: 1개

## 🏗 아키텍처 원칙

### Context Injection (리포트 생성)
- Service A(Java)가 데이터 조회
- Service B(Python)는 텍스트 생성만 담당
- 규격화된 JSON 형식으로 응답
- 예측 가능한 성능

### Bedrock Tool Use (챗봇)
- Claude가 자율적으로 데이터 조회
- 유연한 질의 처리
- 자연어 답변
- 심층 분석 가능

## 🔒 보안

- AWS Default Credential Provider Chain 사용
- 코드에 자격 증명 하드코딩 금지
- 환경 변수 또는 IAM Role 사용
- 비root 사용자로 컨테이너 실행
- SQL Injection 방지 (파라미터 바인딩)

## 📝 라이센스

MIT License

## 👥 기여

이슈 및 PR은 언제나 환영합니다!
