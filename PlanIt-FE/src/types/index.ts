export interface Task {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  category: string;
  goalId?: string; // 연결된 목표 ID (optional)
  weekIndex?: number; // 연결된 주차 인덱스 (optional)
}

export interface MonthlyGoal {
  id: string;
  title: string;
  category: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weeklyGoals: string[];
}

export interface Friend {
  id: string;
  nickname: string;
  tasks: Task[];
}

export interface FriendRequest {
  id: string;
  nickname: string;
}

export type ViewMode = 'daily' | 'weekly' | 'goals';
export type Tab = 'friends' | 'todo' | 'home' | 'mypage' | 'report' | 'ai-todo';

export interface UserProfile {
  id: string;
  nickname: string;
  keywords: string[];
  email: string;
}

// API 타입 정의
export interface Category {
  categoryId: number;
  name: string;
  colorCode: string; // 색상 코드
  colorHex?: string; // 호환성을 위한 별칭
  description?: string;
}

export interface SignupRequest {
  nickname: string;
  email: string;
  cognitoIdToken: string;
  agreedTermIds: number[];
  interestCategoryIds: number[];
  isRetentionAgreed: boolean;
}

export interface UpdateProfileRequest {
  nickname: string;
  interestCategoryIds: number[];
}

export interface ProcessFriendRequestRequest {
  friendshipId: number;
  action: 'ACCEPTED' | 'REJECTED';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 현재 페이지 번호 (0-based)
  first: boolean;
  last: boolean;
  empty: boolean;
}
