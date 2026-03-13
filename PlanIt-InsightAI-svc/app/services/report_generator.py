"""
리포트 생성 서비스 (Context Injection 방식)
Prompt Chaining 기법으로 4단계 피드백 생성
"""
import logging
from typing import Dict
from datetime import datetime

from app.clients.bedrock_client import BedrockClient
from app.models.response import (
    GrowthFeedback,
    TimelineFeedback,
    PatternFeedback,
    SummaryFeedback,
    ReportData,
    ReportGenerationResponse,
    ChartDataPointResponse,
    DailyStatsResponse
)

logger = logging.getLogger(__name__)


# 기본 템플릿 (Bedrock 호출 실패 시 사용)
DEFAULT_TEMPLATES = {
    "growth": {
        "message": "데이터를 분석 중입니다. 잠시 후 다시 확인해주세요."
    },
    "timeline": {
        "message": "타임라인 데이터를 준비 중입니다."
    },
    "pattern": {
        "message": "패턴 분석을 진행 중입니다."
    },
    "summary": {
        "message": "종합 리포트를 생성 중입니다."
    }
}


class ReportGeneratorService:
    """리포트 생성 서비스"""
    
    def __init__(self, bedrock_client: BedrockClient):
        self.bedrock = bedrock_client
    
    async def generate_report(self, stats_data: Dict) -> ReportGenerationResponse:
        """
        4단계 Prompt Chaining으로 리포트 생성
        
        Args:
            stats_data: 통계 데이터
        
        Returns:
            리포트 생성 응답
        """
        logger.info("Starting report generation")
        
        # Step 1-3: 병렬로 Growth, Timeline, Pattern 피드백 생성
        growth_feedback = await self._generate_growth_feedback(stats_data['growth'])
        timeline_feedback = await self._generate_timeline_feedback(stats_data['timeline'])
        pattern_feedback = await self._generate_pattern_feedback(stats_data['pattern'])
        
        # Step 4: Summary 피드백 생성 (이전 결과 참조)
        summary_feedback = await self._generate_summary_feedback(
            growth_feedback,
            timeline_feedback,
            pattern_feedback,
            stats_data['summary']
        )
        
        # 리포트 데이터 구성
        report_data = ReportData(
            growth=growth_feedback,
            timeline=timeline_feedback,
            pattern=pattern_feedback,
            summary=summary_feedback
        )
        
        logger.info("Report generation completed successfully")
        
        return ReportGenerationResponse(
            success=True,
            report_data=report_data,
            generated_at=datetime.now().isoformat()
        )
    
    async def _generate_growth_feedback(self, growth_data: Dict) -> GrowthFeedback:
        """
        성장 피드백 생성
        
        Args:
            growth_data: 성장 데이터
        
        Returns:
            성장 피드백
        """
        try:
            logger.info(f"Generating growth feedback with data: {growth_data}")
            
            system_prompt = """당신은 사용자의 할 일 관리 데이터를 분석하여 긍정적이고 동기부여가 되는 피드백을 제공하는 AI 어시스턴트입니다.

# 핵심 규칙
1. 성장률이 양수일 때는 "X% 성장했어요!"라는 표현을 사용합니다.
2. 성장률이 음수일 때는 "X% 감소했어요" 또는 "활동이 X% 줄었어요"라는 표현을 사용하고, 절대 "성장"이라는 단어를 사용하지 않습니다.
3. 친근하고 따뜻한 톤을 유지하며, 이모지를 적절히 활용합니다.
4. 메시지는 2-3문장으로 간결하게 작성합니다.

# 출력 형식
반드시 JSON 형식으로만 응답하세요."""
            
            topic_name = growth_data.get('topic_name', '전체')
            growth_rate = growth_data.get('growth_rate', 0)
            previous_rate = growth_data.get('previous_rate', 0)
            current_rate = growth_data.get('current_rate', 0)
            
            # Few-shot 예시 포함 (음수/양수 분기 처리)
            user_message = f"""다음 성장 데이터를 분석하여 피드백을 생성해주세요:

주제: {topic_name}
성장률: {growth_rate}%
이전 완료율: {previous_rate}%
현재 완료율: {current_rate}%

# 출력 예시

예시 1 (성장률 양수):
입력: 주제=운동, 성장률=24%, 이전=60%, 현재=75%
출력:
{{
  "topicName": "운동",
  "growthRate": 24,
  "message": "이전 3개월 보다 운동 분야에서 24% 성장했어요! 정말 대단한 변화입니다. 꾸준한 노력이 빛을 발하고 있네요 💪"
}}

예시 2 (성장률 양수, 다른 주제):
입력: 주제=업무, 성장률=15%, 이전=55%, 현재=63%
출력:
{{
  "topicName": "업무",
  "growthRate": 15,
  "message": "이전 3개월 보다 업무 분야에서 15% 성장했어요! 업무 효율이 크게 향상되었네요. 이 추세를 계속 유지해보세요 🎯"
}}

예시 3 (성장률 음수 - 중요!):
입력: 주제=학습, 성장률=-10%, 이전=70%, 현재=63%
출력:
{{
  "topicName": "학습",
  "growthRate": -10,
  "message": "이전 3개월 보다 학습 분야 활동이 10% 감소했어요. 누구에게나 슬럼프는 있어요. 작은 목표부터 다시 시작해보는 건 어떨까요? 😊"
}}

예시 4 (성장률 음수 - 큰 폭):
입력: 주제=독서, 성장률=-24%, 이전=80%, 현재=61%
출력:
{{
  "topicName": "독서",
  "growthRate": -24,
  "message": "이전 3개월 보다 독서 분야 활동이 24% 감소했어요. 다음 주엔 더 분발해 볼까요? 작은 변화가 큰 차이를 만들어요 📚"
}}

예시 5 (성장률 0 근처):
입력: 주제=운동, 성장률=2%, 이전=50%, 현재=51%
출력:
{{
  "topicName": "운동",
  "growthRate": 2,
  "message": "이전 3개월 보다 운동 분야에서 2% 성장했어요! 꾸준함이 가장 중요합니다. 지금처럼 계속 유지해보세요 💪"
}}

# 중요 규칙
- 성장률이 양수(+)일 때: "X% 성장했어요!" 사용
- 성장률이 음수(-)일 때: "X% 감소했어요" 또는 "활동이 X% 줄었어요" 사용 (절대 "성장"이라는 단어 사용 금지!)
- 음수일 때는 위로와 격려의 톤으로 작성

# 실제 데이터로 생성
위 예시를 참고하여, 주어진 데이터로 피드백을 생성해주세요.

다음 JSON 형식으로 응답하세요:
{{
  "topicName": "{topic_name}",
  "growthRate": {growth_rate},
  "message": "피드백 메시지 (2-3문장, 성장률 부호에 따라 적절한 표현 사용)"
}}"""
            
            messages = [
                {
                    "role": "user",
                    "content": [{"text": user_message}]
                }
            ]
            
            response = await self.bedrock.converse(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=500
            )
            
            logger.info(f"Bedrock response received for growth feedback")
            
            text = self.bedrock.extract_text(response)
            logger.info(f"Extracted text: {text}")
            
            parsed = self.bedrock.parse_json_response(text)
            logger.info(f"Parsed JSON: {parsed}")
            
            return GrowthFeedback(**parsed)
        
        except Exception as e:
            logger.error(f"Growth feedback generation failed: {e}", exc_info=True)
            # Fallback: 기본 메시지 생성 (음수/양수 분기 처리)
            growth_rate_val = growth_data.get("growth_rate", 0)
            topic = growth_data.get("topic_name", "전체")
            
            if growth_rate_val >= 0:
                message = f"이전 3개월 보다 {topic} 분야에서 {growth_rate_val}% 성장했어요! 데이터를 분석 중입니다."
            else:
                message = f"이전 3개월 보다 {topic} 분야 활동이 {abs(growth_rate_val)}% 감소했어요. 다음 주엔 더 분발해 볼까요?"
            
            return GrowthFeedback(
                topic_name=topic,
                growth_rate=growth_rate_val,
                message=message
            )
    
    async def _generate_timeline_feedback(self, timeline_data: Dict) -> TimelineFeedback:
        """
        타임라인 피드백 생성
        
        Args:
            timeline_data: 타임라인 데이터
        
        Returns:
            타임라인 피드백
        """
        try:
            system_prompt = """당신은 사용자의 할 일 관리 데이터를 분석하여 긍정적이고 동기부여가 되는 피드백을 제공하는 AI 어시스턴트입니다.
주어진 타임라인 데이터를 분석하여 추세를 설명하는 메시지를 생성하세요.
반드시 JSON 형식으로만 응답하세요."""
            
            chart_data_str = "\n".join([
                f"- {item['month']}: {item['completion_rate']}%"
                for item in timeline_data.get('chart_data', [])
            ])
            
            user_message = f"""다음 타임라인 데이터를 분석하여 피드백을 생성해주세요:

{chart_data_str}

다음 JSON 형식으로 응답하세요:
{{
  "chartData": {timeline_data.get('chart_data', [])},
  "message": "추세 분석 메시지 (1-2문장, 긍정적인 톤)"
}}"""
            
            messages = [
                {
                    "role": "user",
                    "content": [{"text": user_message}]
                }
            ]
            
            logger.info("Generating timeline feedback")
            
            response = await self.bedrock.converse(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=500
            )
            
            logger.info("Bedrock response received for timeline feedback")
            
            text = self.bedrock.extract_text(response)
            logger.info(f"Extracted text: {text}")
            
            if not text:
                raise Exception("Bedrock returned empty response")
            
            parsed = self.bedrock.parse_json_response(text)
            logger.info(f"Parsed JSON: {parsed}")
            
            # chartData를 ChartDataPointResponse로 변환
            chart_data_responses = [
                ChartDataPointResponse(**item)
                for item in parsed.get('chartData', timeline_data.get('chart_data', []))
            ]
            
            return TimelineFeedback(
                chart_data=chart_data_responses,
                message=parsed.get('message', DEFAULT_TEMPLATES["timeline"]["message"])
            )
        
        except Exception as e:
            logger.error(f"Timeline feedback generation failed: {str(e)}", exc_info=True)
            chart_data_responses = [
                ChartDataPointResponse(**item)
                for item in timeline_data.get('chart_data', [])
            ]
            return TimelineFeedback(
                chart_data=chart_data_responses,
                message=DEFAULT_TEMPLATES["timeline"]["message"]
            )
    
    async def _generate_pattern_feedback(self, pattern_data: Dict) -> PatternFeedback:
        """
        패턴 피드백 생성
        
        Args:
            pattern_data: 패턴 데이터
        
        Returns:
            패턴 피드백
        """
        try:
            system_prompt = """당신은 사용자의 할 일 관리 데이터를 분석하여 긍정적이고 동기부여가 되는 피드백을 제공하는 AI 어시스턴트입니다.
주어진 요일별 패턴 데이터를 분석하여 개선 제안을 포함한 메시지를 생성하세요.
반드시 JSON 형식으로만 응답하세요."""
            
            daily_stats = pattern_data.get('daily_stats', [])
            daily_stats_str = "\n".join([
                f"- {item['day']}: 총 {item['total']}개, 완료 {item['completed']}개, 미룸 {item['postponed']}개"
                for item in daily_stats
            ])
            
            # 가장 많이 미룬 요일 찾기
            if daily_stats:
                worst_day_data = max(daily_stats, key=lambda x: x.get('postponed', 0))
                worst_day = worst_day_data.get('day', 'SUNDAY')
                
                # 평균 미룬 횟수 계산
                total_postponed = sum(item.get('postponed', 0) for item in daily_stats)
                avg_postpone = round(total_postponed / len(daily_stats), 1)
            else:
                worst_day = 'SUNDAY'
                avg_postpone = 0
            
            user_message = f"""다음 요일별 패턴 데이터를 분석하여 피드백을 생성해주세요:

{daily_stats_str}

다음 JSON 형식으로 응답하세요:
{{
  "worstDay": "{worst_day}",
  "avgPostponeCount": {avg_postpone},
  "chartData": {daily_stats},
  "message": "패턴 분석 및 개선 제안 메시지 (1-2문장, 건설적인 톤)"
}}"""
            
            messages = [
                {
                    "role": "user",
                    "content": [{"text": user_message}]
                }
            ]
            
            logger.info("Generating pattern feedback")
            
            response = await self.bedrock.converse(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=500
            )
            
            logger.info("Bedrock response received for pattern feedback")
            
            text = self.bedrock.extract_text(response)
            logger.info(f"Extracted text: {text}")
            
            if not text:
                raise Exception("Bedrock returned empty response")
            
            parsed = self.bedrock.parse_json_response(text)
            logger.info(f"Parsed JSON: {parsed}")
            
            # chartData를 DailyStatsResponse로 변환
            chart_data_responses = [
                DailyStatsResponse(**item)
                for item in parsed.get('chartData', daily_stats)
            ]
            
            return PatternFeedback(
                worst_day=parsed.get('worstDay', worst_day),
                avg_postpone_count=parsed.get('avgPostponeCount', avg_postpone),
                chart_data=chart_data_responses,
                message=parsed.get('message', DEFAULT_TEMPLATES["pattern"]["message"])
            )
        
        except Exception as e:
            logger.error(f"Pattern feedback generation failed: {str(e)}", exc_info=True)
            daily_stats = pattern_data.get('daily_stats', [])
            
            if daily_stats:
                worst_day_data = max(daily_stats, key=lambda x: x.get('postponed', 0))
                worst_day = worst_day_data.get('day', 'SUNDAY')
                total_postponed = sum(item.get('postponed', 0) for item in daily_stats)
                avg_postpone = round(total_postponed / len(daily_stats), 1)
            else:
                worst_day = 'SUNDAY'
                avg_postpone = 0
            
            chart_data_responses = [
                DailyStatsResponse(**item)
                for item in daily_stats
            ]
            
            return PatternFeedback(
                worst_day=worst_day,
                avg_postpone_count=avg_postpone,
                chart_data=chart_data_responses,
                message=DEFAULT_TEMPLATES["pattern"]["message"]
            )
    
    async def _generate_summary_feedback(
        self,
        growth: GrowthFeedback,
        timeline: TimelineFeedback,
        pattern: PatternFeedback,
        summary_data: Dict
    ) -> SummaryFeedback:
        """
        종합 피드백 생성 (Prompt Chaining - 이전 3개 결과 참조)
        
        Args:
            growth: 성장 피드백
            timeline: 타임라인 피드백
            pattern: 패턴 피드백
            summary_data: 요약 데이터
        
        Returns:
            종합 피드백
        """
        try:
            # 디버깅 로그: 실제 입력 데이터 확인
            logger.info(f"Summary Prompt Input Data: {summary_data}")
            
            # None 체크 및 안전한 메시지 추출
            growth_msg = growth.message if growth and hasattr(growth, 'message') else "성장 데이터 분석 중"
            timeline_msg = timeline.message if timeline and hasattr(timeline, 'message') else "타임라인 분석 중"
            pattern_msg = pattern.message if pattern and hasattr(pattern, 'message') else "패턴 분석 중"
            
            # 통계 데이터 추출
            total_tasks = summary_data.get('total_tasks', 0)
            completed_tasks = summary_data.get('completed_tasks', 0)
            completion_rate = summary_data.get('completion_rate', 0)
            current_rate = summary_data.get('currentRate', completion_rate)  # Java에서 currentRate로 올 수도 있음
            achievement_trend = summary_data.get('achievement_trend', summary_data.get('achievementTrend', '0%'))
            best_focus_time = summary_data.get('bestFocusTime', summary_data.get('best_focus_time', '08:00-10:00'))
            
            logger.info(f"Extracted values - currentRate: {current_rate}, achievementTrend: {achievement_trend}, bestFocusTime: {best_focus_time}")
            
            system_prompt = """당신은 사용자의 할 일 관리 성과를 분석하여 긍정적이고 동기부여가 되는 피드백을 제공하는 AI 어시스턴트입니다.

# 핵심 규칙 (절대 준수)
1. 반드시 제공된 `currentRate`(현재 달성률)와 `achievementTrend`(추세) 수치를 문장 안에 직접 언급하며 현재의 성과를 요약하세요.
2. 사용자는 이미 활발히 할 일을 수행하고 있으며, 통계 수치가 그 증거입니다.
3. 수치를 기반으로 구체적인 칭찬과 격려를 제공하세요.
4. 2-3문장으로 간결하게 작성하세요.
5. 반드시 JSON 형식으로만 응답하세요."""
            
            user_message = f"""다음 통계 데이터를 분석하여 종합 피드백을 생성해주세요:

[이전 분석 결과]
- 성장 피드백: {growth_msg}
- 타임라인 피드백: {timeline_msg}
- 패턴 피드백: {pattern_msg}

[핵심 통계 수치]
- 현재 달성률(currentRate): {current_rate}%
- 달성 추세(achievementTrend): {achievement_trend}
- 최적 집중 시간(bestFocusTime): {best_focus_time}
- 총 할 일: {total_tasks}개
- 완료한 할 일: {completed_tasks}개

# 필수 출력 예시 (반드시 이 형식을 따르세요)

예시 1 (높은 달성률):
입력: currentRate=67%, achievementTrend=+12%, bestFocusTime=16:00-18:00
출력:
{{
  "message": "이번 주 달성률은 67%로 훌륭한 성과를 보이고 있습니다! 추세도 +12% 상승하며 꾸준히 발전하고 계시네요. 가장 집중력이 좋은 16:00-18:00 시간대를 활용해 남은 목표도 달성해 보세요 🎯"
}}

예시 2 (중간 달성률):
입력: currentRate=55%, achievementTrend=+3%, bestFocusTime=09:00-11:00
출력:
{{
  "message": "현재 달성률 55%로 안정적인 페이스를 유지하고 계시네요. 추세가 +3% 상승 중이니 이 흐름을 이어가면 좋겠어요. 09:00-11:00 시간대에 집중력이 가장 높으니 이 시간을 적극 활용해보세요 💪"
}}

예시 3 (낮은 달성률):
입력: currentRate=38%, achievementTrend=-5%, bestFocusTime=14:00-16:00
출력:
{{
  "message": "현재 달성률은 38%로 조금 아쉽지만, 충분히 회복 가능한 수치입니다. 14:00-16:00 시간대에 집중력이 가장 좋으니 이 시간을 활용해 작은 목표부터 다시 시작해보는 건 어떨까요? 😊"
}}

예시 4 (매우 높은 달성률):
입력: currentRate=82%, achievementTrend=+18%, bestFocusTime=10:00-12:00
출력:
{{
  "message": "와우! 달성률 82%에 추세도 +18% 급상승 중이에요! 정말 대단한 성과입니다. 10:00-12:00 시간대의 높은 집중력을 계속 유지하면 100% 달성도 가능할 거예요 🚀"
}}

# 중요: 위 예시처럼 반드시 currentRate, achievementTrend, bestFocusTime 수치를 문장에 직접 포함하세요!

다음 JSON 형식으로 응답하세요:
{{
  "message": "종합 평가 메시지 (반드시 currentRate, achievementTrend, bestFocusTime 수치를 문장에 포함)"
}}"""
            
            messages = [
                {
                    "role": "user",
                    "content": [{"text": user_message}]
                }
            ]
            
            logger.info("Generating summary feedback with enforced positive prompt")
            logger.info(f"Prompt includes: currentRate={current_rate}%, achievementTrend={achievement_trend}, bestFocusTime={best_focus_time}")
            
            response = await self.bedrock.converse(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.7,
                max_tokens=500
            )
            
            logger.info("Bedrock response received for summary feedback")
            
            text = self.bedrock.extract_text(response)
            logger.info(f"Extracted text: {text}")
            
            if not text:
                raise Exception("Bedrock returned empty response")
            
            parsed = self.bedrock.parse_json_response(text)
            logger.info(f"Parsed JSON: {parsed}")
            
            return SummaryFeedback(**parsed)
        
        except Exception as e:
            logger.error(f"Summary feedback generation failed: {str(e)}", exc_info=True)
            # Fallback: 실제 수치를 사용한 기본 메시지
            current_rate = summary_data.get('currentRate', summary_data.get('completion_rate', 50))
            achievement_trend = summary_data.get('achievementTrend', summary_data.get('achievement_trend', '0%'))
            best_focus_time = summary_data.get('bestFocusTime', summary_data.get('best_focus_time', '08:00-10:00'))
            
            fallback_message = f"현재 달성률 {current_rate}%로 꾸준히 노력하고 계시네요! 추세는 {achievement_trend}이며, {best_focus_time} 시간대에 가장 집중력이 좋습니다. 계속 화이팅하세요 💪"
            
            return SummaryFeedback(
                message=fallback_message
            )
