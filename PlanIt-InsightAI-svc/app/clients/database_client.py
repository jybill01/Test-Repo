"""
MariaDB 데이터베이스 클라이언트
Bedrock Tool Use에서 사용할 쿼리 실행
"""
import logging
import aiomysql
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DatabaseClient:
    """비동기 MariaDB 클라이언트"""
    
    def __init__(self):
        self.pool = None
    
    async def initialize(self):
        """
        애플리케이션 시작 시 연결 풀 생성
        """
        try:
            self.pool = await aiomysql.create_pool(
                host=settings.db_host,
                port=settings.db_port,
                user=settings.db_user,
                password=settings.db_password,
                db=settings.db_name,
                minsize=1,
                maxsize=settings.db_pool_size,
                autocommit=True,
                charset='utf8mb4'
            )
            logger.info(f"Database connection pool created: {settings.db_host}:{settings.db_port}/{settings.db_name}")
        except Exception as e:
            logger.error(f"Failed to create database connection pool: {e}")
            raise
    
    async def close(self):
        """연결 풀 종료"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("Database connection pool closed")
    
    async def query_action_logs(
        self,
        user_id: str,
        start_date: str,
        end_date: str,
        action_type: Optional[str] = None
    ) -> List[Dict]:
        """
        사용자의 할 일 처리 로그 조회
        
        Args:
            user_id: 사용자 ID
            start_date: 시작 날짜 (YYYY-MM-DD)
            end_date: 종료 날짜 (YYYY-MM-DD)
            action_type: 액션 타입 (COMPLETED, POSTPONED, DELETED 등)
        
        Returns:
            액션 로그 리스트
        """
        try:
            query = """
                SELECT 
                    task_id,
                    user_id,
                    goals_id,
                    action_type,
                    action_time,
                    day_of_week,
                    hour_of_day,
                    due_date,
                    postponed_to_date
                FROM user_action_logs
                WHERE user_id = %s
                    AND action_time BETWEEN %s AND %s
                    AND deleted_at IS NULL
            """
            
            params = [user_id, f"{start_date} 00:00:00", f"{end_date} 23:59:59"]
            
            if action_type:
                query += " AND action_type = %s"
                params.append(action_type)
            
            query += " ORDER BY action_time DESC"
            
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query, params)
                    results = await cursor.fetchall()
                    
            logger.info(f"Query action logs: user={user_id}, count={len(results)}")
            return results
        
        except Exception as e:
            logger.error(f"Failed to query action logs: {e}")
            raise Exception(f"데이터베이스 조회 실패: {str(e)}")
    
    async def calculate_completion_rate(
        self,
        user_id: str,
        period: str  # 'week' or 'month'
    ) -> float:
        """
        특정 기간의 완료율 계산
        
        Args:
            user_id: 사용자 ID
            period: 기간 ('week' 또는 'month')
        
        Returns:
            완료율 (0-100)
        """
        try:
            # 기간 계산
            end_date = datetime.now()
            if period == 'week':
                start_date = end_date - timedelta(days=7)
            elif period == 'month':
                start_date = end_date - timedelta(days=30)
            else:
                raise ValueError(f"Invalid period: {period}")
            
            query = """
                SELECT 
                    COUNT(CASE WHEN action_type = 'COMPLETED' THEN 1 END) as completed_count,
                    COUNT(*) as total_count
                FROM user_action_logs
                WHERE user_id = %s
                    AND action_time BETWEEN %s AND %s
                    AND deleted_at IS NULL
            """
            
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query, [user_id, start_date, end_date])
                    result = await cursor.fetchone()
            
            if result and result['total_count'] > 0:
                completion_rate = (result['completed_count'] / result['total_count']) * 100
            else:
                completion_rate = 0.0
            
            logger.info(f"Calculate completion rate: user={user_id}, period={period}, rate={completion_rate:.2f}%")
            return round(completion_rate, 2)
        
        except Exception as e:
            logger.error(f"Failed to calculate completion rate: {e}")
            raise Exception(f"완료율 계산 실패: {str(e)}")
    
    async def analyze_postpone_pattern(
        self,
        user_id: str,
        start_date: str,
        end_date: str
    ) -> Dict:
        """
        요일별 미룸 패턴 분석
        
        Args:
            user_id: 사용자 ID
            start_date: 시작 날짜 (YYYY-MM-DD)
            end_date: 종료 날짜 (YYYY-MM-DD)
        
        Returns:
            요일별 미룸 통계
        """
        try:
            query = """
                SELECT 
                    day_of_week,
                    COUNT(*) as postpone_count
                FROM user_action_logs
                WHERE user_id = %s
                    AND action_type = 'POSTPONED'
                    AND action_time BETWEEN %s AND %s
                    AND deleted_at IS NULL
                GROUP BY day_of_week
                ORDER BY postpone_count DESC
            """
            
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query, [user_id, f"{start_date} 00:00:00", f"{end_date} 23:59:59"])
                    results = await cursor.fetchall()
            
            # 결과 포맷팅
            pattern = {
                "daily_stats": [
                    {
                        "day_of_week": row['day_of_week'],
                        "postpone_count": row['postpone_count']
                    }
                    for row in results
                ],
                "worst_day": results[0]['day_of_week'] if results else None,
                "total_postponed": sum(row['postpone_count'] for row in results)
            }
            
            logger.info(f"Analyze postpone pattern: user={user_id}, worst_day={pattern['worst_day']}")
            return pattern
        
        except Exception as e:
            logger.error(f"Failed to analyze postpone pattern: {e}")
            raise Exception(f"패턴 분석 실패: {str(e)}")
    
    async def get_recent_todos(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        최근 할 일 목록 조회 (action logs 기반)
        
        Args:
            user_id: 사용자 ID
            limit: 조회 개수
        
        Returns:
            할 일 목록
        """
        try:
            query = """
                SELECT 
                    task_id,
                    goals_id,
                    action_type,
                    action_time,
                    day_of_week,
                    due_date
                FROM user_action_logs
                WHERE user_id = %s
                    AND deleted_at IS NULL
                ORDER BY action_time DESC
                LIMIT %s
            """
            
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query, [user_id, limit])
                    results = await cursor.fetchall()
            
            logger.info(f"Get recent todos: user={user_id}, count={len(results)}")
            return results
        
        except Exception as e:
            logger.error(f"Failed to get recent todos: {e}")
            raise Exception(f"할 일 목록 조회 실패: {str(e)}")


# 싱글톤 인스턴스
_database_client = None


async def get_database_client() -> DatabaseClient:
    """데이터베이스 클라이언트 싱글톤 반환"""
    global _database_client
    if _database_client is None:
        _database_client = DatabaseClient()
        await _database_client.initialize()
    return _database_client
