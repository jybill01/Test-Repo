"""
리포트 생성 API 라우터
"""
import logging
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.models.request import ReportGenerationRequest
from app.models.response import ReportGenerationResponse
from app.clients.bedrock_client import BedrockClient
from app.services.report_generator import ReportGeneratorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/reports", tags=["Reports"])

# 싱글톤 인스턴스
bedrock_client = BedrockClient()
report_service = ReportGeneratorService(bedrock_client)


@router.post("/generate")
async def generate_report(request: ReportGenerationRequest):
    """
    리포트 생성 API (Context Injection 방식)
    
    Service A가 조회한 통계 데이터를 받아 AI 피드백 생성
    각 리포트 타입별로 해당 데이터만 반환
    """
    try:
        logger.info(f"Report generation requested for user: {request.user_id}, type: {request.report_type}, period: {request.target_period}")
        
        # statisticsData에서 해당 리포트 타입의 데이터만 추출
        report_type = request.report_type.upper()
        stats_data = request.statistics_data
        
        logger.info(f"Received stats_data: {stats_data}")
        
        # 리포트 타입별로 개별 피드백 생성
        if report_type == "GROWTH":
            # Insight-svc 형식: {topicName, growthRate, previousRate, currentRate}
            growth_data = {
                'topic_name': stats_data.get('topicName', '전체'),
                'growth_rate': stats_data.get('growthRate', 0),
                'previous_rate': stats_data.get('previousRate', 0),
                'current_rate': stats_data.get('currentRate', 0)
            }
            feedback = await report_service._generate_growth_feedback(growth_data)
            report_data = feedback.model_dump(by_alias=True)
            
        elif report_type == "TIMELINE":
            # Insight-svc 형식: {chartData: [{month, rate}]}
            chart_data_raw = stats_data.get('chartData', [])
            timeline_data = {
                'chart_data': [
                    {'month': item.get('month', ''), 'completion_rate': item.get('rate', 0)}
                    for item in chart_data_raw
                ]
            }
            feedback = await report_service._generate_timeline_feedback(timeline_data)
            report_data = feedback.model_dump(by_alias=True)
            
        elif report_type == "PATTERN":
            # Insight-svc 형식: {worstDay, avgPostponeCount, chart: [{day, count}]}
            chart_raw = stats_data.get('chart', [])
            pattern_data = {
                'daily_stats': [
                    {
                        'day': item.get('day', 'MONDAY'),
                        'total': item.get('count', 0) + 10,  # 임시로 total 계산
                        'completed': 10,  # 임시 값
                        'postponed': item.get('count', 0)
                    }
                    for item in chart_raw
                ]
            }
            feedback = await report_service._generate_pattern_feedback(pattern_data)
            report_data = feedback.model_dump(by_alias=True)
            
        elif report_type == "SUMMARY":
            # SUMMARY는 전체 통계 데이터 전달
            summary_data = {
                'total_tasks': stats_data.get('totalTasks', 0),
                'completed_tasks': stats_data.get('completedTasks', 0),
                'completion_rate': stats_data.get('completionRate', 0),
                'currentRate': stats_data.get('currentRate', stats_data.get('completionRate', 0)),
                'achievement_trend': stats_data.get('achievementTrend', '0%'),
                'achievementTrend': stats_data.get('achievementTrend', '0%'),  # 양쪽 키 모두 지원
                'bestFocusTime': stats_data.get('bestFocusTime', '08:00-10:00'),
                'best_focus_time': stats_data.get('bestFocusTime', '08:00-10:00')  # 양쪽 키 모두 지원
            }
            
            logger.info(f"Summary data prepared: {summary_data}")
            
            feedback = await report_service._generate_summary_feedback(
                None, None, None, summary_data
            )
            report_data = feedback.model_dump(by_alias=True)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 리포트 타입입니다: {report_type}"
            )
        
        logger.info(f"Report generated successfully for user: {request.user_id}, type: {report_type}")
        
        # Insight-svc가 기대하는 형식으로 반환
        return {
            "success": True,
            "reportData": report_data,
            "errorMessage": None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "reportData": {},
            "errorMessage": f"리포트 생성 중 오류가 발생했습니다: {str(e)}"
        }
