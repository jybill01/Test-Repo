"""
Chatbot gRPC Servicer
기존 ChatbotService 로직을 gRPC Servicer에 연결
"""
import logging
from datetime import datetime

import grpc

# gRPC generated code import (proto 컴파일 후 생성됨)
from app.grpc_generated import chat_service_pb2
from app.grpc_generated import chat_service_pb2_grpc

# 기존 서비스 import
from app.services.chatbot import ChatbotService
from app.clients.bedrock_client import BedrockClient
from app.clients.database_client import DatabaseClient
# from app.core.config import settings
from app.core.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)


class ChatbotServicer(chat_service_pb2_grpc.ChatbotServiceServicer):
    """
    ChatbotService gRPC Servicer
    
    기존 ChatbotService의 query_chatbot() 로직을
    gRPC QueryChatbot() RPC 메서드에 연결
    """
    
    def __init__(self):
        """
        Servicer 초기화
        BedrockClient와 DatabaseClient를 주입하여 ChatbotService 생성
        """
        self.bedrock_client = BedrockClient()
        # DatabaseClient는 싱글톤으로 관리되므로 여기서는 None으로 초기화
        self.database_client = None
        logger.info("ChatbotServicer initialized")
    
    async def _get_database_client(self):
        """DatabaseClient 싱글톤 가져오기"""
        if self.database_client is None:
            from app.clients.database_client import get_database_client
            self.database_client = await get_database_client()
        return self.database_client
    
    async def QueryChatbot(
        self,
        request: chat_service_pb2.ChatRequest,
        context: grpc.aio.ServicerContext
    ) -> chat_service_pb2.ChatResponse:
        """
        챗봇 질의 처리 (Unary RPC)
        
        Args:
            request: ChatRequest (user_id, query)
            context: gRPC context
            
        Returns:
            ChatResponse (answer, sources, generated_at)
        """
        import time
        start_time = time.time()
        
        user_id = request.user_id
        query = request.query
        
        # 요청 로그 (시작)
        logger.info("=" * 80)
        logger.info(f"[gRPC REQUEST] QueryChatbot")
        logger.info(f"  User ID: {user_id}")
        logger.info(f"  Query: {query}")
        logger.info(f"  Peer: {context.peer()}")
        logger.info("=" * 80)
        
        try:
            # 유효성 검증
            if not user_id or not query:
                logger.warning(f"[gRPC VALIDATION ERROR] Missing required fields: user_id={bool(user_id)}, query={bool(query)}")
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("user_id and query are required")
                return chat_service_pb2.ChatResponse()
            
            # DatabaseClient 가져오기
            logger.info("[gRPC] Getting database client...")
            database_client = await self._get_database_client()
            
            # ChatbotService 생성 (매 요청마다 생성)
            logger.info("[gRPC] Creating ChatbotService instance...")
            chatbot_service = ChatbotService(
                bedrock_client=self.bedrock_client,
                db_client=database_client
            )
            
            # 기존 ChatbotService 호출
            logger.info("[gRPC] Calling ChatbotService.process_query()...")
            result = await chatbot_service.process_query(
                user_id=user_id,
                query=query
            )
            
            # gRPC Response 생성
            response = chat_service_pb2.ChatResponse(
                answer=result["answer"],
                sources=result["sources"],
                generated_at=result["generated_at"]
            )
            
            # 성공 로그
            elapsed_time = time.time() - start_time
            logger.info("=" * 80)
            logger.info(f"[gRPC RESPONSE] QueryChatbot SUCCESS")
            logger.info(f"  User ID: {user_id}")
            logger.info(f"  Answer Length: {len(result['answer'])} chars")
            logger.info(f"  Sources: {', '.join(result['sources'])}")
            logger.info(f"  Elapsed Time: {elapsed_time:.2f}s")
            logger.info("=" * 80)
            
            return response
            
        except ValueError as e:
            # 유효성 검증 에러
            elapsed_time = time.time() - start_time
            logger.error("=" * 80)
            logger.error(f"[gRPC ERROR] Validation Error")
            logger.error(f"  User ID: {user_id}")
            logger.error(f"  Error: {str(e)}")
            logger.error(f"  Elapsed Time: {elapsed_time:.2f}s")
            logger.error("=" * 80)
            
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(str(e))
            return chat_service_pb2.ChatResponse()
            
        except Exception as e:
            # 서버 에러
            elapsed_time = time.time() - start_time
            logger.error("=" * 80)
            logger.error(f"[gRPC ERROR] Internal Server Error")
            logger.error(f"  User ID: {user_id}")
            logger.error(f"  Error Type: {type(e).__name__}")
            logger.error(f"  Error Message: {str(e)}")
            logger.error(f"  Elapsed Time: {elapsed_time:.2f}s")
            logger.error("=" * 80, exc_info=True)
            
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal server error: {str(e)}")
            return chat_service_pb2.ChatResponse()
