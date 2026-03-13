/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseApiService, apiClients } from './base';

/**
 * 통계 기간 타입
 */
export type StatsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * 요일 타입
 */
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

/**
 * 완료율 통계 타입
 */
export interface CompletionStats {
  period: StatsPeriod;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * 카테고리별 통계 타입
 */
export interface CategoryStats {
  category: string;
  count: number;
  completionRate: number;
  averageTime?: number;
}

/**
 * 생산성 리포트 타입
 */
export interface ProductivityReport {
  period: string;
  completionStats: CompletionStats;
  categoryStats: CategoryStats[];
  mostProductiveDay: string;
  mostProductiveTime: string;
  insights: string[];
  recommendations: string[];
}

/**
 * 목표 달성률 타입
 */
export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetCount: number;
  currentCount: number;
  progress: number;
  daysRemaining: number;
}

/**
 * 성장 피드백 타입
 */
export interface GrowthFeedback {
  topicName: string;
  growthRate: number;
  message: string;
}

/**
 * 요일별 패턴 차트 데이터 타입
 */
export interface PatternChartData {
  day: DayOfWeek;
  total: number;
  completed: number;
  postponed: number;
}

/**
 * 리포트 타입
 */
export type ReportType = 'GROWTH' | 'TIMELINE' | 'PATTERN' | 'SUMMARY';

/**
 * Growth 리포트 응답 타입
 */
export interface GrowthReport {
  type: 'GROWTH';
  message: string;
  topicName: string;
  growthRate: number;
  generatedAt: string;
}

/**
 * Timeline 차트 데이터 타입
 */
export interface TimelineChartData {
  month: string;
  completionRate: number;
}

/**
 * Timeline 리포트 응답 타입
 */
export interface TimelineReport {
  type: 'TIMELINE';
  message: string;
  chartData: TimelineChartData[];
  generatedAt: string;
}

/**
 * Pattern 리포트 응답 타입
 */
export interface PatternReport {
  type: 'PATTERN';
  message: string;
  chartData: PatternChartData[];
  worstDay: DayOfWeek;
  avgPostponeCount: number;
  generatedAt: string;
}

/**
 * Summary 리포트 응답 타입
 */
export interface SummaryReport {
  type: 'SUMMARY';
  message: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  generatedAt: string;
}

/**
 * 피드백 대시보드 응답 타입 (API 명세서 기준)
 */
export interface FeedbackDashboard {
  targetPeriod: {
    month: string;
    week: number;
  };
  feedbacks: {
    growth: GrowthReport;
    timeline: TimelineReport;
    pattern: PatternReport;
    summary: SummaryReport;
  };
}

/**
 * 일간 응원 피드백 타입 (API 명세서 기준)
 */
export interface DailyCheerFeedback {
  message: string;
  dayOfWeek: DayOfWeek;
  performanceRate: number;
  comparisonToAverage: number;
}

/**
 * Insight Service API
 * 통계, 리포트, 인사이트 제공을 담당
 */
class InsightService extends BaseApiService {
  constructor() {
    super(apiClients.insight);
  }

  /**
   * AI 피드백 대시보드 전체 조회
   * 성장 격려, 타임라인, 미룸 패턴, 종합 피드백을 한 번에 조회
   * 
   * @param yearMonth - 대상 월 (예: "2026-02")
   * @param week - 대상 주차 (예: 9)
   * @returns FeedbackDashboard
   */
  async getFeedbackDashboard(yearMonth: string, week: number): Promise<FeedbackDashboard> {
    // BaseApiService.get()이 이미 response.data.data를 반환함
    return this.get<FeedbackDashboard>('/api/v1/feedbacks/dashboard', {
      params: { yearMonth, week },
    });
  }

  /**
   * 일간 응원 피드백 조회
   * 홈 화면 상단에 띄워줄 오늘의 요일별 수행률 기반 AI 응원 메시지
   * 
   * @returns DailyCheerFeedback
   */
  async getDailyCheerFeedback(): Promise<DailyCheerFeedback> {
    // BaseApiService.get()이 이미 response.data.data를 반환함
    return this.get<DailyCheerFeedback>('/api/v1/feedbacks/daily-cheer');
  }

  /**
   * 완료율 통계 조회
   */
  async getCompletionStats(period: StatsPeriod, startDate?: string, endDate?: string): Promise<CompletionStats> {
    return this.get<CompletionStats>('/api/v1/stats/completion', {
      params: { period, startDate, endDate },
    });
  }

  /**
   * 카테고리별 통계 조회
   */
  async getCategoryStats(startDate: string, endDate: string): Promise<CategoryStats[]> {
    return this.get<CategoryStats[]>('/api/v1/stats/categories', {
      params: { startDate, endDate },
    });
  }

  /**
   * 생산성 리포트 조회
   */
  async getProductivityReport(period: StatsPeriod, date?: string): Promise<ProductivityReport> {
    return this.get<ProductivityReport>('/api/v1/reports/productivity', {
      params: { period, date },
    });
  }

  /**
   * 주간 요약 리포트
   */
  async getWeeklySummary(weekStartDate: string): Promise<ProductivityReport> {
    return this.get<ProductivityReport>('/api/v1/reports/weekly', {
      params: { startDate: weekStartDate },
    });
  }

  /**
   * 월간 요약 리포트
   */
  async getMonthlySummary(year: number, month: number): Promise<ProductivityReport> {
    return this.get<ProductivityReport>('/api/v1/reports/monthly', {
      params: { year, month },
    });
  }

  /**
   * 목표 달성률 조회
   */
  async getGoalProgress(): Promise<GoalProgress[]> {
    return this.get<GoalProgress[]>('/api/v1/goals/progress');
  }

  /**
   * 친구와의 비교 통계
   */
  async getComparisonStats(friendId: string, period: StatsPeriod): Promise<any> {
    return this.get<any>(`/api/v1/stats/compare/${friendId}`, {
      params: { period },
    });
  }

  /**
   * 개인화된 인사이트 조회
   */
  async getPersonalInsights(): Promise<string[]> {
    return this.get<string[]>('/api/v1/insights/personal');
  }

  /**
   * 트렌드 분석
   */
  async getTrendAnalysis(startDate: string, endDate: string): Promise<any> {
    return this.get<any>('/api/v1/insights/trends', {
      params: { startDate, endDate },
    });
  }
}

export const insightService = new InsightService();
