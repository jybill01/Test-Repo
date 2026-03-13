/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClients } from '../../../api/base';
import type { Trend, Goal, CategoryTrendsResponse, TrendGoalsResponse } from '../types/trend.types';

/**
 * Trend Service for fetching category trends and trend goals
 */
class TrendServiceImpl {
    /**
     * Fetch trends for a specific category
     * @param categoryId - Category ID to fetch trends for
     * @returns Promise resolving to array of Trend objects with categoryName
     */
    async getCategoryTrends(categoryId: number): Promise<Trend[]> {
        try {
            const response = await apiClients.intelligence.get<CategoryTrendsResponse>(
                `/api/v1/categories/${categoryId}/trends`
            );
            const categoryData = response.data.data;

            // Add categoryName to each trend
            return categoryData.trends.map(trend => ({
                ...trend,
                categoryName: categoryData.categoryName
            }));
        } catch (error) {
            console.error(`[TrendService] Failed to fetch trends for category ${categoryId}:`, error);
            return [];
        }
    }

    /**
     * Fetch goals for a specific trend
     * @param trendId - Trend ID to fetch goals for
     * @returns Promise resolving to array of Goal objects
     */
    async getTrendGoals(trendId: number): Promise<Goal[]> {
        try {
            const response = await apiClients.intelligence.get<TrendGoalsResponse>(
                `/api/v1/trends/${trendId}/goals`
            );
            return response.data.data;
        } catch (error) {
            console.error(`[TrendService] Failed to fetch goals for trend ${trendId}:`, error);
            return [];
        }
    }
}

export const trendService = new TrendServiceImpl();
