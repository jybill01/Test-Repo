/**
 * [PlanIt Strategy Service - Agent Exception]
 * Agent 실행 중 발생하는 예외
 * @since 2026-03-03
 */
package com.planit.strategy.agent;

public class AgentExecutionException extends Exception {
    public AgentExecutionException(String message) {
        super(message);
    }

    public AgentExecutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
