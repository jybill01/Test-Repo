"""
챗봇 서비스 (Bedrock Tool Use 방식)
Claude가 자율적으로 데이터베이스 조회 및 분석
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.clients.bedrock_client import BedrockClient
from app.clients.database_client import DatabaseClient

logger = logging.getLogger(__name__)


class ChatbotService:
    """Bedrock Tool Use 기반 챗봇 서비스"""
    
    def __init__(
        self,
        bedrock_client: BedrockClient,
        db_client: DatabaseClient
    ):
        self.bedrock = bedrock_client
        self.db = db_client
        self.tools = self._define_tools()
    
    def _define_tools(self) -> List[Dict]:
        """
        Bedrock Tool Spec 정의
        Claude가 사용할 수 있는 도구들을 정의
        """
        return [
            {
                "toolSpec": {
                    "name": "query_user_action_logs",
                    "description": """사용자의 할 일 처리 로그를 조회합니다. 
                    
action_type 파라미터 사용법:
- 'COMPLETED': 완료한 할 일만 조회 (사용자가 잘한 요일, 생산적인 요일을 물을 때 사용)
- 'POSTPONED': 미룬 할 일만 조회 (사용자가 못한 요일, 미룬 요일을 물을 때 사용)
- 생략: 모든 액션 조회 (완료율 계산 시 사용)

반환 데이터: day_of_week(요일), count(횟수) 형태의 리스트""",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "start_date": {
                                    "type": "string",
                                    "description": "시작 날짜 (YYYY-MM-DD 형식)"
                                },
                                "end_date": {
                                    "type": "string",
                                    "description": "종료 날짜 (YYYY-MM-DD 형식)"
                                },
                                "action_type": {
                                    "type": "string",
                                    "description": "액션 타입 필터. COMPLETED=완료한 할 일, POSTPONED=미룬 할 일. 생략하면 모든 액션 조회.",
                                    "enum": ["COMPLETED", "POSTPONED", "DELETED"]
                                }
                            },
                            "required": ["start_date", "end_date"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "calculate_completion_rate",
                    "description": "특정 기간의 할 일 완료율을 계산합니다.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "period": {
                                    "type": "string",
                                    "description": "기간 ('week' 또는 'month')",
                                    "enum": ["week", "month"]
                                }
                            },
                            "required": ["period"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "analyze_postpone_pattern",
                    "description": "요일별 미룸 패턴을 분석합니다. 어느 요일에 가장 많이 미루는지 확인할 수 있습니다.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "start_date": {
                                    "type": "string",
                                    "description": "시작 날짜 (YYYY-MM-DD 형식)"
                                },
                                "end_date": {
                                    "type": "string",
                                    "description": "종료 날짜 (YYYY-MM-DD 형식)"
                                }
                            },
                            "required": ["start_date", "end_date"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "get_recent_todos",
                    "description": "최근 할 일 목록을 조회합니다.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "limit": {
                                    "type": "integer",
                                    "description": "조회할 개수 (기본값: 10)",
                                    "default": 10
                                }
                            }
                        }
                    }
                }
            }
        ]
    
    async def process_query(self, user_id: str, query: str) -> Dict:
        """
        사용자 질의 처리 (Bedrock Tool Use 워크플로우)
        
        Args:
            user_id: 사용자 ID
            query: 사용자 질의
        
        Returns:
            답변 및 출처 정보
        """
        logger.info("-" * 80)
        logger.info(f"[ChatbotService] Starting process_query")
        logger.info(f"  User ID: {user_id}")
        logger.info(f"  Query: {query}")
        logger.info("-" * 80)
        
        # 대화 컨텍스트 초기화
        messages = [
            {
                "role": "user",
                "content": [{"text": query}]
            }
        ]
        
        system_prompt = f"""# 시스템 정보
사용자 ID: {user_id}
오늘 날짜: {datetime.now().strftime('%Y-%m-%d')}

# 역할
당신은 PlanIt 서비스의 데이터 분석 AI 비서입니다. 사용자의 할 일 관리 데이터를 분석하여 정확한 인사이트를 제공합니다.

# 응답 제약 조건 (절대 준수!)

## 1. Stateless 시스템 - 대화 유도 절대 금지
이 시스템은 이전 대화 내역을 기억하지 않는 1회성 질의응답 시스템입니다.
- 답변 마지막에 "~할까요?", "~원하시나요?", "~궁금하신가요?" 같은 추가 질문을 **절대** 작성하지 마세요
- "더 알고 싶으시면", "다른 질문이 있으시면" 같은 대화 연장 유도 문구 금지
- 질문에 대한 답변만 제공하고 즉시 종료하세요

## 2. 극강의 간결성
- "데이터를 분석해봤어요", "결과를 말씀드릴게요" 같은 서론/인사말 제외
- 핵심 결론과 근거 데이터만 3~4개의 간결한 문장으로 요약
- 마크다운 포맷팅 최소화 (불릿 포인트만 허용)
- 이모지 사용 최소화 (필요시 1~2개만)
- 전체 답변 길이: 최대 150자 이내 권장

## 3. 프로페셔널한 톤
- 과도하게 친근한 어투 지양
- 데이터 기반의 정확하고 객관적인 표현 사용
- 전문 비서의 간결하고 명확한 어조 유지

# 도메인 및 답변 범위

## 답변 가능한 질문 (✅)
1. **데이터 분석 질문** (도구 사용)
   - "지난 주에 어느 요일에 가장 많이 미뤘나요?"
   - "이번 달 완료율은?"
   - "최근 완료한 할 일은?"
   
2. **일반적인 할 일 관리 조언** (도구 사용 없이 직접 답변)
   - "월요일에 할 일 몇 개 정도 계획하는 게 좋아요?"
   - "미루는 습관을 고치려면 어떻게 해야 하나요?"
   - "할 일을 효율적으로 관리하는 방법은?"
   - "목표 설정 팁을 알려주세요"

## 답변 불가능한 질문 (❌)
- 날씨, 뉴스, 시사
- 코딩, 프로그래밍, 기술 질문
- 일반 상식, 역사, 과학
- 요리, 여행, 쇼핑
- 수학 문제 풀이
- 번역, 작문

**Off-topic 질문 시 응답:**
"PlanIt 할 일 관리와 생산성 향상에 관한 질문만 답변 가능합니다."

# 데이터 조회 도구 사용
1. query_user_action_logs:
   - action_type='COMPLETED': 완료한 할 일만
   - action_type='POSTPONED': 미룬 할 일만
   - 생략: 전체 조회

2. 완료/생산성 질문 → action_type='COMPLETED' 사용
3. 미룸 질문 → action_type='POSTPONED' 사용

# 답변 형식 예시

**데이터 분석 질문:**
질문: "지난 주 어느 요일에 가장 많이 미뤘나요?"
답변:
"일요일 8건으로 가장 많이 미뤘습니다.
- 토요일: 5건
- 금요일: 3건
주말에 미루는 경향이 있습니다."

**일반 조언 질문:**
질문: "월요일에 할 일 몇 개 정도 계획하는 게 좋아요?"
답변:
"월요일은 3-5개 정도가 적당합니다.
- 주초라 에너지가 높은 편
- 너무 많으면 부담감 증가
- 중요도 높은 것 위주로 배치하세요"

(추가 질문이나 대화 유도 문구 없이 즉시 종료)"""
        
        sources = []
        max_iterations = 5  # 무한 루프 방지
        
        for iteration in range(max_iterations):
            logger.info(f"[ChatbotService] Iteration {iteration + 1}/{max_iterations}")
            
            # Bedrock Converse API 호출 (Tool Use 활성화)
            response = await self.bedrock.converse(
                messages=messages,
                system_prompt=system_prompt,
                tools=self.tools,
                temperature=0.7,
                max_tokens=2000
            )
            
            stop_reason = response.get('stopReason')
            logger.info(f"[ChatbotService] Stop reason: {stop_reason}")
            
            # Tool Use 확인
            if stop_reason == 'tool_use' or self.bedrock.has_tool_use(response):
                logger.info(f"[ChatbotService] Tool use detected, processing...")
                
                # Assistant의 응답(toolUse 포함)을 대화 컨텍스트에 추가
                assistant_message = response['output']['message']
                messages.append({
                    "role": "assistant",
                    "content": assistant_message['content']
                })
                
                # 모든 toolUse 블록 처리
                tool_results = []
                for content_block in assistant_message['content']:
                    if 'toolUse' in content_block:
                        tool_use = content_block['toolUse']
                        tool_use_id = tool_use['toolUseId']
                        tool_name = tool_use['name']
                        tool_input = tool_use.get('input', {})
                        
                        logger.info(f"[ChatbotService] Executing tool: {tool_name}")
                        logger.info(f"  Tool Use ID: {tool_use_id}")
                        logger.info(f"  Tool Input: {tool_input}")
                        
                        # Tool 실행
                        tool_result = await self._execute_tool(
                            tool_name=tool_name,
                            tool_input=tool_input,
                            user_id=user_id
                        )
                        
                        # 출처 기록
                        sources.append(f"{tool_name} 실행")
                        
                        # toolResult 블록 생성 (Bedrock API 명세에 맞춤)
                        tool_results.append({
                            "toolResult": {
                                "toolUseId": tool_use_id,
                                "content": [
                                    {"json": tool_result}
                                ]
                            }
                        })
                
                # User 역할로 toolResult 전달
                messages.append({
                    "role": "user",
                    "content": tool_results
                })
                
                logger.info(f"[ChatbotService] Tool results added to context, continuing conversation...")
                
            elif stop_reason == 'end_turn':
                # 최종 답변 생성
                answer = self.bedrock.extract_text(response)
                logger.info("-" * 80)
                logger.info(f"[ChatbotService] Final answer generated")
                logger.info(f"  Answer preview: {answer[:100]}...")
                logger.info(f"  Answer length: {len(answer)} chars")
                logger.info(f"  Sources used: {', '.join(sources) if sources else 'None'}")
                logger.info("-" * 80)
                
                return {
                    "answer": answer,
                    "sources": sources if sources else ["직접 답변"],
                    "generated_at": datetime.now().isoformat()
                }
            else:
                # 예상치 못한 stopReason
                logger.warning(f"[ChatbotService] Unexpected stop reason: {stop_reason}")
                answer = self.bedrock.extract_text(response)
                if answer:
                    return {
                        "answer": answer,
                        "sources": sources if sources else ["직접 답변"],
                        "generated_at": datetime.now().isoformat()
                    }
                else:
                    logger.error(f"[ChatbotService] No text content in response with stop reason: {stop_reason}")
                    return {
                        "answer": "죄송합니다. 답변을 생성하는 중 문제가 발생했습니다.",
                        "sources": sources,
                        "generated_at": datetime.now().isoformat()
                    }
        
        # 최대 반복 횟수 초과
        logger.warning("-" * 80)
        logger.warning(f"[ChatbotService] Max iterations reached")
        logger.warning(f"  Query: {query}")
        logger.warning(f"  Iterations: {max_iterations}")
        logger.warning("-" * 80)
        return {
            "answer": "죄송합니다. 질문을 처리하는 데 시간이 너무 오래 걸렸습니다. 질문을 더 구체적으로 해주시겠어요?",
            "sources": sources,
            "generated_at": datetime.now().isoformat()
        }
    
    async def _execute_tool(
        self,
        tool_name: str,
        tool_input: Dict,
        user_id: str
    ) -> Dict:
        """
        Tool 실행 및 결과 반환
        
        Args:
            tool_name: Tool 이름
            tool_input: Tool 입력 파라미터
            user_id: 사용자 ID
        
        Returns:
            Tool 실행 결과 (JSON 직렬화 가능한 형태)
        """
        logger.info("=" * 80)
        logger.info(f"[Tool Execution] {tool_name}")
        logger.info(f"  User ID: {user_id}")
        logger.info(f"  Input Parameters: {tool_input}")
        logger.info("=" * 80)
        
        try:
            if tool_name == "query_user_action_logs":
                logger.info(f"[Tool] Querying action logs from database...")
                logger.info(f"  Query Details:")
                logger.info(f"    - user_id: {user_id}")
                logger.info(f"    - start_date: {tool_input['start_date']}")
                logger.info(f"    - end_date: {tool_input['end_date']}")
                logger.info(f"    - action_type: {tool_input.get('action_type', 'ALL (no filter)')}")
                
                results = await self.db.query_action_logs(
                    user_id=user_id,
                    start_date=tool_input['start_date'],
                    end_date=tool_input['end_date'],
                    action_type=tool_input.get('action_type')
                )
                
                logger.info(f"[Tool] Query returned {len(results)} records")
                
                # 결과 샘플 로깅
                if len(results) > 0:
                    logger.info(f"[Tool] Sample (first record): {results[0]}")
                else:
                    logger.warning("=" * 80)
                    logger.warning(f"[Tool] ⚠️ WARNING: No records found!")
                    logger.warning(f"  This means the query returned 0 results.")
                    logger.warning(f"  Possible causes:")
                    logger.warning(f"    1. user_id '{user_id}' has no data in database")
                    logger.warning(f"    2. Date range has no data: {tool_input['start_date']} ~ {tool_input['end_date']}")
                    logger.warning(f"    3. action_type filter '{tool_input.get('action_type')}' excludes all records")
                    logger.warning(f"  Run 'python check_data.py' to verify database contents")
                    logger.warning("=" * 80)
                
                # datetime 객체를 문자열로 변환
                serialized_results = []
                for row in results:
                    serialized_row = {}
                    for key, value in row.items():
                        if isinstance(value, datetime):
                            serialized_row[key] = value.isoformat()
                        elif value is None:
                            serialized_row[key] = None
                        else:
                            serialized_row[key] = str(value) if not isinstance(value, (int, float, bool, str)) else value
                    serialized_results.append(serialized_row)
                
                # 요일별 집계 추가 (Claude가 쉽게 이해할 수 있도록)
                day_counts = {}
                for row in serialized_results:
                    day = row.get('day_of_week', 'UNKNOWN')
                    day_counts[day] = day_counts.get(day, 0) + 1
                
                return {
                    "success": True,
                    "data": serialized_results,
                    "count": len(serialized_results),
                    "summary_by_day": day_counts
                }
            
            elif tool_name == "calculate_completion_rate":
                logger.info(f"[Tool] Calculating completion rate...")
                rate = await self.db.calculate_completion_rate(
                    user_id=user_id,
                    period=tool_input['period']
                )
                logger.info(f"[Tool] Completion rate: {rate}%")
                return {
                    "success": True,
                    "completion_rate": float(rate),
                    "period": tool_input['period']
                }
            
            elif tool_name == "analyze_postpone_pattern":
                logger.info(f"[Tool] Analyzing postpone pattern...")
                pattern = await self.db.analyze_postpone_pattern(
                    user_id=user_id,
                    start_date=tool_input['start_date'],
                    end_date=tool_input['end_date']
                )
                logger.info(f"[Tool] Pattern analysis complete: worst_day={pattern.get('worst_day')}")
                return {
                    "success": True,
                    "pattern": pattern
                }
            
            elif tool_name == "get_recent_todos":
                logger.info(f"[Tool] Getting recent todos...")
                todos = await self.db.get_recent_todos(
                    user_id=user_id,
                    limit=tool_input.get('limit', 10)
                )
                logger.info(f"[Tool] Retrieved {len(todos)} todos")
                
                # datetime 객체를 문자열로 변환
                serialized_todos = []
                for row in todos:
                    serialized_row = {}
                    for key, value in row.items():
                        if isinstance(value, datetime):
                            serialized_row[key] = value.isoformat()
                        elif value is None:
                            serialized_row[key] = None
                        else:
                            serialized_row[key] = str(value) if not isinstance(value, (int, float, bool, str)) else value
                    serialized_todos.append(serialized_row)
                
                return {
                    "success": True,
                    "todos": serialized_todos,
                    "count": len(serialized_todos)
                }
            
            else:
                logger.error(f"[Tool] Unknown tool: {tool_name}")
                return {
                    "success": False,
                    "error": f"알 수 없는 도구: {tool_name}"
                }
        
        except Exception as e:
            logger.error(f"[Tool] Execution failed: {tool_name}, error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
