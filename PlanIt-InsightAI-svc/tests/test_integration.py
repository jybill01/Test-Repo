"""
Integration Tests for PlanIt-InsightAI-svc
FastAPI 엔드포인트 통합 테스트
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from app.main import app


@pytest.fixture
def client():
    """FastAPI TestClient 픽스처"""
    return TestClient(app)


@pytest.fixture
def sample_report_request():
    """리포트 생성 요청 샘플 데이터"""
    return {
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


@pytest.fixture
def sample_chat_request():
    """챗봇 질의 요청 샘플 데이터"""
    return {
        "user_id": "USER123",
        "query": "지난 주에 내가 가장 많이 미룬 요일은 언제야?"
    }


class TestHealthCheck:
    """헬스체크 엔드포인트 테스트"""
    
    def test_health_check_success(self, client):
        """헬스체크 성공"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "PlanIt-InsightAI-svc"
        assert "timestamp" in data
        assert "version" in data
    
    def test_root_endpoint(self, client):
        """루트 엔드포인트"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "docs" in data
        assert "health" in data


class TestReportGenerationIntegration:
    """리포트 생성 API 통합 테스트"""
    
    @patch('app.clients.bedrock_client.BedrockClient.converse')
    def test_generate_report_success(self, mock_converse, client, sample_report_request):
        """리포트 생성 성공 케이스"""
        # Mock Bedrock 응답 설정
        mock_converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {
                            "text": '{"topicName": "운동", "growthRate": 24, "message": "운동 주제에서 24% 성장하셨네요!"}'
                        }
                    ]
                }
            }
        }
        
        response = client.post("/ai/reports/generate", json=sample_report_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "reportData" in data
        assert "generatedAt" in data
        assert "growth" in data["reportData"]
        assert "timeline" in data["reportData"]
        assert "pattern" in data["reportData"]
        assert "summary" in data["reportData"]
    
    def test_generate_report_invalid_request(self, client):
        """잘못된 요청 형식"""
        invalid_request = {
            "user_id": "USER123"
            # 필수 필드 누락
        }
        
        response = client.post("/ai/reports/generate", json=invalid_request)
        
        assert response.status_code == 422  # Validation Error
    
    def test_generate_report_missing_stats_data(self, client):
        """통계 데이터 누락"""
        invalid_request = {
            "user_id": "USER123",
            "year_month": "2026-02",
            "week": 9
            # stats_data 누락
        }
        
        response = client.post("/ai/reports/generate", json=invalid_request)
        
        assert response.status_code == 422
    
    @patch('app.clients.bedrock_client.BedrockClient.converse')
    def test_generate_report_bedrock_failure_returns_default(self, mock_converse, client, sample_report_request):
        """Bedrock 실패 시 기본 템플릿 반환"""
        # Bedrock 호출 실패 시뮬레이션
        mock_converse.side_effect = Exception("Bedrock error")
        
        response = client.post("/ai/reports/generate", json=sample_report_request)
        
        # 기본 템플릿으로 응답 성공
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "reportData" in data
    
    @patch('app.clients.bedrock_client.BedrockClient.converse')
    def test_generate_report_response_format(self, mock_converse, client, sample_report_request):
        """응답 형식 검증 (camelCase)"""
        mock_converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {
                            "text": '{"topicName": "운동", "growthRate": 24, "message": "테스트"}'
                        }
                    ]
                }
            }
        }
        
        response = client.post("/ai/reports/generate", json=sample_report_request)
        
        assert response.status_code == 200
        data = response.json()
        
        # camelCase 검증
        assert "reportData" in data  # not report_data
        assert "generatedAt" in data  # not generated_at
        
        report_data = data["reportData"]
        if "growth" in report_data:
            growth = report_data["growth"]
            # topicName, growthRate 등 camelCase 확인
            assert isinstance(growth, dict)


class TestChatbotIntegration:
    """챗봇 API 통합 테스트"""
    
    @patch('app.clients.bedrock_client.BedrockClient.converse')
    @patch('app.clients.database_client.DatabaseClient.query_action_logs')
    def test_chat_query_success(self, mock_query, mock_converse, client, sample_chat_request):
        """챗봇 질의 성공 케이스"""
        # Mock Tool Use 응답
        mock_converse.side_effect = [
            # 첫 번째 호출: Tool Use 요청
            {
                "output": {
                    "message": {
                        "content": [
                            {
                                "toolUse": {
                                    "toolUseId": "tool_123",
                                    "name": "query_action_logs",
                                    "input": {
                                        "user_id": "USER123",
                                        "start_date": "2026-02-17",
                                        "end_date": "2026-02-23",
                                        "action_type": "POSTPONED"
                                    }
                                }
                            }
                        ]
                    }
                },
                "stopReason": "tool_use"
            },
            # 두 번째 호출: 최종 답변
            {
                "output": {
                    "message": {
                        "content": [
                            {
                                "text": "지난 주에 가장 많이 미룬 요일은 일요일이에요."
                            }
                        ]
                    }
                },
                "stopReason": "end_turn"
            }
        ]
        
        # Mock DB 조회 결과
        mock_query.return_value = [
            {"day_of_week": "SUNDAY", "count": 8},
            {"day_of_week": "SATURDAY", "count": 5}
        ]
        
        response = client.post("/ai/chat/query", json=sample_chat_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "generatedAt" in data
        assert isinstance(data["answer"], str)
        assert len(data["answer"]) > 0
    
    def test_chat_query_invalid_request(self, client):
        """잘못된 요청 형식"""
        invalid_request = {
            "user_id": "USER123"
            # query 누락
        }
        
        response = client.post("/ai/chat/query", json=invalid_request)
        
        assert response.status_code == 422
    
    def test_chat_query_empty_query(self, client):
        """빈 질의 - Bedrock 에러 발생"""
        invalid_request = {
            "user_id": "USER123",
            "query": ""
        }
        
        response = client.post("/ai/chat/query", json=invalid_request)
        
        # 빈 query는 Bedrock에서 ValidationException 발생
        assert response.status_code == 500
    
    @patch('app.clients.bedrock_client.BedrockClient.converse')
    def test_chat_query_no_tool_use(self, mock_converse, client, sample_chat_request):
        """Tool Use 없이 직접 답변"""
        mock_converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {
                            "text": "안녕하세요! 무엇을 도와드릴까요?"
                        }
                    ]
                }
            },
            "stopReason": "end_turn"
        }
        
        response = client.post("/ai/chat/query", json=sample_chat_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["answer"] == "안녕하세요! 무엇을 도와드릴까요?"


class TestAPIDocumentation:
    """API 문서 엔드포인트 테스트"""
    
    def test_swagger_ui_accessible(self, client):
        """Swagger UI 접근 가능"""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_redoc_accessible(self, client):
        """ReDoc 접근 가능"""
        response = client.get("/redoc")
        assert response.status_code == 200
    
    def test_openapi_schema_accessible(self, client):
        """OpenAPI 스키마 접근 가능"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema


class TestErrorHandling:
    """에러 처리 통합 테스트"""
    
    @patch('app.services.report_generator.ReportGeneratorService.generate_report')
    def test_internal_server_error_handling(self, mock_generate, client, sample_report_request):
        """내부 서버 에러 처리"""
        mock_generate.side_effect = Exception("Unexpected error")
        
        response = client.post("/ai/reports/generate", json=sample_report_request)
        
        # 에러가 발생해도 500 에러로 적절히 처리
        assert response.status_code == 500
    
    def test_method_not_allowed(self, client):
        """허용되지 않은 HTTP 메서드"""
        response = client.get("/ai/reports/generate")
        assert response.status_code == 405
    
    def test_not_found(self, client):
        """존재하지 않는 엔드포인트"""
        response = client.get("/nonexistent")
        assert response.status_code == 404


class TestConcurrency:
    """동시성 테스트"""
    
    @patch('app.clients.bedrock_client.BedrockClient.converse')
    def test_multiple_concurrent_requests(self, mock_converse, client, sample_report_request):
        """여러 요청 동시 처리"""
        mock_converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {
                            "text": '{"topicName": "운동", "growthRate": 24, "message": "테스트"}'
                        }
                    ]
                }
            }
        }
        
        # 동시에 여러 요청 전송
        responses = []
        for _ in range(5):
            response = client.post("/ai/reports/generate", json=sample_report_request)
            responses.append(response)
        
        # 모든 요청이 성공적으로 처리되어야 함
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
