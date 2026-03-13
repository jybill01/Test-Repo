/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeekGoal } from '../types/aiPlan.types';
import { groupTasksByDate } from '../utils/dateUtils';
import DateGroup from './DateGroup';

interface WeekGoalCardProps {
    weekGoal: WeekGoal;
    weekNumber: number;
}

const WeekGoalCard: React.FC<WeekGoalCardProps> = ({ weekGoal, weekNumber }) => {
    const dateGroups = groupTasksByDate(weekGoal?.tasks || []);

    return (
        <div className="glass-card p-4 rounded-2xl space-y-4">
            {/* Week Title */}
            <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-[60px] text-center whitespace-nowrap bg-primary/10 text-primary text-xs font-semibold rounded-xl px-2 py-1">
                    {weekNumber}주차
                </span>
                <h4 className="text-sm font-bold text-gray-800">
                    {weekGoal?.title}
                </h4>
            </div>

            {/* Date Groups */}
            <div className="space-y-4">
                {Array.from(dateGroups.entries()).map(([date, tasks]) => (
                    <DateGroup key={date} date={date} tasks={tasks} />
                ))}
            </div>
        </div>
    );
};

export default WeekGoalCard;
