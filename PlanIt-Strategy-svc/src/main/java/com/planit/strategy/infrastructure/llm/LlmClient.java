/**
 * [PlanIt Strategy Service - LLM Client Interface]
 * LLM 호출 추상화 인터페이스
 * @since 2026-03-03
 */
package com.planit.strategy.infrastructure.llm;

public interface LlmClient {
    /**
     * LLM에 프롬프트를 전송하고 응답을 받음
     * @param systemPrompt 시스템 프롬프트
     * @param userPrompt 사용자 프롬프트
     * @return LLM 응답 텍스트
     * @throws LlmException LLM 호출 실패 시
     */
    String generate(String systemPrompt, String userPrompt) throws LlmException;
}
