/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Goal } from '../types/trend.types';

interface GoalButtonProps {
    goal: Goal;
    onClick: () => void;
}

/**
 * Goal Button component
 * Displays a goal title and populates AI prompt on click
 */
export const GoalButton: React.FC<GoalButtonProps> = ({ goal, onClick }) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-1.5 bg-white border border-gray-100 text-xs font-medium text-gray-700 rounded-xl hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
            role="button"
            tabIndex={0}
        >
            {goal.title}
        </button>
    );
};
