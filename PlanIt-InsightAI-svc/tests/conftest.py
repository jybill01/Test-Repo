"""
pytest 설정 및 공통 fixture
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.clients.bedrock_client import BedrockClient


@pytest.fixture
def mock_bedrock_client():
    """Mock BedrockClient fixture"""
    client = MagicMock(spec=BedrockClient)
    client.converse = AsyncMock()
    client.extract_text = MagicMock()
    client.parse_json_response = MagicMock()
    return client


@pytest.fixture
def sample_growth_data():
    """샘플 성장 데이터"""
    return {
        "topic_name": "운동",
        "growth_rate": 24,
        "previous_completion_rate": 65,
        "current_completion_rate": 89
    }


@pytest.fixture
def sample_timeline_data():
    """샘플 타임라인 데이터"""
    return {
        "chart_data": [
            {"month": "2025-11", "completion_rate": 45},
            {"month": "2025-12", "completion_rate": 60},
            {"month": "2026-01", "completion_rate": 72},
            {"month": "2026-02", "completion_rate": 89}
        ]
    }


@pytest.fixture
def sample_pattern_data():
    """샘플 패턴 데이터"""
    return {
        "daily_stats": [
            {"day": "MONDAY", "total": 10, "completed": 8, "postponed": 2},
            {"day": "TUESDAY", "total": 12, "completed": 10, "postponed": 2},
            {"day": "WEDNESDAY", "total": 11, "completed": 9, "postponed": 2},
            {"day": "THURSDAY", "total": 13, "completed": 11, "postponed": 2},
            {"day": "FRIDAY", "total": 14, "completed": 12, "postponed": 2},
            {"day": "SATURDAY", "total": 12, "completed": 7, "postponed": 5},
            {"day": "SUNDAY", "total": 15, "completed": 7, "postponed": 8}
        ]
    }


@pytest.fixture
def sample_summary_data():
    """샘플 요약 데이터"""
    return {
        "total_tasks": 84,
        "completed_tasks": 67,
        "completion_rate": 79.8,
        "achievement_trend": "+12%"
    }


@pytest.fixture
def sample_stats_data(
    sample_growth_data,
    sample_timeline_data,
    sample_pattern_data,
    sample_summary_data
):
    """전체 통계 데이터"""
    return {
        "growth": sample_growth_data,
        "timeline": sample_timeline_data,
        "pattern": sample_pattern_data,
        "summary": sample_summary_data
    }
