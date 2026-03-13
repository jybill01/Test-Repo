import React from 'react';
import { X } from 'lucide-react';
import { useTasksContext } from '../context/TasksContext';

interface AddTaskFormProps {
  date: string;
  selectedKeywords: string[];
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ date, selectedKeywords }) => {
  const {
    newTaskText, setNewTaskText, newTaskCategory, setNewTaskCategory,
    addTask, cancelAddingTask,
    // Task with Goal
    hasGoal, setHasGoal, selectedGoalId, setSelectedGoalId,
    selectedWeekIndex, setSelectedWeekIndex,
    // Monthly Goal
    monthlyGoals
  } = useTasksContext();

  // 목표 시작일 기준으로 현재 날짜(date)가 몇 번째 주차인지 계산 (0-based)
  const calcWeekIndex = (goalStartDate: string, currentDate: string): number => {
    const start = new Date(goalStartDate);
    const current = new Date(currentDate);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(diffDays / 7));
  };

  // Get selected goal's weekly goals
  const selectedGoal = monthlyGoals.find(g => g.id === selectedGoalId);
  const weeklyGoalsOptions = selectedGoal?.weeklyGoals || [];

  // 자동 계산된 주차의 주간 목표 텍스트
  const autoWeekLabel =
    selectedGoal && selectedWeekIndex !== null && weeklyGoalsOptions[selectedWeekIndex]
      ? `${selectedWeekIndex + 1}주차: ${weeklyGoalsOptions[selectedWeekIndex]}`
      : selectedGoal && selectedWeekIndex !== null
        ? `${selectedWeekIndex + 1}주차`
        : null;

  return (
    <div className="glass-card p-4 rounded-2xl border-2 border-dashed border-primary/30 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-primary">새로운 할 일 추가</h4>
        <button
          onClick={cancelAddingTask}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      {/* Goal Toggle */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 ml-1">목표 연동</label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setHasGoal(false);
              setSelectedGoalId('');
              setSelectedWeekIndex(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${!hasGoal
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
          >
            목표 없음
          </button>
          <button
            onClick={() => setHasGoal(true)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${hasGoal
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
          >
            목표 있음
          </button>
        </div>
      </div>

      {/* Goal Selection (목표 있음 모드에서만) */}
      {hasGoal && (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 ml-1">전체 목표</label>
            <select
              value={selectedGoalId}
              onChange={(e) => {
                const goalId = e.target.value;
                setSelectedGoalId(goalId);
                const goal = monthlyGoals.find(g => g.id === goalId);
                if (goal && goalId) {
                  setSelectedWeekIndex(calcWeekIndex(goal.startDate, date));
                } else {
                  setSelectedWeekIndex(null);
                }
              }}
              className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs outline-none focus:border-primary transition-all"
            >
              <option value="">목표를 선택하세요</option>
              {monthlyGoals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {(() => {
                    console.log('🖥 AddTaskForm 목표 옵션 카테고리 표시:', {
                      goalId: goal.id,
                      goalTitle: goal.title,
                      displayedCategory: goal.category,
                      fullGoal: goal
                    });
                    return `${goal.title} (${goal.category})`;
                  })()}
                </option>
              ))}
            </select>
          </div>
          {selectedGoalId && autoWeekLabel && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 ml-1">주간 목표</label>
              <div className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs text-gray-600">
                {autoWeekLabel}
              </div>
            </div>
          )}
        </>
      )}

      {/* Category Selection (목표 없음 모드에서만) */}
      {!hasGoal && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 ml-1">관심 키워드</label>
          <div className="flex flex-wrap gap-1.5">
            {selectedKeywords.map(cat => (
              <button
                key={cat}
                onClick={() => setNewTaskCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${newTaskCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task Text Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 ml-1">할 일 내용</label>
        <input
          autoFocus
          placeholder="할 일을 입력하세요"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask(date)}
          className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 text-sm outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={cancelAddingTask}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-all"
        >
          취소
        </button>
        <button
          onClick={() => addTask(date)}
          disabled={!newTaskText.trim() || (hasGoal && !selectedGoalId)}
          className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          추가
        </button>
      </div>
    </div>
  );
};

export default AddTaskForm;
