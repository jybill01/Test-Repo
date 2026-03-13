/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseApiService, apiClients } from './base';
import { Task } from '../types';

/**
 * AI 플랜 생성 요청 타입
 */
export interface IntelligenceGeneratePlanRequest {
  keywords: string[];
  date: string;
  preferences?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    duration?: number; // 분 단위
    categories?: string[];
  };
}

/**
 * AI 플랜 응답 타입
 */
export interface AiPlanResponse {
  tasks: Task[];
  summary: string;
  estimatedTime: number;
}

/**
 * 추천 카테고리 타입
 */
export interface RecommendedCategory {
  name: string;
  confidence: number;
  reason: string;
}

/**
 * Intelligence Service API
 * AI 기반 할일 생성, 추천 등을 담당
 */
class IntelligenceService extends BaseApiService {
  constructor() {
    super(apiClients.intelligence);
  }

  /**
   * AI 기반 할일 플랜 생성
   */
  async generatePlan(request: IntelligenceGeneratePlanRequest): Promise<AiPlanResponse> {
    return this.post<AiPlanResponse>('/api/v1/ai/generate-plan', request);
  }

  /**
   * 키워드 기반 할일 추천
   */
  async recommendTasks(keywords: string[]): Promise<Task[]> {
    return this.post<Task[]>('/api/v1/ai/recommend', { keywords });
  }

  /**
   * 할일 자동 분류 (카테고리 추천)
   */
  async categorizeTask(taskText: string): Promise<RecommendedCategory[]> {
    return this.post<RecommendedCategory[]>('/api/v1/ai/categorize', { text: taskText });
  }

  /**
   * 사용자 패턴 기반 최적 시간 추천
   */
  async suggestOptimalTime(taskText: string, category: string): Promise<string> {
    return this.post<string>('/api/v1/ai/suggest-time', { text: taskText, category });
  }

  /**
   * 할일 우선순위 분석
   */
  async analyzePriority(tasks: Task[]): Promise<Task[]> {
    return this.post<Task[]>('/api/v1/ai/analyze-priority', { tasks });
  }

  /**
   * 스마트 할일 재배치
   */
  async rearrangeTasks(tasks: Task[], constraints?: any): Promise<Task[]> {
    return this.post<Task[]>('/api/v1/ai/rearrange', { tasks, constraints });
  }
}

export const intelligenceService = new IntelligenceService();
