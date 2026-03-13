import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar as CalendarIcon, X, Check, MoreVertical, Edit2, ArrowRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ViewMode } from '../../../types';
import { Task } from '../types';
import { useTasksContext } from '../context/TasksContext';
import AddTaskForm from '../components/AddTaskForm';

const DB_CATEGORIES = ['직무/커리어', '어학/자격증', '독서/학습', '건강/운동', '재테크/경제', '마인드/루틴', '취미/관계', '기타'];

interface TodoPageProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  today: string;
  selectedKeywords: string[];
}

const TodoPage: React.FC<TodoPageProps> = ({
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  today,
  selectedKeywords,
}) => {
  const task = useTasksContext();
  const {
    tasks, editingTaskId, setEditingTaskId, newTaskText, setNewTaskText,
    newTaskCategory, setNewTaskCategory, isAddingTask, setIsAddingTask,
    activeMenuId, setActiveMenuId, addTask, updateTask, deleteTask,
    toggleComplete, postponeTask, cancelAddingTask,
    reactionsMap,
    setCurrentDate, loadTasks, refreshReactions,
    // Task with Goal
    hasGoal, setHasGoal, selectedGoalId, setSelectedGoalId,
    selectedWeekIndex, setSelectedWeekIndex,
    // Monthly Goal
    monthlyGoals, isAddingGoal, setIsAddingGoal, newGoalTitle, setNewGoalTitle,
    newGoalCategory, setNewGoalCategory, newGoalStartDate, setNewGoalStartDate,
    newGoalEndDate, setNewGoalEndDate, newGoalWeeklyGoals, setNewGoalWeeklyGoals,
    calculateWeeks, addMonthlyGoal, cancelAddingGoal,
    calculateGoalProgress, calculateWeeklyProgress,
  } = task;

  const filteredTasks = tasks.filter(t => t.date === selectedDate);

  // selectedDate가 바뀌면 useTasks 내부 currentDate도 동기화
  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  // TodoPage 진입 시마다 이모지 반응 최신화 (친구 페이지에서 등록한 이모지 즉시 반영)
  useEffect(() => {
    refreshReactions();
  }, []);

  // 이번 주 월요일~일요일 계산
  const getThisWeekRange = (): { start: string; end: string } => {
    const now = new Date(today);
    const day = now.getDay(); // 0=일, 1=월~6=토
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { start: fmt(mon), end: fmt(sun) };
  };

  const thisWeekRange = getThisWeekRange();
  const thisWeekGoals = monthlyGoals.filter(g =>
    g.startDate <= thisWeekRange.end && g.endDate >= thisWeekRange.start
  );

  /**
   * 목표 시작일 기준으로 idx번째 주차(0-based)의 날짜 범위 반환
   * 예) startDate=2026-03-01, idx=0 → { start: '2026-03-01', end: '2026-03-07' }
   */
  const getGoalWeekRange = (startDate: string, idx: number): { start: string; end: string } => {
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const base = new Date(startDate);
    const s = new Date(base);
    s.setDate(base.getDate() + idx * 7);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return { start: fmt(s), end: fmt(e) };
  };

  /** 해당 주차가 이번 주(thisWeekRange)와 겹치는지 여부 */
  const isThisWeek = (goalStart: string, idx: number): boolean => {
    const wr = getGoalWeekRange(goalStart, idx);
    return wr.start <= thisWeekRange.end && wr.end >= thisWeekRange.start;
  };

  // State for expanded goal cards in monthly view
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  // weekly 탭: 펼쳐진 주간 목표 키 (goalId-weekGoalsId 복합 키, 목표별 독립 토글)
  const [expandedWeekGoalKey, setExpandedWeekGoalKey] = useState<string | null>(null);

  // Calculate weeks when dates change
  const weeksCount = calculateWeeks(newGoalStartDate, newGoalEndDate);

  useEffect(() => {
    if (weeksCount > 0 && newGoalWeeklyGoals.length !== weeksCount) {
      setNewGoalWeeklyGoals(Array(weeksCount).fill(''));
    }
  }, [weeksCount]);

  // selectedDate 변경 시 선택된 목표의 주차 자동 재계산
  useEffect(() => {
    if (hasGoal && selectedGoalId) {
      const goal = monthlyGoals.find(g => g.id === selectedGoalId);
      if (goal) {
        const start = new Date(goal.startDate);
        const current = new Date(selectedDate);
        const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setSelectedWeekIndex(Math.max(0, Math.floor(diffDays / 7)));
      }
    }
  }, [selectedDate]);

  // Get selected goal's weekly goals
  const selectedGoal = monthlyGoals.find(g => g.id === selectedGoalId);
  const weeklyGoalsOptions = selectedGoal?.weeklyGoals || [];

  // 주차 범위 초과 여부: 만들어진 주차 수 이상이거나 목표 기간 밖
  const isWeekOutOfRange =
    hasGoal &&
    selectedGoalId !== '' &&
    selectedWeekIndex !== null &&
    selectedGoal !== undefined &&
    (
      selectedDate < selectedGoal.startDate ||
      selectedDate > selectedGoal.endDate ||
      selectedWeekIndex >= weeklyGoalsOptions.length
    );

  // Daily 탭: 카테고리별로 { noGoalTasks, goalMap } 통합 구조
  const findGoalByWeekGoalsId = (weekGoalsId?: number) => {
    if (!weekGoalsId) return null;
    return monthlyGoals.find(g =>
      g.backendWeekGoals?.some(wg => wg.weekGoalsId === weekGoalsId)
    ) ?? null;
  };
  type DailyCatGroup = { noGoalTasks: Task[]; goalMap: Record<string, Task[]> };
  const dailyByCat = filteredTasks.reduce((acc: Record<string, DailyCatGroup>, t) => {
    const goal = findGoalByWeekGoalsId(t.weekGoalsId);
    const cat = goal ? goal.category : t.category;
    if (!acc[cat]) acc[cat] = { noGoalTasks: [], goalMap: {} };
    if (goal) {
      if (!acc[cat].goalMap[goal.id]) acc[cat].goalMap[goal.id] = [];
      acc[cat].goalMap[goal.id].push(t);
    } else {
      acc[cat].noGoalTasks.push(t);
    }
    return acc;
  }, {});

  return (
    <motion.div
      key="todo"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Full Month Calendar */}
      <div className="glass-card p-4 rounded-3xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">
            {new Date(selectedDate).getFullYear()}년 {new Date(selectedDate).getMonth() + 1}월
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <span key={d} className="text-[10px] text-gray-400 font-bold mb-2">{d}</span>
          ))}
          {/* Empty slots for days before the 1st of the month */}
          {Array.from({ length: new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Days of the month */}
          {Array.from({ length: new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).getDate() }).map((_, i) => {
            const day = i + 1;
            const year = new Date(selectedDate).getFullYear();
            const month = (new Date(selectedDate).getMonth() + 1).toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const hasTasks = tasks.some(t => t.date === dateStr);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-100'
                  }`}
              >
                <span className="text-xs font-bold">{day}</span>
                {hasTasks && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
        {(['daily', 'weekly', 'goals'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === mode ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {viewMode === 'daily' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{selectedDate === today ? '오늘' : selectedDate} 할 일</h3>
            <button
              onClick={() => {
                if (isAddingTask) {
                  cancelAddingTask();
                } else {
                  setNewTaskCategory(DB_CATEGORIES[0]);
                  setIsAddingTask(true);
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${isAddingTask
                ? 'bg-gray-200 text-gray-600 shadow-gray-200/50'
                : 'bg-primary text-white shadow-primary/20'
                }`}
            >
              {isAddingTask ? <X size={18} /> : <Plus size={18} />}
            </button>
          </div>

          {/* 할 일 추가 폼 - 목록 맨 위 */}
          <AnimatePresence>
            {isAddingTask && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-4 rounded-2xl border-2 border-dashed border-primary/30 space-y-4"
              >
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
                            const start = new Date(goal.startDate);
                            const current = new Date(selectedDate);
                            const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                            setSelectedWeekIndex(Math.max(0, Math.floor(diffDays / 7)));
                          } else {
                            setSelectedWeekIndex(null);
                          }
                        }}
                        className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs outline-none focus:border-primary transition-all"
                      >
                        <option value="">목표를 선택하세요</option>
                        {monthlyGoals.map(goal => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title} ({goal.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedGoalId && selectedWeekIndex !== null && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 ml-1">주간 목표 (자동)</label>
                        {isWeekOutOfRange ? (
                          <div className="w-full bg-red-50 p-2 rounded-xl border border-red-200 text-xs text-red-500 font-bold">
                            ⚠️ 선택한 날짜는 이 목표의 주차 범위를 벗어났습니다
                          </div>
                        ) : (
                          <div className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs text-gray-600">
                            {weeklyGoalsOptions[selectedWeekIndex]
                              ? `${selectedWeekIndex + 1}주차: ${weeklyGoalsOptions[selectedWeekIndex]}`
                              : `${selectedWeekIndex + 1}주차`}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Category Selection (목표 없음 모드에서만) */}
                {!hasGoal && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 ml-1">카테고리</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DB_CATEGORIES.map(cat => (
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
                    onKeyDown={(e) => e.key === 'Enter' && addTask(selectedDate)}
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
                    onClick={() => addTask(selectedDate)}
                    disabled={!newTaskText.trim() || (hasGoal && !selectedGoalId) || isWeekOutOfRange}
                    className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    추가
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredTasks.length === 0 && !isAddingTask ? (
            <div className="text-center py-10">
              <p className="text-xs text-gray-400">등록된 할 일이 없습니다.</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            <>
              {/* 카테고리별 통합: 목표 없는 할일 먼저 → 목표 연동 할일 */}
              {(Object.entries(dailyByCat) as [string, DailyCatGroup][]).map(([category, { noGoalTasks, goalMap }]) => (
                <div key={category} className="space-y-3">
                  {/* 카테고리 헤더 (1번만) */}
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <span className="text-sm font-bold">{category}</span>
                  </div>
                  <div className="ml-3 space-y-2">
                    {/* 목표 없는 할일 먼저 */}
                    {noGoalTasks.map(task => (
                      <div key={task.id} className="relative group">
                        <div className={`glass-card p-4 rounded-2xl transition-all ${task.completed ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleComplete(task.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary text-white' : 'border-gray-200'}`}
                            >
                              {task.completed && <Check size={14} />}
                            </button>
                            <div className="flex-1">
                              {editingTaskId === task.id ? (
                                <input
                                  autoFocus
                                  defaultValue={task.text}
                                  onBlur={(e) => updateTask(task.id, e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && updateTask(task.id, e.currentTarget.value)}
                                  className="w-full bg-transparent border-none outline-none text-sm font-medium"
                                />
                              ) : (
                                <span className={`block text-sm font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                  {task.text}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                          {task.taskId && (reactionsMap[task.taskId] || []).filter(r => r.count > 0).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-50">
                              {(reactionsMap[task.taskId] || []).filter(r => r.count > 0).map(r => (
                                <div key={r.emojiId} className="group/emoji relative">
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${r.myReaction
                                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                      : 'bg-gray-100 text-gray-500'
                                      }`}
                                  >
                                    {r.emojiChar}
                                    <span>{r.count}</span>
                                    {r.myReaction && <span className="text-primary/70">·나</span>}
                                  </span>

                                  {/* 🎯 리액터 목록 툴팁 (닉네임 기반) */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/emoji:block z-[60]">
                                    <div className="bg-gray-900/90 backdrop-blur text-white text-[9px] py-1 px-2 rounded-lg whitespace-nowrap shadow-xl">
                                      <p className="font-bold border-b border-white/10 mb-1 pb-1">{r.name} 반응</p>
                                      <div className="max-h-20 overflow-y-auto">
                                        {(r.nicknames || r.userIds)?.map((name, idx) => (
                                          <p key={idx} className="opacity-80">· {name}</p>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="w-2 h-2 bg-gray-900/90 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeMenuId === task.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-14 z-50 w-32 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 overflow-hidden"
                            >
                              <button onClick={() => setEditingTaskId(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                                <Edit2 size={14} /> 수정
                              </button>
                              <button onClick={() => postponeTask(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                                <ArrowRight size={14} /> 미루기
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">
                                <Trash2 size={14} /> 삭제
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* 목표 연동 할일: 목표/주차별 목표 서브헤더 */}
                    {(Object.entries(goalMap) as [string, Task[]][]).map(([goalId, goalTasks]) => {
                      const goal = monthlyGoals.find(g => g.id === goalId);
                      if (!goal) return null;
                      const byWeek = goalTasks.reduce((acc: Record<number, Task[]>, t) => {
                        const wid = t.weekGoalsId ?? 0;
                        if (!acc[wid]) acc[wid] = [];
                        acc[wid].push(t);
                        return acc;
                      }, {});
                      return (
                        <div key={goalId} className="space-y-2">
                          {(Object.entries(byWeek) as [string, Task[]][]).map(([widStr, weekTasks]) => {
                            const wid = Number(widStr);
                            const weekGoal = goal.backendWeekGoals?.find(wg => wg.weekGoalsId === wid);
                            const weekTitle = weekGoal?.title;
                            return (
                              <div key={wid} className="space-y-2">
                                <span className="block text-[11px] font-bold text-gray-500">
                                  {goal.title}{weekTitle ? ` / ${weekTitle}` : ''}
                                </span>
                                <div className="ml-2 space-y-2">
                                  {weekTasks.map(task => (
                                    <div key={task.id} className="relative group">
                                      <div className={`glass-card p-3 rounded-xl transition-all ${task.completed ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={() => toggleComplete(task.id)}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary text-white' : 'border-gray-200'}`}
                                          >
                                            {task.completed && <Check size={12} />}
                                          </button>
                                          <div className="flex-1">
                                            {editingTaskId === task.id ? (
                                              <input
                                                autoFocus
                                                defaultValue={task.text}
                                                onBlur={(e) => updateTask(task.id, e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && updateTask(task.id, e.currentTarget.value)}
                                                className="w-full bg-transparent border-none outline-none text-sm font-medium"
                                              />
                                            ) : (
                                              <span className={`block text-sm font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                                {task.text}
                                              </span>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                          >
                                            <MoreVertical size={16} />
                                          </button>
                                        </div>
                                        {task.taskId && (reactionsMap[task.taskId] || []).filter(r => r.count > 0).length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-50">
                                            {(reactionsMap[task.taskId] || []).filter(r => r.count > 0).map(r => (
                                              <div key={r.emojiId} className="group/emoji relative">
                                                <span
                                                  className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${r.myReaction
                                                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                >
                                                  {r.emojiChar}
                                                  <span>{r.count}</span>
                                                  {r.myReaction && <span className="text-primary/70">·나</span>}
                                                </span>

                                                {/* 🎯 리액터 목록 툴팁 (닉네임 기반) */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/emoji:block z-[60]">
                                                  <div className="bg-gray-900/90 backdrop-blur text-white text-[9px] py-1 px-2 rounded-lg whitespace-nowrap shadow-xl">
                                                    <p className="font-bold border-b border-white/10 mb-1 pb-1">{r.name} 반응</p>
                                                    <div className="max-h-20 overflow-y-auto">
                                                      {(r.nicknames || r.userIds)?.map((name, idx) => (
                                                        <p key={idx} className="opacity-80">· {name}</p>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <div className="w-2 h-2 bg-gray-900/90 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {activeMenuId === task.id && (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-12 z-50 w-32 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 overflow-hidden"
                                          >
                                            <button onClick={() => setEditingTaskId(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                                              <Edit2 size={14} /> 수정
                                            </button>
                                            <button onClick={() => postponeTask(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                                              <ArrowRight size={14} /> 미루기
                                            </button>
                                            <button onClick={() => deleteTask(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">
                                              <Trash2 size={14} /> 삭제
                                            </button>
                                          </motion.div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </div>
      )
      }

      {viewMode === 'weekly' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold">이번 주 목표 현황</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{thisWeekRange.start} ~ {thisWeekRange.end}</p>
          </div>

          {thisWeekGoals.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-gray-400">이번 주 진행 중인 목표가 없습니다.</p>
              <p className="text-[10px] text-gray-300 mt-1">목표 탭에서 새 목표를 추가해보세요.</p>
            </div>
          ) : (
            thisWeekGoals.map(goal => (
              <div key={goal.id} className="space-y-3">
                {/* 목표 제목 헤더 */}
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <span className="text-sm font-bold">{goal.title}</span>
                  <span className="text-[10px] text-gray-400">
                    {(() => {
                      console.log('🖥 TodoPage 주간 목표 카테고리 표시:', {
                        goalId: goal.id,
                        goalTitle: goal.title,
                        displayedCategory: goal.category,
                        fullGoal: goal
                      });
                      return goal.category;
                    })()}
                  </span>
                </div>

                {/* 주간 목표 박스들 */}
                {goal.backendWeekGoals && goal.backendWeekGoals.length > 0 ? (
                  goal.backendWeekGoals
                    .map((wg, idx) => ({ wg, idx }))
                    .filter(({ idx }) => isThisWeek(goal.startDate, idx))
                    .map(({ wg, idx }) => {
                      const wgKey = `${goal.id}-${wg.weekGoalsId}`;
                      const isWgExpanded = expandedWeekGoalKey === wgKey;
                      const weekTasks = tasks.filter(t => t.weekGoalsId === wg.weekGoalsId);
                      const wp = calculateWeeklyProgress(goal.id, idx);
                      return (
                        <div key={wg.weekGoalsId} className="glass-card rounded-2xl overflow-hidden">
                          {/* 주간 목표 헤더 */}
                          <button
                            onClick={() => setExpandedWeekGoalKey(isWgExpanded ? null : wgKey)}
                            className="w-full p-3 text-left hover:bg-gray-50/50 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-primary">{idx + 1}</span>
                                </div>
                                <span className="text-xs font-semibold truncate">{wg.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-primary">{wp}%</span>
                                {isWgExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                              </div>
                            </div>
                            {/* 진행률 바 */}
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${wp}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                              />
                            </div>
                          </button>

                          {/* 할 일 목록 (토글) */}
                          <AnimatePresence>
                            {isWgExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 border-t border-gray-100 space-y-1.5 pt-2">
                                  {weekTasks.length === 0 ? (
                                    <p className="text-[10px] text-gray-300 italic py-1">등록된 할 일이 없습니다.</p>
                                  ) : (
                                    weekTasks.map(t => (
                                      <div
                                        key={t.id}
                                        className={`flex items-center gap-2 p-2 rounded-xl ${t.completed ? 'opacity-50' : 'bg-gray-50'
                                          }`}
                                      >
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleComplete(t.id); }}
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${t.completed ? 'bg-primary border-primary text-white' : 'border-gray-200'
                                            }`}
                                        >
                                          {t.completed && <Check size={10} />}
                                        </button>
                                        <span className={`text-xs flex-1 ${t.completed ? 'line-through text-gray-400' : 'text-gray-700'
                                          }`}>
                                          {t.text}
                                        </span>
                                        <span className="text-[9px] text-gray-400 shrink-0">{t.date}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                ) : (
                  /* backendWeekGoals 없으면 weeklyGoals 데이터로 포백 */
                  goal.weeklyGoals
                    .map((wgTitle, idx) => ({ wgTitle, idx }))
                    .filter(({ idx }) => isThisWeek(goal.startDate, idx))
                    .map(({ wgTitle, idx }) => {
                      const wgKey = `${goal.id}-local-${idx}`;
                      const isWgExpanded = expandedWeekGoalKey === wgKey;
                      const weekTasks = tasks.filter(t => t.goalId === goal.id && t.weekIndex === idx);
                      const wp = calculateWeeklyProgress(goal.id, idx);
                      return (
                        <div key={idx} className="glass-card rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setExpandedWeekGoalKey(isWgExpanded ? null : wgKey)}
                            className="w-full p-3 text-left hover:bg-gray-50/50 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-primary">{idx + 1}</span>
                                </div>
                                <span className="text-xs font-semibold truncate">{wgTitle}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-primary">{wp}%</span>
                                {isWgExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                              </div>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${wp}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                              />
                            </div>
                          </button>
                          <AnimatePresence>
                            {isWgExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 border-t border-gray-100 space-y-1.5 pt-2">
                                  {weekTasks.length === 0 ? (
                                    <p className="text-[10px] text-gray-300 italic py-1">등록된 할 일이 없습니다.</p>
                                  ) : (
                                    weekTasks.map(t => (
                                      <div
                                        key={t.id}
                                        className={`flex items-center gap-2 p-2 rounded-xl ${t.completed ? 'opacity-50' : 'bg-gray-50'
                                          }`}
                                      >
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleComplete(t.id); }}
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${t.completed ? 'bg-primary border-primary text-white' : 'border-gray-200'
                                            }`}
                                        >
                                          {t.completed && <Check size={10} />}
                                        </button>
                                        <span className={`text-xs flex-1 ${t.completed ? 'line-through text-gray-400' : 'text-gray-700'
                                          }`}>
                                          {t.text}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                )}
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">목표</h3>
            <button
              onClick={() => {
                if (isAddingGoal) {
                  cancelAddingGoal();
                } else {
                  setNewGoalCategory(DB_CATEGORIES[0]);
                  setNewGoalStartDate(selectedDate);
                  setNewGoalEndDate(selectedDate);
                  setIsAddingGoal(true);
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${isAddingGoal
                ? 'bg-gray-200 text-gray-600 shadow-gray-200/50'
                : 'bg-primary text-white shadow-primary/20'
                }`}
            >
              {isAddingGoal ? <X size={18} /> : <Plus size={18} />}
            </button>
          </div>

          {/* 목표 추가 폼 - 목록 맨 위 */}
          <AnimatePresence>
            {isAddingGoal && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-4 rounded-2xl border-2 border-dashed border-primary/30 space-y-4"
              >
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 ml-1">카테고리</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DB_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setNewGoalCategory(cat)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${newGoalCategory === cat
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 ml-1">목표 제목</label>
                  <input
                    autoFocus
                    placeholder="목표 제목을 입력하세요"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full bg-gray-50 p-2 rounded-xl border border-gray-100 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 ml-1">시작일</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <CalendarIcon size={12} className="text-gray-400" />
                      <input
                        type="date"
                        value={newGoalStartDate}
                        onChange={(e) => setNewGoalStartDate(e.target.value)}
                        className="flex-1 bg-transparent text-[11px] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 ml-1">완료일</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <CalendarIcon size={12} className="text-gray-400" />
                      <input
                        type="date"
                        value={newGoalEndDate}
                        min={newGoalStartDate}
                        onChange={(e) => setNewGoalEndDate(e.target.value)}
                        className="flex-1 bg-transparent text-[11px] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation Warning */}
                {newGoalStartDate && newGoalEndDate && new Date(newGoalEndDate) < new Date(newGoalStartDate) && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-[10px] p-2 rounded-lg">
                    완료일은 시작일과 같거나 늦어야 합니다.
                  </div>
                )}

                {/* Weekly Goals */}
                {weeksCount > 0 && new Date(newGoalEndDate) >= new Date(newGoalStartDate) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 ml-1">
                      주차별 상세 목표 (총 {weeksCount}주)
                    </label>
                    <div className="space-y-2">
                      {Array.from({ length: weeksCount }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 w-12">{idx + 1}주차</span>
                          <input
                            placeholder={`${idx + 1}주차 목표를 입력하세요`}
                            value={newGoalWeeklyGoals[idx] || ''}
                            onChange={(e) => {
                              const updated = [...newGoalWeeklyGoals];
                              updated[idx] = e.target.value;
                              setNewGoalWeeklyGoals(updated);
                            }}
                            className="flex-1 bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs outline-none focus:border-primary transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={cancelAddingGoal}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={addMonthlyGoal}
                    disabled={
                      !newGoalTitle.trim() ||
                      !newGoalStartDate ||
                      !newGoalEndDate ||
                      new Date(newGoalEndDate) < new Date(newGoalStartDate) ||
                      (weeksCount > 0 && newGoalWeeklyGoals.slice(0, weeksCount).some(g => !g.trim()))
                    }
                    className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    추가
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing Monthly Goals with Toggle */}
          {monthlyGoals.map(goal => {
            const progress = calculateGoalProgress(goal.id);
            const isExpanded = expandedGoalId === goal.id;

            return (
              <div key={goal.id} className="glass-card rounded-2xl overflow-hidden">
                {/* Card Header - Summary View */}
                <button
                  onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                  className="w-full p-4 text-left hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold mb-1">{goal.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <CalendarIcon size={10} />
                        <span>{goal.startDate} ~ {goal.endDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                        {(() => {
                          console.log('🖥 TodoPage 목표 상세 카테고리 표시:', {
                            goalId: goal.id,
                            goalTitle: goal.title,
                            displayedCategory: goal.category,
                            fullGoal: goal
                          });
                          return goal.category;
                        })()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold">전체 진행률</span>
                      <span className="text-xs text-primary font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Content - Weekly Goals */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          주차별 목표
                        </h5>
                        {(goal.backendWeekGoals && goal.backendWeekGoals.length > 0
                          ? goal.backendWeekGoals.map((wg, idx) => ({
                            idx,
                            title: wg.title,
                            progress: calculateWeeklyProgress(goal.id, idx),
                            hasData: tasks.some(t => t.weekGoalsId === wg.weekGoalsId),
                          }))
                          : goal.weeklyGoals.map((wg, idx) => ({
                            idx,
                            title: wg,
                            progress: calculateWeeklyProgress(goal.id, idx),
                            hasData: false,
                          }))
                        ).map(({ idx, title, progress: wp, hasData }) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-700">{title}</span>
                              </div>
                              {(hasData || wp > 0) && (
                                <span className="text-[10px] font-bold text-primary">{wp}%</span>
                              )}
                            </div>

                            {(hasData || wp > 0) && (
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${wp}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                  className="h-full bg-primary rounded-full"
                                />
                              </div>
                            )}

                            {!hasData && wp === 0 && (
                              <p className="text-[9px] text-gray-400 italic">할 일이 등록되지 않았습니다</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Empty State */}
          {monthlyGoals.length === 0 && !isAddingGoal && (
            <div className="text-center py-10">
              <p className="text-xs text-gray-400">등록된 목표가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TodoPage;
