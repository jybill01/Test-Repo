/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTrendGoals } from '../hooks/useTrendGoals';
import { GoalButton } from './GoalButton';
import type { Trend } from '../types/trend.types';

interface TrendCardProps {
    trend: Trend;
    onGoalClick: (goalTitle: string) => void;
}

/**
 * TrendCard component
 * Displays a single trend with headline, summary, and goal buttons
 */
export const TrendCard: React.FC<TrendCardProps> = ({ trend, onGoalClick }) => {
    const { goals, loading, error } = useTrendGoals(trend.trendId);

    return (
        <div className="w-full glass-card p-5 rounded-[32px] border-primary/10 bg-gradient-to-br from-white to-primary/5">
            {/* Category Name Badge */}
            <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg mb-2">
                {trend.categoryName || trend.mainKeyword}
            </div>

            {/* Headline */}
            <h4 className="text-sm font-bold">{trend.headline}</h4>

            {/* Summary */}
            <p className="text-xs text-gray-600 mt-1">{trend.summary}</p>

            {/* Goals section */}
            {loading && (
                <div className="mt-3 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">목표 불러오는 중...</span>
                </div>
            )}

            {error && (
                <p className="mt-3 text-xs text-red-500">{error}</p>
            )}

            {!loading && !error && goals.length > 0 && (
                <div className="flex flex-col gap-2 mt-3">
                    {goals.map((goal) => (
                        <GoalButton
                            key={goal.goalId}
                            goal={goal}
                            onClick={() => onGoalClick(goal.title)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
