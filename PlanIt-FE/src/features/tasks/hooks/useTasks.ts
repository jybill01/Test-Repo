import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, MonthlyGoal } from '../types';
import {
  scheduleService,
  DailyTaskItem,
  TaskEmojiGroupResponse,
  GoalDetailApiResponse,
} from '../../../api/schedule.service';

/** categoryListId → 카테고리 이름 (data.sql category_list 기준) */
const CATEGORY_LIST_MAP: Record<number, string> = {
  1: '직무/커리어',
  2: '어학/자격증',
  3: '독서/학습',
  4: '건강/운동',
  5: '재테크/경제',
  6: '마인드/루틴',
  7: '취미/관계',
  8: '기타',
};

/** 카테고리 이름 → categoryListId 역매핑 */
const CATEGORY_NAME_TO_ID: Record<string, string> = Object.entries(CATEGORY_LIST_MAP)
  .reduce((acc, [id, name]) => ({ ...acc, [name]: id }), {} as Record<string, string>);

// ── 백엔드 타입 → 프론트엔드 Task 변환 ──────────────────────────────────────
const mapBackendTask = (item: DailyTaskItem): Task => ({
  id: item.taskId.toString(),       // UI는 string id 사용
  taskId: item.taskId,              // 실제 백엔드 PK 보관
  text: item.content,
  date: item.targetDate,
  completed: item.complete,
  category: item.category || item.weekGoalsTitle || '기타',
  // goalId를 weekGoalsId로 매핑하지 않음:
  // monthlyGoals.id = goalsId 이고 weekGoalsId != goalsId 이므로
  // 잘못된 매핑 시 tasksWithGoal에 들어가 goal이 null로 렌더링 스킵됨
  weekGoalsId: item.weekGoalsId,
});

export const useTasks = (selectedKeywords: string[]) => {
  const today = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]); // 항상 최신 tasks 참조용
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  const [isLoading, setIsLoading] = useState(false);
  const [reactionsMap, setReactionsMap] = useState<Record<number, TaskEmojiGroupResponse[]>>({});

  // ── 날짜별 할 일 API 조회 ──────────────────────────────────────────────
  const loadTasks = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const response = await scheduleService.getDailyTasks(date);
      const backendTasks = response.tasks.map(mapBackendTask);
      // 로컬에서만 추가된 tasks(taskId 없는 것)를 merge하여 유지
      setTasks(prev => {
        const localOnly = prev.filter(t => t.taskId === undefined && t.date === date);
        return [...backendTasks, ...localOnly];
      });
      // 이모지 반응 병렬 로드
      const numericTasks = backendTasks.filter(t => t.taskId !== undefined);
      if (numericTasks.length > 0) {
        const results = await Promise.allSettled(
          numericTasks.map(t => scheduleService.getTaskReactions(t.taskId!))
        );
        const newMap: Record<number, TaskEmojiGroupResponse[]> = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            newMap[numericTasks[i].taskId!] = result.value.reactions;
          }
        });
        setReactionsMap(newMap);
      }
    } catch (err) {
      console.error('[useTasks] 할 일 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentDate) {
      loadTasks(currentDate);
    }
  }, [currentDate, loadTasks]);

  // ── 목표 API 조회 ────────────────────────────────────────────────────────────
  const loadGoals = useCallback(async () => {
    try {
      const goals = await scheduleService.getGoals();
      console.log('🌐 목표 조회 API 응답:', goals);

      const details = await Promise.allSettled(
        goals.map(g => scheduleService.getGoalDetail(g.goalsId))
      );
      const mapped: MonthlyGoal[] = goals.map((g, i) => {
        const detail = details[i].status === 'fulfilled'
          ? (details[i] as PromiseFulfilledResult<GoalDetailApiResponse>).value
          : null;

        const mappedGoal = {
          id: g.goalsId.toString(),
          goalsId: g.goalsId,
          title: g.title,
          category: g.categoryName || '기타', // 🎯 백엔드 응답의 categoryName 직접 사용
          startDate: g.startDate,
          endDate: g.endDate,
          weeklyGoals: detail?.weekGoals.map(wg => wg.title) ?? [],
          backendWeekGoals: detail?.weekGoals ?? [],
          progressRate: detail?.progressRate ?? 0,
        };

        // 🖥 화면 렌더 카테고리 값 로깅
        console.log('🖥 화면 렌더 카테고리 값:', {
          goalId: g.goalsId,
          title: g.title,
          backendCategoryName: g.categoryName,
          finalCategory: mappedGoal.category,
          rawGoalResponse: g
        });

        return mappedGoal;
      });
      setMonthlyGoals(mapped);
    } catch (err) {
      console.error('[useTasks] 목표 조회 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Task with Goal states
  const [hasGoal, setHasGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);

  // Monthly Goal states
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState('');
  const [newGoalEndDate, setNewGoalEndDate] = useState('');
  const [newGoalWeeklyGoals, setNewGoalWeeklyGoals] = useState<string[]>([]);

  const addTask = async (date: string) => {
    if (!newTaskText.trim()) {
      setIsAddingTask(false);
      return;
    }

    let taskCategory = newTaskCategory || selectedKeywords[0] || '기타';

    // 선택된 목표의 backendWeekGoals에서 weekGoalsId 조회
    const selectedGoal = monthlyGoals.find(g => g.id === selectedGoalId);
    const weekGoalsId = (
      hasGoal && selectedGoal && selectedWeekIndex !== null &&
      selectedGoal.backendWeekGoals &&
      selectedGoal.backendWeekGoals.length > selectedWeekIndex
    ) ? selectedGoal.backendWeekGoals[selectedWeekIndex].weekGoalsId : undefined;

    if (hasGoal && weekGoalsId !== undefined) {
      // ── 목표 있음 + 주간목표ID 확인됨 → 백엔드 저장
      try {
        await scheduleService.createTask({
          weekGoalsId,
          content: newTaskText,
          targetDate: date,
        });
        await loadTasks(date);
        await loadGoals(); // 진행률 갱신
      } catch (err) {
        console.error('[useTasks] 할 일 생성 실패:', err);
      }
    } else if (!hasGoal) {
      // ── 목표 없음 → 백엔드 저장 (weekGoalsId: null, category는 키워드 또는 기타)
      try {
        await scheduleService.createTask({
          weekGoalsId: null,
          category: taskCategory,
          content: newTaskText,
          targetDate: date,
        });
        await loadTasks(date);
      } catch (err) {
        console.error('[useTasks] 할 일 생성 실패:', err);
        // API 실패 시 로컬 fallback
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          text: newTaskText,
          date: date,
          completed: false,
          category: taskCategory,
        };
        setTasks(prev => [...prev, newTask]);
      }
    } else {
      // ── 목표 선택했지만 backendWeekGoals 미확인 (로컬 목표 fallback)
      if (selectedGoal) taskCategory = selectedGoal.category;
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        text: newTaskText,
        date: date,
        completed: false,
        category: taskCategory,
        goalId: selectedGoalId,
        weekIndex: selectedWeekIndex ?? undefined,
      };
      setTasks(prev => [...prev, newTask]);
    }

    // 입력 상태 초기화
    setNewTaskText('');
    setNewTaskCategory('');
    setHasGoal(false);
    setSelectedGoalId('');
    setSelectedWeekIndex(null);
    setIsAddingTask(false);
  };

  const cancelAddingTask = () => {
    setNewTaskText('');
    setNewTaskCategory('');
    setHasGoal(false);
    setSelectedGoalId('');
    setSelectedWeekIndex(null);
    setIsAddingTask(false);
  };

  // ── CRUD API 연동 ─────────────────────────────────────────────────────────

  const updateTask = async (id: string, newText: string) => {
    const numericId = parseInt(id);
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
    setEditingTaskId(null);
    if (!isNaN(numericId)) {
      try {
        await scheduleService.updateTask(numericId, { content: newText });
      } catch (err) {
        console.error('[useTasks] 할 일 수정 실패:', err);
        // Rollback
        await loadTasks(currentDate);
      }
    }
  };

  const deleteTask = async (id: string) => {
    const numericId = parseInt(id);
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));
    setActiveMenuId(null);
    if (!isNaN(numericId)) {
      try {
        await scheduleService.deleteTask(numericId);
      } catch (err) {
        console.error('[useTasks] 할 일 삭제 실패:', err);
        await loadTasks(currentDate);
      }
    }
  };

  const toggleComplete = async (id: string) => {
    const numericId = parseInt(id);
    // Optimistic update (즉시 UI 반영)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (!isNaN(numericId)) {
      try {
        await scheduleService.toggleTaskCompletion(numericId);
        await loadGoals(); // 전체 complete/total 기준 진행률 갱신
      } catch (err) {
        console.error('[useTasks] 완료 토글 실패:', err);
        // Rollback
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      }
    }
  };

  const postponeTask = async (id: string) => {
    const numericId = parseInt(id);
    setActiveMenuId(null);
    if (!isNaN(numericId)) {
      try {
        await scheduleService.postponeTask(numericId);
        await loadTasks(currentDate); // 날짜가 바뀌므로 다시 불러옴
      } catch (err) {
        console.error('[useTasks] 미루기 실패:', err);
      }
    } else {
      // Mock fallback
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const d = new Date(t.date);
          d.setDate(d.getDate() + 1);
          return { ...t, date: d.toISOString().split('T')[0] };
        }
        return t;
      }));
    }
  };

  const calculateWeeks = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, Math.ceil(diffDays / 7));
  };

  const addMonthlyGoal = async () => {
    if (!newGoalTitle.trim() || !newGoalStartDate || !newGoalEndDate) {
      setIsAddingGoal(false);
      return;
    }

    const cat = newGoalCategory || selectedKeywords[0] || '기타';
    // DB category_list.name 으로 변환 (BE는 이름으로 조회)
    // CATEGORY_NAME_TO_ID에 없는 키워드(예: '운동')는 '기타'로 fallback
    const dbCategoryNames = Object.values(CATEGORY_LIST_MAP);
    const dbCatName = dbCategoryNames.includes(cat) ? cat : '기타';
    const validWeeklyGoals = newGoalWeeklyGoals.filter(g => g.trim());

    try {
      const created = await scheduleService.createGoal({
        category: dbCatName,
        title: newGoalTitle,
        startDate: newGoalStartDate,
        endDate: newGoalEndDate,
      });
      // 주차별 목표 등록 (병렬)
      await Promise.all(
        validWeeklyGoals.map(title => scheduleService.createWeekGoal(created.goalsId, { title }))
      );
      await loadGoals(); // 최신 목표 + 진행률 반영
    } catch (err) {
      console.error('[useTasks] 목표 생성 실패:', err);
      // API 실패 시 로컬 fallback
      const newGoal: MonthlyGoal = {
        id: Math.random().toString(36).substr(2, 9),
        title: newGoalTitle,
        category: cat,
        startDate: newGoalStartDate,
        endDate: newGoalEndDate,
        weeklyGoals: validWeeklyGoals,
      };
      setMonthlyGoals(prev => [...prev, newGoal]);
    }

    // Reset states
    setNewGoalTitle('');
    setNewGoalCategory('');
    setNewGoalStartDate('');
    setNewGoalEndDate('');
    setNewGoalWeeklyGoals([]);
    setIsAddingGoal(false);
  };

  const cancelAddingGoal = () => {
    setNewGoalTitle('');
    setNewGoalCategory('');
    setNewGoalStartDate('');
    setNewGoalEndDate('');
    setNewGoalWeeklyGoals([]);
    setIsAddingGoal(false);
  };

  // 이모지 반응만 재조회 (탭 전환 후 최신화)
  const refreshReactions = useCallback(async () => {
    const numericTasks = tasksRef.current.filter(t => t.taskId !== undefined);
    if (numericTasks.length === 0) return;
    const results = await Promise.allSettled(
      numericTasks.map(t => scheduleService.getTaskReactions(t.taskId!))
    );
    setReactionsMap(prev => {
      const newMap = { ...prev };
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          newMap[numericTasks[i].taskId!] = result.value.reactions;
        }
      });
      return newMap;
    });
  }, []); // tasksRef는 ref이므로 의존성 불필요

  // Calculate goal progress: 백엔드에서 계산된 진행률 사용
  const calculateGoalProgress = (goalId: string): number => {
    const goal = monthlyGoals.find(g => g.id === goalId);
    return goal?.progressRate ?? 0;
  };

  // Calculate weekly progress: 백엔드에서 계산된 주차별 진행률 사용
  const calculateWeeklyProgress = (goalId: string, weekIndex: number): number => {
    const goal = monthlyGoals.find(g => g.id === goalId);
    const weekGoal = goal?.backendWeekGoals?.[weekIndex];
    return weekGoal?.progressRate ?? 0;
  };

  return {
    tasks,
    setTasks,
    isLoading,
    reactionsMap,
    editingTaskId,
    setEditingTaskId,
    newTaskText,
    setNewTaskText,
    newTaskCategory,
    setNewTaskCategory,
    isAddingTask,
    setIsAddingTask,
    activeMenuId,
    setActiveMenuId,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    postponeTask,
    cancelAddingTask,
    // Task with Goal
    hasGoal,
    setHasGoal,
    selectedGoalId,
    setSelectedGoalId,
    selectedWeekIndex,
    setSelectedWeekIndex,
    // Monthly Goal
    monthlyGoals,
    setMonthlyGoals,
    isAddingGoal,
    setIsAddingGoal,
    newGoalTitle,
    setNewGoalTitle,
    newGoalCategory,
    setNewGoalCategory,
    newGoalStartDate,
    setNewGoalStartDate,
    newGoalEndDate,
    setNewGoalEndDate,
    newGoalWeeklyGoals,
    setNewGoalWeeklyGoals,
    calculateWeeks,
    addMonthlyGoal,
    cancelAddingGoal,
    loadTasks,
    loadGoals,
    refreshReactions,
    setCurrentDate,
    calculateGoalProgress,
    calculateWeeklyProgress
  };
};
