"""
ChatbotService Unit Tests
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from app.services.chatbot import ChatbotService
from app.clients.bedrock_client import BedrockClient
from app.clients.database_client import DatabaseClient


@pytest.fixture
def mock_db_client():
    """Mock DatabaseClient"""
    client = MagicMock(spec=DatabaseClient)
    client.query_action_logs = AsyncMock()
    client.calculate_completion_rate = AsyncMock()
    client.analyze_postpone_pattern = AsyncMock()
    client.get_recent_todos = AsyncMock()
    return client


@pytest.fixture
def chatbot_service(mock_bedrock_client, mock_db_client):
    """ChatbotService fixture"""
    return ChatbotService(mock_bedrock_client, mock_db_client)


def test_define_tools(chatbot_service):
    """Tool 정의 테스트"""
    # When
    tools = chatbot_service.tools
    
    # Then
    assert len(tools) == 4
    
    tool_names = [tool['toolSpec']['name'] for tool in tools]
    assert "query_user_action_logs" in tool_names
    assert "calculate_completion_rate" in tool_names
    assert "analyze_postpone_pattern" in tool_names
    assert "get_recent_todos" in tool_names
    
    # 첫 번째 Tool 상세 검증
    first_tool = tools[0]['toolSpec']
    assert first_tool['name'] == "query_user_action_logs"
    assert 'description' in first_tool
    assert 'inputSchema' in first_tool
    assert 'json' in first_tool['inputSchema']


@pytest.mark.asyncio
async def test_execute_tool_query_action_logs(chatbot_service, mock_db_client):
    """query_action_logs Tool 실행 테스트"""
    # Given
    mock_db_client.query_action_logs.return_value = [
        {"action_type": "COMPLETED", "count": 5}
    ]
    
    tool_input = {
        "start_date": "2026-01-01",
        "end_date": "2026-01-31",
        "action_type": "COMPLETED"
    }
    
    # When
    result = await chatbot_service._execute_tool(
        tool_name="query_user_action_logs",
        tool_input=tool_input,
        user_id="USER123"
    )
    
    # Then
    assert result["success"] is True
    assert result["count"] == 1
    assert len(result["data"]) == 1
    mock_db_client.query_action_logs.assert_called_once_with(
        user_id="USER123",
        start_date="2026-01-01",
        end_date="2026-01-31",
        action_type="COMPLETED"
    )


@pytest.mark.asyncio
async def test_execute_tool_calculate_completion_rate(chatbot_service, mock_db_client):
    """calculate_completion_rate Tool 실행 테스트"""
    # Given
    mock_db_client.calculate_completion_rate.return_value = 85.5
    
    tool_input = {"period": "week"}
    
    # When
    result = await chatbot_service._execute_tool(
        tool_name="calculate_completion_rate",
        tool_input=tool_input,
        user_id="USER123"
    )
    
    # Then
    assert result["success"] is True
    assert result["completion_rate"] == 85.5
    assert result["period"] == "week"
    mock_db_client.calculate_completion_rate.assert_called_once_with(
        user_id="USER123",
        period="week"
    )


@pytest.mark.asyncio
async def test_execute_tool_analyze_postpone_pattern(chatbot_service, mock_db_client):
    """analyze_postpone_pattern Tool 실행 테스트"""
    # Given
    mock_db_client.analyze_postpone_pattern.return_value = {
        "daily_stats": [
            {"day_of_week": "Sunday", "postpone_count": 8}
        ],
        "worst_day": "Sunday",
        "total_postponed": 8
    }
    
    tool_input = {
        "start_date": "2026-01-01",
        "end_date": "2026-01-31"
    }
    
    # When
    result = await chatbot_service._execute_tool(
        tool_name="analyze_postpone_pattern",
        tool_input=tool_input,
        user_id="USER123"
    )
    
    # Then
    assert result["success"] is True
    assert result["pattern"]["worst_day"] == "Sunday"
    assert result["pattern"]["total_postponed"] == 8
    mock_db_client.analyze_postpone_pattern.assert_called_once()


@pytest.mark.asyncio
async def test_execute_tool_get_recent_todos(chatbot_service, mock_db_client):
    """get_recent_todos Tool 실행 테스트"""
    # Given
    mock_db_client.get_recent_todos.return_value = [
        {"todo_id": "TODO1", "title": "운동하기"},
        {"todo_id": "TODO2", "title": "공부하기"}
    ]
    
    tool_input = {"limit": 10}
    
    # When
    result = await chatbot_service._execute_tool(
        tool_name="get_recent_todos",
        tool_input=tool_input,
        user_id="USER123"
    )
    
    # Then
    assert result["success"] is True
    assert result["count"] == 2
    assert len(result["todos"]) == 2
    mock_db_client.get_recent_todos.assert_called_once_with(
        user_id="USER123",
        limit=10
    )


@pytest.mark.asyncio
async def test_execute_tool_unknown_tool(chatbot_service):
    """알 수 없는 Tool 실행 시 에러"""
    # When
    result = await chatbot_service._execute_tool(
        tool_name="unknown_tool",
        tool_input={},
        user_id="USER123"
    )
    
    # Then
    assert result["success"] is False
    assert "알 수 없는 도구" in result["error"]


@pytest.mark.asyncio
async def test_execute_tool_database_error(chatbot_service, mock_db_client):
    """Tool 실행 중 데이터베이스 에러"""
    # Given
    mock_db_client.query_action_logs.side_effect = Exception("DB connection failed")
    
    tool_input = {
        "start_date": "2026-01-01",
        "end_date": "2026-01-31"
    }
    
    # When
    result = await chatbot_service._execute_tool(
        tool_name="query_user_action_logs",
        tool_input=tool_input,
        user_id="USER123"
    )
    
    # Then
    assert result["success"] is False
    assert "DB connection failed" in result["error"]


@pytest.mark.asyncio
async def test_process_query_no_tool_use(chatbot_service, mock_bedrock_client):
    """Tool Use 없이 직접 답변하는 경우"""
    # Given
    mock_bedrock_client.converse.return_value = {
        "output": {
            "message": {
                "content": [{"text": "안녕하세요! 무엇을 도와드릴까요?"}]
            }
        }
    }
    mock_bedrock_client.has_tool_use.return_value = False
    mock_bedrock_client.extract_text.return_value = "안녕하세요! 무엇을 도와드릴까요?"
    
    # When
    result = await chatbot_service.process_query(
        user_id="USER123",
        query="안녕하세요"
    )
    
    # Then
    assert "answer" in result
    assert result["answer"] == "안녕하세요! 무엇을 도와드릴까요?"
    assert result["sources"] == ["직접 답변"]
    assert "generated_at" in result
    mock_bedrock_client.converse.assert_called_once()


@pytest.mark.asyncio
async def test_process_query_with_tool_use(chatbot_service, mock_bedrock_client, mock_db_client):
    """Tool Use를 사용하는 경우"""
    # Given
    # 첫 번째 호출: Tool Use 요청
    first_response = {
        "output": {
            "message": {
                "content": [
                    {
                        "toolUse": {
                            "toolUseId": "tool-123",
                            "name": "calculate_completion_rate",
                            "input": {"period": "week"}
                        }
                    }
                ]
            }
        }
    }
    
    # 두 번째 호출: 최종 답변
    second_response = {
        "output": {
            "message": {
                "content": [{"text": "이번 주 완료율은 85.5%입니다."}]
            }
        }
    }
    
    mock_bedrock_client.converse.side_effect = [first_response, second_response]
    mock_bedrock_client.has_tool_use.side_effect = [True, False]
    mock_bedrock_client.extract_tool_use.return_value = {
        "toolUseId": "tool-123",
        "name": "calculate_completion_rate",
        "input": {"period": "week"}
    }
    mock_bedrock_client.extract_text.return_value = "이번 주 완료율은 85.5%입니다."
    
    mock_db_client.calculate_completion_rate.return_value = 85.5
    
    # When
    result = await chatbot_service.process_query(
        user_id="USER123",
        query="이번 주 완료율은?"
    )
    
    # Then
    assert result["answer"] == "이번 주 완료율은 85.5%입니다."
    assert "calculate_completion_rate 실행" in result["sources"]
    assert mock_bedrock_client.converse.call_count == 2
    mock_db_client.calculate_completion_rate.assert_called_once()


@pytest.mark.asyncio
async def test_process_query_max_iterations(chatbot_service, mock_bedrock_client):
    """최대 반복 횟수 초과"""
    # Given
    # 항상 Tool Use를 요청하도록 설정 (무한 루프 시뮬레이션)
    mock_bedrock_client.converse.return_value = {
        "output": {
            "message": {
                "content": [
                    {
                        "toolUse": {
                            "toolUseId": "tool-123",
                            "name": "query_user_action_logs",
                            "input": {"start_date": "2026-01-01", "end_date": "2026-01-31"}
                        }
                    }
                ]
            }
        }
    }
    mock_bedrock_client.has_tool_use.return_value = True
    mock_bedrock_client.extract_tool_use.return_value = {
        "toolUseId": "tool-123",
        "name": "query_user_action_logs",
        "input": {"start_date": "2026-01-01", "end_date": "2026-01-31"}
    }
    
    # When
    result = await chatbot_service.process_query(
        user_id="USER123",
        query="테스트 질의"
    )
    
    # Then
    assert "시간이 너무 오래 걸렸습니다" in result["answer"]
    assert mock_bedrock_client.converse.call_count == 5  # max_iterations


@pytest.mark.asyncio
async def test_process_query_multiple_tools(chatbot_service, mock_bedrock_client, mock_db_client):
    """여러 Tool을 순차적으로 사용하는 경우"""
    # Given
    responses = [
        # 첫 번째 Tool Use
        {
            "output": {
                "message": {
                    "content": [
                        {
                            "toolUse": {
                                "toolUseId": "tool-1",
                                "name": "query_user_action_logs",
                                "input": {"start_date": "2026-01-01", "end_date": "2026-01-31"}
                            }
                        }
                    ]
                }
            }
        },
        # 두 번째 Tool Use
        {
            "output": {
                "message": {
                    "content": [
                        {
                            "toolUse": {
                                "toolUseId": "tool-2",
                                "name": "analyze_postpone_pattern",
                                "input": {"start_date": "2026-01-01", "end_date": "2026-01-31"}
                            }
                        }
                    ]
                }
            }
        },
        # 최종 답변
        {
            "output": {
                "message": {
                    "content": [{"text": "분석 결과입니다."}]
                }
            }
        }
    ]
    
    mock_bedrock_client.converse.side_effect = responses
    mock_bedrock_client.has_tool_use.side_effect = [True, True, False]
    mock_bedrock_client.extract_tool_use.side_effect = [
        {
            "toolUseId": "tool-1",
            "name": "query_user_action_logs",
            "input": {"start_date": "2026-01-01", "end_date": "2026-01-31"}
        },
        {
            "toolUseId": "tool-2",
            "name": "analyze_postpone_pattern",
            "input": {"start_date": "2026-01-01", "end_date": "2026-01-31"}
        }
    ]
    mock_bedrock_client.extract_text.return_value = "분석 결과입니다."
    
    mock_db_client.query_action_logs.return_value = []
    mock_db_client.analyze_postpone_pattern.return_value = {
        "daily_stats": [],
        "worst_day": None,
        "total_postponed": 0
    }
    
    # When
    result = await chatbot_service.process_query(
        user_id="USER123",
        query="패턴 분석해줘"
    )
    
    # Then
    assert result["answer"] == "분석 결과입니다."
    assert len(result["sources"]) == 2
    assert "query_user_action_logs 실행" in result["sources"]
    assert "analyze_postpone_pattern 실행" in result["sources"]
    assert mock_bedrock_client.converse.call_count == 3
