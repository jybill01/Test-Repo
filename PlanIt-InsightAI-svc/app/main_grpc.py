"""
gRPC Server Entry Point (Unified)
Chatbot + Report 서비스를 하나의 포트(9095)에서 제공
gRPC Multiplexing 활용

Usage:
    python -m app.main_grpc
"""

import sys
import os
# 생성된 gRPC 폴더를 파이썬 경로에 강제로 추가해서 Import 에러 방지
sys.path.append(os.path.join(os.path.dirname(__file__), 'grpc_generated'))

import asyncio
import logging
from concurrent import futures

import grpc
from grpc_reflection.v1alpha import reflection

# Chatbot gRPC
from app.grpc_generated import chat_service_pb2
from app.grpc_generated import chat_service_pb2_grpc
from app.grpc_server.chatbot_servicer import ChatbotServicer

# Report gRPC
from proto import report_service_pb2
from proto import report_service_pb2_grpc
from app.grpc_server.report_servicer import ReportServiceServicer

# Database lifecycle
from app.clients.database_client import DatabaseClient
from app.core.config import get_settings

# Get settings
settings = get_settings()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def serve():
    """
    통합 gRPC 서버 실행 (Chatbot + Report)
    
    - Port: 9095 (단일 포트)
    - Services: ChatbotService, ReportService
    - Max Workers: 10
    - Reflection: Enabled (grpcurl 테스트용)
    """
    # Database 클라이언트 초기화 (먼저 수행)
    db_client = None
    try:
        from app.clients.database_client import get_database_client
        db_client = await get_database_client()
        logger.info("Database connection pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise
    
    # gRPC 서버 생성
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ('grpc.max_send_message_length', 50 * 1024 * 1024),  # 50MB
            ('grpc.max_receive_message_length', 50 * 1024 * 1024),  # 50MB
        ]
    )
    
    # Chatbot Servicer 등록
    chatbot_servicer = ChatbotServicer()
    chat_service_pb2_grpc.add_ChatbotServiceServicer_to_server(
        chatbot_servicer, server
    )
    logger.info("ChatbotService registered")
    
    # Report Servicer 등록
    report_servicer = ReportServiceServicer()
    report_service_pb2_grpc.add_ReportServiceServicer_to_server(
        report_servicer, server
    )
    logger.info("ReportService registered")
    
    # Reflection 등록 (grpcurl 테스트용)
    SERVICE_NAMES = (
        chat_service_pb2.DESCRIPTOR.services_by_name['ChatbotService'].full_name,
        report_service_pb2.DESCRIPTOR.services_by_name['ReportService'].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)
    
    # 서버 시작 (단일 포트 9095)
    listen_addr = f'[::]:{settings.grpc_port}'
    server.add_insecure_port(listen_addr)
    
    logger.info("=" * 60)
    logger.info(f"Starting unified gRPC server on {listen_addr}")
    logger.info("Services available:")
    logger.info("  1. ChatbotService (chat.ChatbotService)")
    logger.info("  2. ReportService (report.ReportService)")
    logger.info(f"AWS Region: {settings.aws_region}")
    logger.info(f"Bedrock Model: {settings.bedrock_model_id}")
    logger.info(f"Database: {settings.db_host}:{settings.db_port}/{settings.db_name}")
    logger.info("=" * 60)
    
    await server.start()
    logger.info("✓ Unified gRPC server started successfully")
    logger.info(f"✓ Listening on port {settings.grpc_port}")
    
    try:
        await server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Shutting down unified gRPC server...")
        await server.stop(grace=5)
        if db_client:
            await db_client.close()
        logger.info("Unified gRPC server stopped")


if __name__ == '__main__':
    asyncio.run(serve())
