/**
 * [PlanIt Strategy Service - Agent Interface]
 * 전략 생성 Agent의 공통 인터페이스
 * @since 2026-03-03
 */
package com.planit.strategy.agent;

public interface StrategyAgent<I, O> {
    /**
     * Agent 실행
     * @param input 입력 데이터
     * @return 생성된 전략 데이터
     * @throws AgentExecutionException Agent 실행 실패 시
     */
    O execute(I input) throws AgentExecutionException;
}
