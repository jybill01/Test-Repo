/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * API 모듈 통합 Export
 * MSA 구조의 4개 서비스를 중앙에서 관리
 */

// Base API 설정
export { apiClients, SERVICE_URLS, createApiClient, BaseApiService } from './base';
export type { ApiResponse, ApiError, LegacyApiResponse } from './base';

// User Service
export { userService, userApi, friendsApi } from './user.service';

// Schedule Service
export { scheduleService } from './schedule.service';
export type {
  CreateTaskRequest,
  UpdateTaskRequest,
  GoalApiResponse,
  GoalDetailApiResponse,
  BackendWeekGoal,
  CreateGoalApiRequest,
  CreateWeekGoalApiRequest,
  WeekGoalApiResponse,
} from './schedule.service';

// Intelligence Service
export { intelligenceService } from './intelligence.service';
export type {
  IntelligenceGeneratePlanRequest,
  AiPlanResponse,
  RecommendedCategory,
} from './intelligence.service';

// Insight Service
export { insightService } from './insight.service';
export type {
  StatsPeriod,
  DayOfWeek,
  CompletionStats,
  CategoryStats,
  ProductivityReport,
  GoalProgress,
  GrowthFeedback,
  TimelineChartData,
  PatternChartData,
  FeedbackDashboard,
  DailyCheerFeedback,
} from './insight.service';

// Chatbot Service
export { chatbotService } from './chatbot.service';
export type {
  ChatbotQueryRequest,
  ChatbotResponse,
} from './chatbot.service';

// Strategy Service
export { strategyService } from './strategy.service';
export type { StrategyGeneratePlanRequest } from './strategy.service';
