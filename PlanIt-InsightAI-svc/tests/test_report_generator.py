"""
ReportGeneratorService Unit Tests
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.report_generator import ReportGeneratorService, DEFAULT_TEMPLATES
from app.models.response import GrowthFeedback, TimelineFeedback, PatternFeedback, SummaryFeedback


@pytest.mark.asyncio
async def test_generate_growth_feedback_success(mock_bedrock_client, sample_growth_data):
    """성장 피드백 생성 성공 케이스"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    
    # Mock Bedrock 응답
    mock_bedrock_client.converse.return_value = {
        "output": {"message": {"content": [{"text": "mock response"}]}}
    }
    mock_bedrock_client.extract_text.return_value = '{"topicName": "운동", "growthRate": 24, "message": "훌륭해요!"}'
    mock_bedrock_client.parse_json_response.return_value = {
        "topicName": "운동",
        "growthRate": 24,
        "message": "훌륭해요!"
    }
    
    # When
    result = await service._generate_growth_feedback(sample_growth_data)
    
    # Then
    assert isinstance(result, GrowthFeedback)
    assert result.topic_name == "운동"
    assert result.growth_rate == 24
    assert result.message == "훌륭해요!"
    mock_bedrock_client.converse.assert_called_once()


@pytest.mark.asyncio
async def test_generate_growth_feedback_bedrock_failure(mock_bedrock_client, sample_growth_data):
    """Bedrock 호출 실패 시 기본 템플릿 반환"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    mock_bedrock_client.converse.side_effect = Exception("Bedrock error")
    
    # When
    result = await service._generate_growth_feedback(sample_growth_data)
    
    # Then
    assert isinstance(result, GrowthFeedback)
    assert result.topic_name == "운동"
    assert result.growth_rate == 24
    assert result.message == DEFAULT_TEMPLATES["growth"]["message"]


@pytest.mark.asyncio
async def test_generate_timeline_feedback_success(mock_bedrock_client, sample_timeline_data):
    """타임라인 피드백 생성 성공 케이스"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    
    mock_bedrock_client.converse.return_value = {
        "output": {"message": {"content": [{"text": "mock response"}]}}
    }
    mock_bedrock_client.extract_text.return_value = '{"chartData": [], "message": "꾸준히 상승 중!"}'
    mock_bedrock_client.parse_json_response.return_value = {
        "chartData": sample_timeline_data["chart_data"],
        "message": "꾸준히 상승 중!"
    }
    
    # When
    result = await service._generate_timeline_feedback(sample_timeline_data)
    
    # Then
    assert isinstance(result, TimelineFeedback)
    assert len(result.chart_data) == 4
    assert result.message == "꾸준히 상승 중!"


@pytest.mark.asyncio
async def test_generate_pattern_feedback_success(mock_bedrock_client, sample_pattern_data):
    """패턴 피드백 생성 성공 케이스"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    
    mock_bedrock_client.converse.return_value = {
        "output": {"message": {"content": [{"text": "mock response"}]}}
    }
    mock_bedrock_client.extract_text.return_value = '{"worstDay": "SUNDAY", "avgPostponeCount": 3.3, "chartData": [], "message": "일요일 주의!"}'
    mock_bedrock_client.parse_json_response.return_value = {
        "worstDay": "SUNDAY",
        "avgPostponeCount": 3.3,
        "chartData": sample_pattern_data["daily_stats"],
        "message": "일요일 주의!"
    }
    
    # When
    result = await service._generate_pattern_feedback(sample_pattern_data)
    
    # Then
    assert isinstance(result, PatternFeedback)
    assert result.worst_day == "SUNDAY"
    assert result.avg_postpone_count == 3.3
    assert len(result.chart_data) == 7
    assert result.message == "일요일 주의!"


@pytest.mark.asyncio
async def test_generate_summary_feedback_success(mock_bedrock_client, sample_summary_data):
    """종합 피드백 생성 성공 케이스"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    
    growth = GrowthFeedback(topic_name="운동", growth_rate=24, message="성장 중")
    timeline = TimelineFeedback(chart_data=[], message="상승 추세")
    pattern = PatternFeedback(worst_day="SUNDAY", avg_postpone_count=3.3, chart_data=[], message="일요일 주의")
    
    mock_bedrock_client.converse.return_value = {
        "output": {"message": {"content": [{"text": "mock response"}]}}
    }
    mock_bedrock_client.extract_text.return_value = '{"message": "전체적으로 훌륭합니다!"}'
    mock_bedrock_client.parse_json_response.return_value = {
        "message": "전체적으로 훌륭합니다!"
    }
    
    # When
    result = await service._generate_summary_feedback(growth, timeline, pattern, sample_summary_data)
    
    # Then
    assert isinstance(result, SummaryFeedback)
    assert result.message == "전체적으로 훌륭합니다!"


@pytest.mark.asyncio
async def test_generate_report_full_workflow(mock_bedrock_client, sample_stats_data):
    """전체 리포트 생성 워크플로우 테스트"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    
    # Mock 모든 Bedrock 호출
    mock_bedrock_client.converse.return_value = {
        "output": {"message": {"content": [{"text": "mock response"}]}}
    }
    
    # Growth 응답
    def mock_parse_side_effect(text):
        if "topicName" in text or call_count[0] == 0:
            call_count[0] += 1
            return {
                "topicName": "운동",
                "growthRate": 24,
                "message": "성장 중"
            }
        elif "chartData" in text or call_count[0] == 1:
            call_count[0] += 1
            return {
                "chartData": sample_stats_data["timeline"]["chart_data"],
                "message": "상승 추세"
            }
        elif "worstDay" in text or call_count[0] == 2:
            call_count[0] += 1
            return {
                "worstDay": "SUNDAY",
                "avgPostponeCount": 3.3,
                "chartData": sample_stats_data["pattern"]["daily_stats"],
                "message": "일요일 주의"
            }
        else:
            return {"message": "전체적으로 훌륭합니다!"}
    
    call_count = [0]
    mock_bedrock_client.extract_text.return_value = "mock text"
    mock_bedrock_client.parse_json_response.side_effect = mock_parse_side_effect
    
    # When
    result = await service.generate_report(sample_stats_data)
    
    # Then
    assert result.success is True
    assert result.report_data is not None
    assert result.report_data.growth.topic_name == "운동"
    assert result.report_data.timeline.message == "상승 추세"
    assert result.report_data.pattern.worst_day == "SUNDAY"
    assert result.report_data.summary.message == "전체적으로 훌륭합니다!"
    assert result.generated_at is not None


@pytest.mark.asyncio
async def test_generate_report_partial_failure(mock_bedrock_client, sample_stats_data):
    """일부 피드백 생성 실패 시에도 기본 템플릿으로 완료"""
    # Given
    service = ReportGeneratorService(mock_bedrock_client)
    
    # Growth만 성공, 나머지는 실패
    call_count = [0]
    
    async def mock_converse_side_effect(*args, **kwargs):
        if call_count[0] == 0:
            call_count[0] += 1
            return {"output": {"message": {"content": [{"text": "success"}]}}}
        else:
            raise Exception("Bedrock error")
    
    mock_bedrock_client.converse.side_effect = mock_converse_side_effect
    mock_bedrock_client.extract_text.return_value = "mock text"
    mock_bedrock_client.parse_json_response.return_value = {
        "topicName": "운동",
        "growthRate": 24,
        "message": "성장 중"
    }
    
    # When
    result = await service.generate_report(sample_stats_data)
    
    # Then
    assert result.success is True
    assert result.report_data.growth.message == "성장 중"
    assert result.report_data.timeline.message == DEFAULT_TEMPLATES["timeline"]["message"]
    assert result.report_data.pattern.message == DEFAULT_TEMPLATES["pattern"]["message"]
    assert result.report_data.summary.message == DEFAULT_TEMPLATES["summary"]["message"]
