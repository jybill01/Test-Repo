/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskItem } from '../types/aiPlan.types';

/**
 * Formats a date string from "YYYY-MM-DD" to "MM/DD" format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (MM/DD) or fallback "날짜 없음"
 */
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '날짜 없음';
        }
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
    } catch {
        return '날짜 없음';
    }
};

/**
 * Groups tasks by their target date
 * @param tasks - Array of task items
 * @returns Map of date strings to task arrays, sorted chronologically
 */
export const groupTasksByDate = (tasks: TaskItem[]): Map<string, TaskItem[]> => {
    const grouped = new Map<string, TaskItem[]>();

    tasks.forEach(task => {
        const existing = grouped.get(task.targetDate) || [];
        grouped.set(task.targetDate, [...existing, task]);
    });

    // Sort dates chronologically
    return new Map([...grouped.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
    ));
};
