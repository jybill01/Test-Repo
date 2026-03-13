/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { trendService } from '../services/trend.service';
import type { Trend } from '../types/trend.types';

interface UseTrendsReturn {
    trends: Trend[];
    loading: boolean;
    error: string | null;
}

/**
 * Custom hook to fetch trends for multiple categories in parallel
 * Fetches all categories at once to avoid multiple renders
 */
export const useTrends = (): UseTrendsReturn => {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all categories in parallel to avoid multiple renders
                const categoryIds = [1, 2, 3, 4, 5, 6, 7, 8];
                const responses = await Promise.all(
                    categoryIds.map((id) => trendService.getCategoryTrends(id))
                );

                // Flatten all responses into a single array
                const allTrends = responses.flat();

                // Update state only once
                setTrends(allTrends);
            } catch (err) {
                console.error('[useTrends] Failed to fetch trends:', err);
                setError('트렌드를 불러올 수 없습니다');
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, []);

    return { trends, loading, error };
};
