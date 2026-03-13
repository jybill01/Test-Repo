/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Trend interface matching backend API response
 */
export interface Trend {
    trendId: number;
    mainKeyword: string;
    headline: string;
    summary: string;
    score: number;
    categoryName?: string; // Optional: category name from API
}

/**
 * Goal interface matching backend API response
 */
export interface Goal {
    goalId: number;
    title: string;
    description: string;
}

/**
 * Category Trends Data structure from API
 */
export interface CategoryTrendsData {
    categoryId: number;
    categoryName: string;
    trends: Trend[];
}

/**
 * Generic API response structure from backend
 */
export interface ApiResponse<T> {
    code: string;
    message: string;
    data: T;
    timestamp?: string;
}

/**
 * Category Trends API response type
 */
export type CategoryTrendsResponse = ApiResponse<CategoryTrendsData>;

/**
 * Trend Goals API response type
 */
export type TrendGoalsResponse = ApiResponse<Goal[]>;

/**
 * Trend Service interface for type safety
 */
export interface TrendService {
    getCategoryTrends(categoryId: number): Promise<Trend[]>;
    getTrendGoals(trendId: number): Promise<Goal[]>;
}
