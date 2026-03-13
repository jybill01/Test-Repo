/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseApiService, createApiClient, SERVICE_URLS } from './base';
import { PlanData } from '../features/tasks/types/aiPlan.types';

/**
 * AI 계획 생성 요청 타입
 */
export interface StrategyGeneratePlanRequest {
    goalText: string;
    startDate: string; // Format: "YYYY-MM-DD"
    endDate: string; // Format: "YYYY-MM-DD"
}

/**
 * AI 계획 저장 요청 타입
 */
export interface SavePlanRequest {
    categoryName: string;
    goal: {
        title: string;
        startDate: string;
        endDate: string;
        weekGoals: Array<{
            title: string;
            tasks: Array<{
                content: string;
                targetDate: string;
            }>;
        }>;
    };
}

/**
 * AI 계획 저장 응답 타입
 */
export interface SavePlanResponse {
    goalId: number;
}

/**
 * Strategy Service API
 * AI 기반 전략 및 계획 생성을 담당
 */
class StrategyService extends BaseApiService {
    constructor() {
        // Intelligence Service 환경 변수 사용
        // AI 생성은 시간이 오래 걸리므로 타임아웃을 60초로 설정
        const strategyClient = createApiClient(SERVICE_URLS.INTELLIGENCE);
        strategyClient.defaults.timeout = 60000; // 60초
        super(strategyClient);
    }

    /**
     * AI 계획 생성
     * @param request - 목표 텍스트 및 기간 정보
     * @returns AI가 생성한 주차별 계획 데이터 (categoryName 포함)
     */
    async generatePlan(request: StrategyGeneratePlanRequest): Promise<PlanData> {
        try {
            const response = await this.client.post('/api/v1/strategy/plans/generate', request);
            console.log('📦 Generate API Response:', response.data);

            // 백엔드 응답 구조에 따라 데이터 추출
            let planData: PlanData;

            if (response.data?.data) {
                planData = response.data.data;
            } else if (response.data?.goal) {
                planData = response.data;
            } else {
                planData = response.data;
            }

            // categoryName 필드 추출 및 보존
            if (response.data?.categoryName) {
                planData.categoryName = response.data.categoryName;
                console.log('✅ CategoryName 추출됨:', response.data.categoryName);
            } else if (response.data?.data?.categoryName) {
                planData.categoryName = response.data.data.categoryName;
                console.log('✅ CategoryName 추출됨 (nested):', response.data.data.categoryName);
            } else {
                console.log('⚠️ CategoryName이 백엔드 응답에 없음');
            }

            return planData;
        } catch (error) {
            console.error('❌ Generate Plan Error:', error);
            throw error;
        }
    }

    /**
     * AI 계획 저장
     * @param request - 저장할 계획 데이터
     * @returns 저장된 계획의 goalId
     */
    async savePlan(request: SavePlanRequest): Promise<SavePlanResponse> {
        try {
            const response = await this.client.post('/api/v1/strategy/plans/save', request, {
                headers: {
                    'X-User-Id': 'test-user'
                }
            });
            console.log('📦 Save API Response:', response.data);

            // 응답 구조에 따라 데이터 추출
            // 백엔드는 ApiResponse<Long> 반환 → data가 숫자이므로 {goalId} 객체로 래핑
            if (response.data?.data !== undefined) {
                return { goalId: response.data.data };
            }
            return response.data;
        } catch (error) {
            console.error('❌ Save Plan Error:', error);
            throw error;
        }
    }
}

export const strategyService = new StrategyService();
