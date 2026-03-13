/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { trendService } from '../services/trend.service';
import type { Goal } from '../types/trend.types';

interface UseTrendGoalsReturn {
    goals: Goal[];
    loading: boolean;
    error: string | null;
}

/**
 * Custom hook to lazily fetch goals for a specific trend
 * Fetches goals when the component mounts
 * @param trendId - The ID of the trend to fetch goals for
 */
export const useTrendGoals = (trendId: number): UseTrendGoalsReturn => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                setLoading(true);
                setError(null);

                const fetchedGoals = await trendService.getTrendGoals(trendId);
                setGoals(fetchedGoals);
            } catch (err) {
                console.error(`[useTrendGoals] Failed to fetch goals for trend ${trendId}:`, err);
                setError('목표를 불러올 수 없습니다');
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, [trendId]);

    return { goals, loading, error };
};
