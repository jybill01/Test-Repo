/**
 * tasks 기능 전용 타입
 *
 * develop 템플릿의 src/types/index.ts는 원본 그대로 유지하고,
 * 백엔드 연동에 필요한 추가 필드는 이 파일에서만 관리합니다.
 */

import { BackendWeekGoal } from '../../api/schedule.service';

/** 백엔드 연동 확장 Task */
export interface Task {
    id: string;
    text: string;
    date: string;        // YYYY-MM-DD
    completed: boolean;
    category: string;
    goalId?: string;     // 연결된 목표 ID
    weekIndex?: number;  // 연결된 주차 인덱스
    // 백엔드 연동 필드
    taskId?: number;     // 백엔드 실제 PK (Long)
    weekGoalsId?: number; // 연결된 주간 목표 PK
}

/** 백엔드 연동 확장 MonthlyGoal */
export interface MonthlyGoal {
    id: string;
    title: string;
    category: string;
    startDate: string;   // YYYY-MM-DD
    endDate: string;     // YYYY-MM-DD
    weeklyGoals: string[];
    // 백엔드 연동 필드
    goalsId?: number;                     // 백엔드 PK
    backendWeekGoals?: BackendWeekGoal[];  // 주차별 백엔드 데이터 (weekGoalsId 포함)
    progressRate?: number;                // 백엔드 계산 진행률 (0~100)
}

export type { BackendWeekGoal };
