"""
AWS Bedrock 클라이언트
Claude 3.5 Sonnet v2 모델과 통신
"""
import boto3
import json
import logging
from typing import Dict, List, Optional
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class BedrockClient:
    """AWS Bedrock Converse API 클라이언트"""
    
    def __init__(self):
        """
        AWS Default Credential Provider Chain 사용
        1. 환경 변수 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
        2. ~/.aws/credentials 파일
        3. IAM Role (ECS/EKS)
        """
        settings = get_settings()
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            config=Config(
                connect_timeout=5,
                read_timeout=settings.bedrock_timeout,
                retries={'max_attempts': 3, 'mode': 'adaptive'}
            )
        )
        self.model_id = settings.bedrock_model_id
        logger.info(f"BedrockClient initialized with model: {self.model_id}")
    
    async def converse(
        self,
        messages: List[Dict],
        system_prompt: Optional[str] = None,
        tools: Optional[List[Dict]] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict:
        """
        Bedrock Converse API 호출
        
        Args:
            messages: 대화 메시지 리스트 [{"role": "user", "content": [{"text": "..."}]}]
            system_prompt: 시스템 프롬프트 (선택)
            tools: Tool Use 정의 (선택)
            temperature: 창의성 조절 (0.0~1.0)
            max_tokens: 최대 토큰 수
        
        Returns:
            Bedrock 응답 딕셔너리
        """
        try:
            settings = get_settings()
            
            # 기본값 설정
            if temperature is None:
                temperature = settings.bedrock_temperature
            if max_tokens is None:
                max_tokens = settings.bedrock_max_tokens
            
            # 요청 파라미터 구성
            request_params = {
                "modelId": self.model_id,
                "messages": messages,
                "inferenceConfig": {
                    "temperature": temperature,
                    "maxTokens": max_tokens
                }
            }
            
            # 시스템 프롬프트 추가
            if system_prompt:
                request_params["system"] = [{"text": system_prompt}]
            
            # Tool Use 추가
            if tools:
                request_params["toolConfig"] = {"tools": tools}
            
            logger.info(f"[Bedrock] Calling Converse API")
            logger.info(f"  Model: {self.model_id}")
            logger.info(f"  Messages: {len(messages)}")
            logger.info(f"  Tools: {len(tools) if tools else 0}")
            logger.info(f"  Temperature: {temperature}")
            logger.info(f"  Max Tokens: {max_tokens}")
            
            # Bedrock 호출
            response = self.client.converse(**request_params)
            
            stop_reason = response.get('stopReason')
            logger.info(f"[Bedrock] Response received")
            logger.info(f"  Stop Reason: {stop_reason}")
            logger.info(f"  Usage: {response.get('usage', {})}")
            
            return response
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Bedrock ClientError: {error_code} - {error_message}")
            raise Exception(f"Bedrock API 호출 실패: {error_message}")
        
        except Exception as e:
            logger.error(f"Unexpected error in Bedrock call: {str(e)}", exc_info=True)
            raise Exception(f"Bedrock 호출 중 오류 발생: {str(e)}")
    
    def extract_text(self, response: Dict) -> str:
        """
        Bedrock 응답에서 텍스트 추출
        
        Args:
            response: Bedrock Converse API 응답
        
        Returns:
            추출된 텍스트
        """
        try:
            output = response.get('output', {})
            message = output.get('message', {})
            content = message.get('content', [])
            
            # 첫 번째 텍스트 블록 추출
            for block in content:
                if 'text' in block:
                    return block['text']
            
            return ""
        
        except Exception as e:
            logger.error(f"Failed to extract text from response: {e}")
            return ""
    
    def has_tool_use(self, response: Dict) -> bool:
        """
        Bedrock 응답에 Tool Use가 포함되어 있는지 확인
        
        Args:
            response: Bedrock Converse API 응답
        
        Returns:
            Tool Use 포함 여부
        """
        try:
            output = response.get('output', {})
            message = output.get('message', {})
            content = message.get('content', [])
            
            for block in content:
                if 'toolUse' in block:
                    return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to check tool use: {e}")
            return False
    
    def extract_tool_use(self, response: Dict) -> Optional[Dict]:
        """
        Bedrock 응답에서 Tool Use 정보 추출
        
        Args:
            response: Bedrock Converse API 응답
        
        Returns:
            Tool Use 정보 (toolUseId, name, input)
        """
        try:
            output = response.get('output', {})
            message = output.get('message', {})
            content = message.get('content', [])
            
            for block in content:
                if 'toolUse' in block:
                    tool_use = block['toolUse']
                    return {
                        'toolUseId': tool_use.get('toolUseId'),
                        'name': tool_use.get('name'),
                        'input': tool_use.get('input', {})
                    }
            
            return None
        
        except Exception as e:
            logger.error(f"Failed to extract tool use: {e}")
            return None
    
    def parse_json_response(self, text: str) -> Dict:
        """
        AI 응답에서 JSON 파싱
        
        Args:
            text: AI가 생성한 텍스트
        
        Returns:
            파싱된 JSON 딕셔너리
        """
        try:
            # JSON 블록 추출 (```json ... ``` 형식 처리)
            if '```json' in text:
                start = text.find('```json') + 7
                end = text.find('```', start)
                json_str = text[start:end].strip()
            elif '```' in text:
                start = text.find('```') + 3
                end = text.find('```', start)
                json_str = text[start:end].strip()
            else:
                json_str = text.strip()
            
            return json.loads(json_str)
        
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}\nText: {text}")
            raise Exception(f"AI 응답 JSON 파싱 실패: {str(e)}")
