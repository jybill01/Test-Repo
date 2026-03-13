"""
API 요청 Pydantic 모델
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class GrowthData(BaseModel):
    """성장 데이터"""
    topic_name: str = Field(..., description="주제명")
    growth_rate: int = Field(..., description="성장률 (%)")
    previous_completion_rate: int = Field(..., description="이전 완료율 (%)")
    current_completion_rate: int = Field(..., description="현재 완료율 (%)")


class ChartDataPoint(BaseModel):
    """차트 데이터 포인트"""
    month: str = Field(..., description="월 (YYYY-MM)")
    completion_rate: int = Field(..., description="완료율 (%)")


class TimelineData(BaseModel):
    """타임라인 데이터"""
    chart_data: List[ChartDataPoint] = Field(..., description="차트 데이터")


class DailyStats(BaseModel):
    """요일별 통계"""
    day: str = Field(..., description="요일 (MONDAY, TUESDAY, ...)")
    total: int = Field(..., description="총 할 일 수")
    completed: int = Field(..., description="완료한 할 일 수")
    postponed: int = Field(..., description="미룬 할 일 수")


class PatternData(BaseModel):
    """패턴 데이터"""
    daily_stats: List[DailyStats] = Field(..., description="요일별 통계")


class SummaryData(BaseModel):
    """요약 데이터"""
    total_tasks: int = Field(..., description="총 할 일 수")
    completed_tasks: int = Field(..., description="완료한 할 일 수")
    completion_rate: float = Field(..., description="완료율 (%)")
    achievement_trend: str = Field(..., description="달성 추세")


class StatsData(BaseModel):
    """통계 데이터"""
    growth: GrowthData
    timeline: TimelineData
    pattern: PatternData
    summary: SummaryData


class ReportGenerationRequest(BaseModel):
    """리포트 생성 요청"""
    user_id: str = Field(..., alias="userId", description="사용자 ID")
    report_type: str = Field(..., alias="reportType", description="리포트 타입")
    target_period: str = Field(..., alias="targetPeriod", description="대상 기간")
    statistics_data: Dict = Field(..., alias="statisticsData", description="통계 데이터")
    
    class Config:
        populate_by_name = True


class ChatQueryRequest(BaseModel):
    """챗봇 질의 요청"""
    user_id: str = Field(..., description="사용자 ID")
    query: str = Field(..., description="사용자 질의")
