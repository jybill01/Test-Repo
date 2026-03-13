import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Calendar as CalendarIcon, Check } from 'lucide-react';

import { useTasksContext } from '../context/TasksContext';
import { useAiPlan } from '../hooks/useAiPlan';
import AiPlanPreview from '../components/AiPlanPreview';
import { TrendRecommendations } from '../components/TrendRecommendations';

interface AiTodoPageProps {
  selectedKeywords: string[];
}

const AiTodoPage: React.FC<AiTodoPageProps> = ({
  selectedKeywords,
}) => {
  const { tasks, setTasks, loadTasks, loadGoals } = useTasksContext();
  
  // 계획 저장 성공 시 서버 데이터를 다시 불러오는 콜백
  const handleSaveSuccess = () => {
    const today = new Date().toISOString().split('T')[0];
    loadTasks(today);
    loadGoals();
  };

  const ai = useAiPlan(tasks, setTasks, handleSaveSuccess, selectedKeywords);
  const {
    aiStartDate,
    setAiStartDate,
    aiEndDate,
    setAiEndDate,
    aiPrompt,
    setAiPrompt,
    generateAiPlan,
    savePlan,
    isAiGenerating,
    isSaving,
    aiGeneratedTasks,
    planData,
    addAiTasksToMyList,
  } = ai;

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGoalClick = (goalTitle: string) => {
    setAiPrompt(goalTitle);
    // Focus the prompt textarea after populating
    promptTextareaRef.current?.focus();
  };

  return (
    <motion.div
      key="ai-todo"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="glass-card p-5 rounded-[32px] mb-6 border-primary/10 bg-gradient-to-br from-white to-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <Brain size={16} />
          </div>
          <h3 className="text-sm font-bold">AI 할일 생성</h3>
        </div>

        <div className="space-y-4">
          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1">시작일</label>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <CalendarIcon size={12} className="text-gray-400" />
                <input
                  type="date"
                  value={aiStartDate}
                  onChange={(e) => setAiStartDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-bold text-gray-600 w-full"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1">종료일</label>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <CalendarIcon size={12} className="text-gray-400" />
                <input
                  type="date"
                  value={aiEndDate}
                  onChange={(e) => setAiEndDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-bold text-gray-600 w-full"
                />
              </div>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="relative">
            <textarea
              ref={promptTextareaRef}
              placeholder="목표를 입력하세요 (예: 한 달 만에 5kg 감량)"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full h-24 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium outline-none focus:border-primary/30 transition-all resize-none placeholder:text-gray-300"
            />
            <button
              onClick={generateAiPlan}
              disabled={isAiGenerating || !aiPrompt}
              className="absolute bottom-3 right-3 px-4 py-2 bg-primary text-white text-[11px] font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isAiGenerating ? '생성 중...' : '계획 생성'}
            </button>
          </div>



          {/* Generated Preview */}
          <AnimatePresence>
            {aiGeneratedTasks.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold text-primary mb-2">AI 추천 계획</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                    {aiGeneratedTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600 font-medium bg-primary/5 p-2 rounded-lg">
                        <Check size={12} className="text-primary" />
                        {task}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addAiTasksToMyList}
                    className="w-full py-3 bg-primary/10 text-primary text-[11px] font-bold rounded-xl mt-2 hover:bg-primary hover:text-white transition-all"
                  >
                    내 할일 추가
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Plan Preview */}
      {planData && (
        <AiPlanPreview
          planData={planData}
          onAddTasks={savePlan}
          isSaving={isSaving}
        />
      )}

      {/* Trend Recommendations - Separate Section */}
      <TrendRecommendations setAiPrompt={handleGoalClick} />
    </motion.div>
  );
};

export default AiTodoPage;
