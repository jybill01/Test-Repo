"""
DatabaseClient Unit Tests
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from app.clients.database_client import DatabaseClient


@pytest.fixture
def mock_pool():
    """Mock aiomysql connection pool"""
    pool = MagicMock()
    conn = MagicMock()
    cursor = MagicMock()
    
    # Setup async context managers
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=conn)
    pool.acquire.return_value.__aexit__ = AsyncMock()
    
    conn.cursor.return_value.__aenter__ = AsyncMock(return_value=cursor)
    conn.cursor.return_value.__aexit__ = AsyncMock()
    
    cursor.execute = AsyncMock()
    cursor.fetchall = AsyncMock()
    cursor.fetchone = AsyncMock()
    
    return pool, cursor


@pytest.mark.asyncio
async def test_query_action_logs_success(mock_pool):
    """액션 로그 조회 성공 케이스"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = [
        {
            "action_id": 1,
            "user_id": "USER123",
            "todo_id": "TODO1",
            "action_type": "COMPLETED",
            "action_time": datetime.now(),
            "day_of_week": "Monday",
            "action_date": datetime.now().date()
        }
    ]
    
    # When
    results = await client.query_action_logs(
        user_id="USER123",
        start_date="2026-01-01",
        end_date="2026-01-31"
    )
    
    # Then
    assert len(results) == 1
    assert results[0]["user_id"] == "USER123"
    assert results[0]["action_type"] == "COMPLETED"
    cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_query_action_logs_with_action_type(mock_pool):
    """특정 액션 타입으로 필터링"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = [
        {"action_type": "POSTPONED", "count": 5}
    ]
    
    # When
    results = await client.query_action_logs(
        user_id="USER123",
        start_date="2026-01-01",
        end_date="2026-01-31",
        action_type="POSTPONED"
    )
    
    # Then
    assert len(results) == 1
    cursor.execute.assert_called_once()
    # 쿼리에 action_type 파라미터가 포함되었는지 확인
    call_args = cursor.execute.call_args
    assert "POSTPONED" in call_args[0][1]


@pytest.mark.asyncio
async def test_query_action_logs_empty_result(mock_pool):
    """결과가 없는 경우"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = []
    
    # When
    results = await client.query_action_logs(
        user_id="USER123",
        start_date="2026-01-01",
        end_date="2026-01-31"
    )
    
    # Then
    assert len(results) == 0


@pytest.mark.asyncio
async def test_calculate_completion_rate_week(mock_pool):
    """주간 완료율 계산"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchone.return_value = {
        "completed_count": 8,
        "total_count": 10
    }
    
    # When
    rate = await client.calculate_completion_rate(
        user_id="USER123",
        period="week"
    )
    
    # Then
    assert rate == 80.0
    cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_calculate_completion_rate_month(mock_pool):
    """월간 완료율 계산"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchone.return_value = {
        "completed_count": 25,
        "total_count": 30
    }
    
    # When
    rate = await client.calculate_completion_rate(
        user_id="USER123",
        period="month"
    )
    
    # Then
    assert rate == 83.33
    cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_calculate_completion_rate_no_data(mock_pool):
    """데이터가 없는 경우 0% 반환"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchone.return_value = {
        "completed_count": 0,
        "total_count": 0
    }
    
    # When
    rate = await client.calculate_completion_rate(
        user_id="USER123",
        period="week"
    )
    
    # Then
    assert rate == 0.0


@pytest.mark.asyncio
async def test_calculate_completion_rate_invalid_period(mock_pool):
    """잘못된 기간 파라미터"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    # When & Then
    with pytest.raises(Exception) as exc_info:
        await client.calculate_completion_rate(
            user_id="USER123",
            period="invalid"
        )
    
    assert "Invalid period" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analyze_postpone_pattern_success(mock_pool):
    """미룸 패턴 분석 성공"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = [
        {"day_of_week": "Sunday", "postpone_count": 8},
        {"day_of_week": "Saturday", "postpone_count": 5},
        {"day_of_week": "Friday", "postpone_count": 3}
    ]
    
    # When
    pattern = await client.analyze_postpone_pattern(
        user_id="USER123",
        start_date="2026-01-01",
        end_date="2026-01-31"
    )
    
    # Then
    assert pattern["worst_day"] == "Sunday"
    assert pattern["total_postponed"] == 16
    assert len(pattern["daily_stats"]) == 3
    assert pattern["daily_stats"][0]["day_of_week"] == "Sunday"
    assert pattern["daily_stats"][0]["postpone_count"] == 8


@pytest.mark.asyncio
async def test_analyze_postpone_pattern_no_data(mock_pool):
    """미룸 데이터가 없는 경우"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = []
    
    # When
    pattern = await client.analyze_postpone_pattern(
        user_id="USER123",
        start_date="2026-01-01",
        end_date="2026-01-31"
    )
    
    # Then
    assert pattern["worst_day"] is None
    assert pattern["total_postponed"] == 0
    assert len(pattern["daily_stats"]) == 0


@pytest.mark.asyncio
async def test_get_recent_todos_success(mock_pool):
    """최근 할 일 조회 성공"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = [
        {
            "todo_id": "TODO1",
            "title": "운동하기",
            "description": "헬스장 가기",
            "status": "PENDING",
            "created_at": datetime.now(),
            "due_date": datetime.now() + timedelta(days=1)
        },
        {
            "todo_id": "TODO2",
            "title": "공부하기",
            "description": "Python 학습",
            "status": "COMPLETED",
            "created_at": datetime.now(),
            "due_date": datetime.now()
        }
    ]
    
    # When
    todos = await client.get_recent_todos(
        user_id="USER123",
        limit=10
    )
    
    # Then
    assert len(todos) == 2
    assert todos[0]["title"] == "운동하기"
    assert todos[1]["status"] == "COMPLETED"
    cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_recent_todos_with_limit(mock_pool):
    """제한된 개수로 조회"""
    # Given
    pool, cursor = mock_pool
    client = DatabaseClient()
    client.pool = pool
    
    cursor.fetchall.return_value = [
        {"todo_id": f"TODO{i}", "title": f"Task {i}"}
        for i in range(5)
    ]
    
    # When
    todos = await client.get_recent_todos(
        user_id="USER123",
        limit=5
    )
    
    # Then
    assert len(todos) == 5
    # LIMIT 파라미터가 전달되었는지 확인
    call_args = cursor.execute.call_args
    assert 5 in call_args[0][1]


@pytest.mark.asyncio
async def test_database_client_initialization():
    """DatabaseClient 초기화 테스트"""
    # When
    client = DatabaseClient()
    
    # Then
    assert client.pool is None


@pytest.mark.asyncio
async def test_database_client_close():
    """DatabaseClient 종료 테스트"""
    # Given
    client = DatabaseClient()
    mock_pool = MagicMock()
    mock_pool.close = MagicMock()
    mock_pool.wait_closed = AsyncMock()
    client.pool = mock_pool
    
    # When
    await client.close()
    
    # Then
    mock_pool.close.assert_called_once()
    mock_pool.wait_closed.assert_called_once()
