"""
PlanIt-InsightAI-svc FastAPI 애플리케이션 진입점
AWS Bedrock Claude Sonnet 4.5를 활용한 AI 리포트 생성 및 챗봇 서비스
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

from app.core.config import get_settings
from app.api import reports, chatbot
from app.clients.database_client import get_database_client

# 설정 로드
settings = get_settings()

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # Startup
    logger.info(f"Starting PlanIt-InsightAI-svc on port {settings.port}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"AWS Region: {settings.aws_region}")
    logger.info(f"Bedrock Model: {settings.bedrock_model_id}")
    
    # 데이터베이스 연결 풀 초기화
    try:
        await get_database_client()
        logger.info("Database connection pool initialized")
    except Exception as e:
        logger.warning(f"Database initialization failed (will retry on first use): {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down PlanIt-InsightAI-svc")
    
    # 데이터베이스 연결 풀 종료
    try:
        db_client = await get_database_client()
        await db_client.close()
        logger.info("Database connection pool closed")
    except Exception as e:
        logger.error(f"Error closing database connection: {e}")


# FastAPI 애플리케이션 생성
app = FastAPI(
    title="PlanIt InsightAI Service",
    description="AI-powered report generation and chatbot service using AWS Bedrock Claude Sonnet 4.5",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 라우터 등록
app.include_router(reports.router)
app.include_router(chatbot.router)


@app.get("/health")
async def health_check():
    """
    헬스체크 엔드포인트
    컨테이너 오케스트레이션 및 로드밸런서에서 사용
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "PlanIt-InsightAI-svc",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "environment": settings.environment
        }
    )


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Welcome to PlanIt InsightAI Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True if settings.environment == "development" else False
    )
