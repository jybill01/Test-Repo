"""
챗봇 API 라우터

⚠️ DEPRECATED: 이 REST API는 더 이상 사용되지 않습니다.
프론트엔드는 Java BFF (Insight-svc)를 통해 챗봇 서비스를 이용해야 합니다.

[새로운 아키텍처]
FE → Insight-svc (Java BFF) → InsightAI-svc (Python gRPC)

[마이그레이션 가이드]
- 기존: POST http://$PLANIT_INSIGHT_AI_SERVICE_HOST:8085/ai/chat/query
- 신규: POST http://$PLANIT_INSIGHT_SERVICE_HOST:8084/api/v1/insight/chat/query

이 엔드포인트는 하위 호환성을 위해 유지되지만,
향후 버전에서 제거될 예정입니다.

@deprecated 2026-03-08
"""
import logging
from fastapi import APIRouter, HTTPException

from app.models.request import ChatQueryRequest
from app.models.response import ChatQueryResponse
from app.clients.bedrock_client import BedrockClient
from app.clients.database_client import get_database_client
from app.services.chatbot import ChatbotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/chat", tags=["Chatbot (Deprecated)"])

# 싱글톤 인스턴스
bedrock_client = BedrockClient()
chatbot_service = None


async def get_chatbot_service():
    """ChatbotService 싱글톤 반환"""
    global chatbot_service
    if chatbot_service is None:
        db_client = await get_database_client()
        chatbot_service = ChatbotService(bedrock_client, db_client)
    return chatbot_service


@router.post("/query", response_model=ChatQueryResponse, deprecated=True)
async def query_chatbot(request: ChatQueryRequest):
    """
    챗봇 질의 API (DEPRECATED)
    
    ⚠️ 이 엔드포인트는 더 이상 사용되지 않습니다.
    Java BFF (Insight-svc)의 /api/v1/insight/chat/query를 사용하세요.
    
    [마이그레이션]
    - 기존: POST http://$PLANIT_INSIGHT_AI_SERVICE_HOST:8085/ai/chat/query
    - 신규: POST http://$PLANIT_INSIGHT_SERVICE_HOST:8084/api/v1/insight/chat/query
    
    @deprecated 2026-03-08
    """
    logger.warning("[DEPRECATED] Direct REST API call detected. "
                   "Please migrate to Java BFF: /api/v1/insight/chat/query")
    
    try:
        logger.info(f"Chatbot query requested: user={request.user_id}, query={request.query}")
        
        # ChatbotService 가져오기
        service = await get_chatbot_service()
        
        # 질의 처리
        result = await service.process_query(
            user_id=request.user_id,
            query=request.query
        )
        
        logger.info(f"Chatbot query completed: user={request.user_id}")
        
        return ChatQueryResponse(**result)
    
    except Exception as e:
        logger.error(f"Chatbot query failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"챗봇 질의 처리 중 오류가 발생했습니다: {str(e)}"
        )
