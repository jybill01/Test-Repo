/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TaskItem } from '../types/aiPlan.types';
import { formatDate } from '../utils/dateUtils';

interface DateGroupProps {
    date: string; // Format: "YYYY-MM-DD"
    tasks: TaskItem[];
}

const DateGroup: React.FC<DateGroupProps> = ({ date, tasks }) => {
    return (
        <div className="space-y-2">
            {/* Date Header */}
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {formatDate(date)}
            </h5>

            {/* Task List */}
            <div className="space-y-2">
                {tasks?.map((task, index) => (
                    <div
                        key={index}
                        className="glass-card p-3 rounded-xl bg-white/50"
                    >
                        <span className="text-xs font-medium text-gray-700">
                            {task.content}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DateGroup;
