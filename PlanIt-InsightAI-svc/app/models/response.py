"""
API 응답 Pydantic 모델
camelCase 변환을 위한 alias_generator 사용
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


def to_camel(string: str) -> str:
    """snake_case를 camelCase로 변환"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class GrowthFeedback(BaseModel):
    """성장 피드백"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    topic_name: str = Field(..., description="주제명")
    growth_rate: int = Field(..., description="성장률 (%)")
    message: str = Field(..., description="AI 피드백 메시지")


class ChartDataPointResponse(BaseModel):
    """차트 데이터 포인트 응답"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    month: str = Field(..., description="월 (YYYY-MM)")
    completion_rate: int = Field(..., description="완료율 (%)")


class TimelineFeedback(BaseModel):
    """타임라인 피드백"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    chart_data: List[ChartDataPointResponse] = Field(..., description="차트 데이터")
    message: str = Field(..., description="AI 피드백 메시지")


class DailyStatsResponse(BaseModel):
    """요일별 통계 응답"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    day: str = Field(..., description="요일")
    total: int = Field(..., description="총 할 일 수")
    completed: int = Field(..., description="완료한 할 일 수")
    postponed: int = Field(..., description="미룬 할 일 수")


class PatternFeedback(BaseModel):
    """패턴 피드백"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    worst_day: str = Field(..., description="가장 미룬 요일")
    avg_postpone_count: float = Field(..., description="평균 미룬 횟수")
    chart_data: List[DailyStatsResponse] = Field(..., description="차트 데이터")
    message: str = Field(..., description="AI 피드백 메시지")


class SummaryFeedback(BaseModel):
    """요약 피드백"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    message: str = Field(..., description="AI 피드백 메시지")


class ReportData(BaseModel):
    """리포트 데이터"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    growth: GrowthFeedback
    timeline: TimelineFeedback
    pattern: PatternFeedback
    summary: SummaryFeedback


class ReportGenerationResponse(BaseModel):
    """리포트 생성 응답"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    success: bool = Field(..., description="성공 여부")
    report_data: ReportData = Field(..., description="리포트 데이터")
    generated_at: str = Field(..., description="생성 시각")


class ChatQueryResponse(BaseModel):
    """챗봇 질의 응답"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    answer: str = Field(..., description="AI 답변")
    sources: List[str] = Field(..., description="데이터 출처")
    generated_at: str = Field(..., description="생성 시각")
