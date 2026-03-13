/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseApiService, apiClients } from './base';

// ─── 백엔드 응답 타입 ─────────────────────────────────────────────────────────

export interface DailyTaskItem {
  taskId: number;
  weekGoalsId: number | null;
  weekGoalsTitle: string | null;
  goalTitle: string | null;
  category: string;
  content: string;
  complete: boolean;
  targetDate: string;
}

export interface DailyTaskResponse {
  targetDate: string;
  totalCount: number;
  completedCount: number;
  progressRate: number;
  tasks: DailyTaskItem[];
}

export interface TaskResponse {
  taskId: number;
  weekGoalsId: number | null;
  content: string;
  complete: boolean;
  category: string;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalResponse {
  goalsId: number;
  title: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface BackendWeekGoal {
  weekGoalsId: number;
  title: string;
  progressRate?: number;
}

export interface GoalDetailApiResponse {
  goalsId: number;
  title: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  progressRate?: number;
  weekGoals: BackendWeekGoal[];
}

export interface EmojiItem {
  emojiId: string;
  count: number;
  myReaction: boolean;
}

export interface FriendTaskItem {
  taskId: number;
  content: string;
  complete: boolean;
  targetDate: string;
  category: string;
  weekGoalsId: number | null;
  weekGoalsTitle: string | null;
  goalTitle: string | null;
  emojis: EmojiItem[];
}

export interface FriendTaskResponse {
  friendUserId: string;
  targetDate: string;
  tasks: FriendTaskItem[];
}

export interface EmojiResponse {
  emojiId: number;
  emojiChar: string;
  name: string;
}

export interface TaskEmojiGroupResponse {
  emojiId: number;
  emojiChar: string;
  name: string;
  count: number;
  myReaction: boolean;
  userIds: string[];
  nicknames: string[];
}

export interface TaskReactionListResponse {
  taskId: number;
  reactions: TaskEmojiGroupResponse[];
}

// ─── Request DTOs ──────────────────────────────────────────────────────────

export interface CreateTaskRequest {
  content: string;
  targetDate: string;
  category?: string;
  weekGoalsId?: number;
  userId?: string;
}

export interface UpdateTaskRequest {
  content: string;
}

export interface CreateGoalApiRequest {
  title: string;
  category: string;
  startDate: string;
  endDate: string;
}

export interface CreateWeekGoalApiRequest {
  title: string;
}

// ─── Schedule Service ────────────────────────────────────────────────────────

class ScheduleService extends BaseApiService {
  constructor() {
    super(apiClients.schedule);
  }

  // 할 일 관련
  async getDailyTasks(targetDate: string): Promise<DailyTaskResponse> {
    return this.get<DailyTaskResponse>('/api/v1/schedules/tasks/daily', {
      params: { targetDate },
    });
  }

  async createTask(req: CreateTaskRequest): Promise<TaskResponse> {
    return this.post<TaskResponse>('/api/v1/schedules/tasks', req);
  }

  async updateTask(taskId: number, req: UpdateTaskRequest): Promise<any> {
    return this.patch<any>(`/api/v1/schedules/tasks/${taskId}`, req);
  }

  async toggleTaskCompletion(taskId: number): Promise<any> {
    return this.post<any>(`/api/v1/schedules/tasks/${taskId}/toggle`, {});
  }

  async deleteTask(taskId: number): Promise<void> {
    return this.delete<void>(`/api/v1/schedules/tasks/${taskId}`);
  }

  async postponeTask(taskId: number): Promise<any> {
    return this.post<any>(`/api/v1/schedules/tasks/${taskId}/postpone`, {});
  }

  // 친구 할 일
  async getFriendTasks(friendUserId: string, targetDate: string): Promise<FriendTaskResponse> {
    return this.get<FriendTaskResponse>(`/api/v1/schedules/tasks/friend/${friendUserId}`, {
      params: { targetDate },
    });
  }

  // 목표 관련
  async getGoals(): Promise<GoalResponse[]> {
    return this.get<GoalResponse[]>('/api/v1/schedules/goals');
  }

  async createGoal(req: CreateGoalApiRequest): Promise<GoalResponse> {
    return this.post<GoalResponse>('/api/v1/schedules/goals', req);
  }

  async deleteGoal(goalsId: number): Promise<void> {
    return this.delete<void>(`/api/v1/schedules/goals/${goalsId}`);
  }

  async getGoalDetail(goalsId: number): Promise<GoalDetailApiResponse> {
    return this.get<GoalDetailApiResponse>(`/api/v1/schedules/goals/${goalsId}`);
  }

  async createWeekGoal(goalsId: number, req: CreateWeekGoalApiRequest): Promise<any> {
    return this.post<any>(`/api/v1/schedules/goals/${goalsId}/week-goals`, req);
  }

  // 이모지 리액션
  async getEmojiList(): Promise<EmojiResponse[]> {
    return this.get<EmojiResponse[]>('/api/v1/schedules/emojis');
  }

  async getTaskReactions(taskId: number): Promise<TaskReactionListResponse> {
    return this.get<TaskReactionListResponse>(`/api/v1/schedules/tasks/${taskId}/emojis`);
  }

  async addEmojiReaction(taskId: number, req: { emojiId: number }): Promise<any> {
    return this.post<any>(`/api/v1/schedules/tasks/${taskId}/emojis`, req);
  }

  async deleteEmojiReaction(taskId: number, emojiId: number): Promise<void> {
    return this.delete<void>(`/api/v1/schedules/tasks/${taskId}/emojis/${emojiId}`);
  }
}

export const scheduleService = new ScheduleService();
