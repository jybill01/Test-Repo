import React, { createContext, useContext, ReactNode } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Task, MonthlyGoal } from '../types';
import { TaskEmojiGroupResponse } from '../../../api/schedule.service';

interface TasksContextType {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  isLoading: boolean;
  reactionsMap: Record<number, TaskEmojiGroupResponse[]>;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  newTaskCategory: string;
  setNewTaskCategory: (cat: string) => void;
  isAddingTask: boolean;
  setIsAddingTask: (val: boolean) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  addTask: (date: string) => void;
  updateTask: (id: string, newText: string) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  postponeTask: (id: string) => void;
  cancelAddingTask: () => void;
  // Task with Goal
  hasGoal: boolean;
  setHasGoal: (val: boolean) => void;
  selectedGoalId: string;
  setSelectedGoalId: (id: string) => void;
  selectedWeekIndex: number | null;
  setSelectedWeekIndex: (idx: number | null) => void;
  // Monthly Goal
  monthlyGoals: MonthlyGoal[];
  setMonthlyGoals: (goals: MonthlyGoal[]) => void;
  isAddingGoal: boolean;
  setIsAddingGoal: (val: boolean) => void;
  newGoalTitle: string;
  setNewGoalTitle: (text: string) => void;
  newGoalCategory: string;
  setNewGoalCategory: (cat: string) => void;
  newGoalStartDate: string;
  setNewGoalStartDate: (date: string) => void;
  newGoalEndDate: string;
  setNewGoalEndDate: (date: string) => void;
  newGoalWeeklyGoals: string[];
  setNewGoalWeeklyGoals: (goals: string[]) => void;
  calculateWeeks: (startDate: string, endDate: string) => number;
  addMonthlyGoal: () => Promise<void>;
  cancelAddingGoal: () => void;
  calculateGoalProgress: (goalId: string) => number;
  calculateWeeklyProgress: (goalId: string, weekIndex: number) => number;
  setCurrentDate: (date: string) => void;
  loadTasks: (date: string) => Promise<void>;
  loadGoals: () => Promise<void>;
  refreshReactions: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode; selectedKeywords: string[] }> = ({ children, selectedKeywords }) => {
  const task = useTasks(selectedKeywords);
  return (
    <TasksContext.Provider value={task}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasksContext = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return context;
};
