"""
BedrockClient Unit Tests
"""
import pytest
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError
from app.clients.bedrock_client import BedrockClient


def test_bedrock_client_initialization():
    """BedrockClient 초기화 테스트"""
    # When
    client = BedrockClient()
    
    # Then
    assert client.client is not None
    assert client.model_id is not None


def test_extract_text_success():
    """텍스트 추출 성공 케이스"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": [
                    {"text": "Hello, World!"}
                ]
            }
        }
    }
    
    # When
    result = client.extract_text(response)
    
    # Then
    assert result == "Hello, World!"


def test_extract_text_empty_content():
    """빈 컨텐츠에서 텍스트 추출"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": []
            }
        }
    }
    
    # When
    result = client.extract_text(response)
    
    # Then
    assert result == ""


def test_extract_text_no_text_block():
    """텍스트 블록이 없는 경우"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": [
                    {"image": "base64data"}
                ]
            }
        }
    }
    
    # When
    result = client.extract_text(response)
    
    # Then
    assert result == ""


def test_has_tool_use_true():
    """Tool Use 포함 여부 확인 - True"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": [
                    {"toolUse": {"toolUseId": "123", "name": "query_db"}}
                ]
            }
        }
    }
    
    # When
    result = client.has_tool_use(response)
    
    # Then
    assert result is True


def test_has_tool_use_false():
    """Tool Use 포함 여부 확인 - False"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": [
                    {"text": "Hello"}
                ]
            }
        }
    }
    
    # When
    result = client.has_tool_use(response)
    
    # Then
    assert result is False


def test_extract_tool_use_success():
    """Tool Use 정보 추출 성공"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": [
                    {
                        "toolUse": {
                            "toolUseId": "tool-123",
                            "name": "query_action_logs",
                            "input": {"user_id": "USER123", "start_date": "2026-01-01"}
                        }
                    }
                ]
            }
        }
    }
    
    # When
    result = client.extract_tool_use(response)
    
    # Then
    assert result is not None
    assert result["toolUseId"] == "tool-123"
    assert result["name"] == "query_action_logs"
    assert result["input"]["user_id"] == "USER123"


def test_extract_tool_use_not_found():
    """Tool Use 정보가 없는 경우"""
    # Given
    client = BedrockClient()
    response = {
        "output": {
            "message": {
                "content": [
                    {"text": "Hello"}
                ]
            }
        }
    }
    
    # When
    result = client.extract_tool_use(response)
    
    # Then
    assert result is None


def test_parse_json_response_plain_json():
    """일반 JSON 파싱"""
    # Given
    client = BedrockClient()
    text = '{"name": "Claude", "version": "4.5"}'
    
    # When
    result = client.parse_json_response(text)
    
    # Then
    assert result["name"] == "Claude"
    assert result["version"] == "4.5"


def test_parse_json_response_with_json_block():
    """```json 블록 포함 JSON 파싱"""
    # Given
    client = BedrockClient()
    text = '''```json
{
  "name": "Claude",
  "version": "4.5"
}
```'''
    
    # When
    result = client.parse_json_response(text)
    
    # Then
    assert result["name"] == "Claude"
    assert result["version"] == "4.5"


def test_parse_json_response_with_code_block():
    """``` 블록 포함 JSON 파싱"""
    # Given
    client = BedrockClient()
    text = '''```
{
  "name": "Claude",
  "version": "4.5"
}
```'''
    
    # When
    result = client.parse_json_response(text)
    
    # Then
    assert result["name"] == "Claude"
    assert result["version"] == "4.5"


def test_parse_json_response_invalid_json():
    """잘못된 JSON 파싱 시 예외 발생"""
    # Given
    client = BedrockClient()
    text = '{"name": "Claude", invalid}'
    
    # When & Then
    with pytest.raises(Exception) as exc_info:
        client.parse_json_response(text)
    
    assert "JSON 파싱 실패" in str(exc_info.value)


@pytest.mark.asyncio
async def test_converse_success():
    """Bedrock Converse API 호출 성공"""
    # Given
    with patch('boto3.client') as mock_boto_client:
        mock_client_instance = MagicMock()
        mock_boto_client.return_value = mock_client_instance
        
        mock_client_instance.converse.return_value = {
            "output": {
                "message": {
                    "content": [{"text": "Hello"}]
                }
            },
            "stopReason": "end_turn"
        }
        
        client = BedrockClient()
        messages = [{"role": "user", "content": [{"text": "Hi"}]}]
        
        # When
        result = await client.converse(messages)
        
        # Then
        assert result["stopReason"] == "end_turn"
        mock_client_instance.converse.assert_called_once()


@pytest.mark.asyncio
async def test_converse_client_error():
    """Bedrock Converse API 호출 실패 (ClientError)"""
    # Given
    with patch('boto3.client') as mock_boto_client:
        mock_client_instance = MagicMock()
        mock_boto_client.return_value = mock_client_instance
        
        error_response = {
            'Error': {
                'Code': 'ValidationException',
                'Message': 'Invalid model ID'
            }
        }
        mock_client_instance.converse.side_effect = ClientError(error_response, 'converse')
        
        client = BedrockClient()
        messages = [{"role": "user", "content": [{"text": "Hi"}]}]
        
        # When & Then
        with pytest.raises(Exception) as exc_info:
            await client.converse(messages)
        
        assert "Bedrock API 호출 실패" in str(exc_info.value)
