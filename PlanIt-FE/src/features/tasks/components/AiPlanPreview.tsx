/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanData } from '../types/aiPlan.types';
import WeekGoalCard from './WeekGoalCard';

interface AiPlanPreviewProps {
    planData: PlanData;
    onAddTasks?: () => void;
    isSaving?: boolean;
}

const AiPlanPreview: React.FC<AiPlanPreviewProps> = ({ planData, onAddTasks, isSaving = false }) => {
    const weekGoals = planData?.goal?.weekGoals || [];

    if (weekGoals.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-5 rounded-[32px] border-primary/10"
            >
                <p className="text-xs text-gray-400 text-center">생성된 계획이 없습니다</p>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-5 rounded-[32px] border-primary/10 space-y-4 mb-6"
            >
                {/* Title */}
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-primary">AI 추천 계획</h3>
                </div>

                {/* Week Goal Cards */}
                <div className="space-y-4">
                    {weekGoals.map((weekGoal, index) => (
                        <WeekGoalCard
                            key={index}
                            weekGoal={weekGoal}
                            weekNumber={index + 1}
                        />
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={onAddTasks}
                    disabled={isSaving}
                    className="w-full py-3 bg-primary text-white text-[11px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? '저장 중...' : '추가'}
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default AiPlanPreview;
