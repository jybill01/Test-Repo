/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI Plan Result Types
 */

export interface TaskItem {
    content: string;
    targetDate: string; // Format: "YYYY-MM-DD"
}

export interface WeekGoal {
    title: string;
    tasks: TaskItem[];
}

export interface PlanData {
    goal: {
        weekGoals: WeekGoal[];
    };
    categoryName?: string; // 백엔드에서 생성된 카테고리명 (선택적 필드)
}
