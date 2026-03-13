/**
 * [PlanIt Strategy Service - LLM Exception]
 * LLM 호출 중 발생하는 예외
 * @since 2026-03-03
 */
package com.planit.strategy.infrastructure.llm;

public class LlmException extends Exception {
    public LlmException(String message) {
        super(message);
    }

    public LlmException(String message, Throwable cause) {
        super(message, cause);
    }
}
