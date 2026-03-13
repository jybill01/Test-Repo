/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseApiService, apiClients } from './base';

// Types
export interface Category {
  categoryId: number;
  name: string;
  colorHex: string;
  description: string;
}

export interface UserProfile {
  userId: string;
  nickname: string;
  email: string;
  interests: Category[];
}

export interface SignupRequest {
  nickname: string;
  email: string;
  cognitoIdToken: string;
  agreedTermIds: number[];
  interestCategoryIds: number[];
  isRetentionAgreed: boolean;
}

export interface LoginRequest {
  cognitoIdToken: string;
}

export interface AuthResponse {
  userId: string;
  nickname: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

// ✅ 추가
export interface CheckWithdrawnRequest {
  cognitoIdToken: string;
}

// ✅ 추가
export interface CheckWithdrawnResponse {
  isRestricted: boolean;
  availableAt?: string; // 재가입 가능일 (90일 이내일 때만)
}

export interface UpdateProfileRequest {
  nickname: string;
  interestCategoryIds: number[];
}

export interface Friend {
  friendshipId: number;
  userId: string;
  nickname: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface FriendRequest {
  friendshipId: number;
  userId: string;
  nickname: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface ProcessFriendRequestRequest {
  friendshipId: number;
  status: 'ACCEPTED' | 'REJECTED';
}

export interface Term {
  termId: number;
  title: string;
  content: string;
  version: string;
  isRequired: boolean;
  type: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * User Service API
 * 사용자 인증, 프로필, 친구 관리 등을 담당
 */
class UserService extends BaseApiService {
  constructor() {
    super(apiClients.user);
  }

  // ========== 인증 API ==========

  async signup(request: SignupRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/v1/users/auth/signup', request);
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/v1/users/auth/login', request);
  }

  // ✅ 추가 - 탈퇴 유저 90일 재가입 제한 체크
  async checkWithdrawn(request: CheckWithdrawnRequest): Promise<CheckWithdrawnResponse> {
    return this.post<CheckWithdrawnResponse>('/api/v1/users/auth/check-withdrawn', request);
  }

  async withdraw(): Promise<void> {
    return this.delete<void>('/api/v1/users/auth/withdraw');
  }

  // ========== 프로필 API ==========

  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/v1/users/profile');
  }

  async updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    return this.put<UserProfile>('/api/v1/users/profile', request);
  }

  async searchUsers(nickname: string): Promise<UserProfile[]> {
    return this.get<UserProfile[]>('/api/v1/users/search', { params: { nickname } });
  }

  // ========== 친구 API ==========

  async sendFriendRequest(targetUserId: string): Promise<void> {
    return this.post<void>('/api/v1/users/friends/requests/send', { targetUserId });
  }

  async processFriendRequest(request: ProcessFriendRequestRequest): Promise<void> {
    return this.post<void>('/api/v1/users/friends/requests', request);
  }

  async getReceivedRequests(page = 0, size = 20): Promise<PageResponse<FriendRequest>> {
    return this.get<PageResponse<FriendRequest>>('/api/v1/users/friends/requests/received', { params: { page, size } });
  }

  async getFriends(page = 0, size = 20): Promise<PageResponse<Friend>> {
    return this.get<PageResponse<Friend>>('/api/v1/users/friends', { params: { page, size } });
  }

  async deleteFriend(friendshipId: number): Promise<void> {
    return this.delete<void>(`/api/v1/users/friends/${friendshipId}`);
  }

  // ========== 메타데이터 API ==========

  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/api/v1/users/categories');
  }

  async getTerms(type?: string): Promise<Term[]> {
    return this.get<Term[]>('/api/v1/users/terms', type ? { params: { type } } : undefined);
  }
}

export const userService = new UserService();

export const userApi = {
  signup: (request: SignupRequest) => userService.signup(request),
  login: (request: LoginRequest) => userService.login(request),
  checkWithdrawn: (request: CheckWithdrawnRequest) => userService.checkWithdrawn(request), // ✅ 추가
  withdraw: () => userService.withdraw(),
  getProfile: () => userService.getProfile(),
  updateProfile: (request: UpdateProfileRequest) => userService.updateProfile(request),
  searchUsers: (nickname: string) => userService.searchUsers(nickname),
  getCategories: () => userService.getCategories(),
  getTerms: (type?: string) => userService.getTerms(type),
};

export const friendsApi = {
  sendFriendRequest: (targetUserId: string) => userService.sendFriendRequest(targetUserId),
  processFriendRequest: (request: ProcessFriendRequestRequest) => userService.processFriendRequest(request),
  getReceivedRequests: (page?: number, size?: number) => userService.getReceivedRequests(page, size),
  getFriends: (page?: number, size?: number) => userService.getFriends(page, size),
  deleteFriend: (friendshipId: number) => userService.deleteFriend(friendshipId),
};
