import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Rocket, Plus, Check, MoreVertical, Edit2, ArrowRight, Trash2 } from 'lucide-react';
import { useTasksContext } from '../../tasks/context/TasksContext';
import { Task } from '../../../types';
import AddTaskForm from '../../tasks/components/AddTaskForm';

interface HomePageProps {
  today: string;
  selectedKeywords: string[];
  setActiveTab: (tab: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  today,
  selectedKeywords,
  setActiveTab,
}) => {
  const task = useTasksContext();
  const {
    tasks, editingTaskId, setEditingTaskId, updateTask, deleteTask,
    toggleComplete, postponeTask, isAddingTask, setIsAddingTask,
    activeMenuId, setActiveMenuId, setNewTaskCategory,
    // Monthly Goal
    monthlyGoals
  } = task;

  const filteredTasks = tasks.filter(t => t.date === today);

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Feedback Message Box */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-2xl mb-6 bg-white border-primary/5 flex items-start gap-3 cursor-pointer hover:bg-white/90 transition-all"
        onClick={() => setActiveTab('report')}
      >
        <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
          <MessageCircle size={18} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-bold text-gray-800">오늘의 피드백</h4>
            <span className="text-[10px] text-amber-500 font-bold">리포트 보기</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            금요일은 평소보다 수행률이 <span className="text-primary font-bold">15% 높아요!</span> 이 기세를 몰아 오늘 계획도 완수해볼까요?
          </p>
        </div>
      </motion.div>

      {/* Progress Card */}
      <div className="glass-card p-5 rounded-3xl mb-6 bg-gradient-to-br from-primary to-sky text-white border-none">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs opacity-80 mb-1">오늘의 진행도</p>
            <h3 className="text-2xl font-bold">
              {Math.round((tasks.filter(t => t.date === today && t.completed).length / (tasks.filter(t => t.date === today).length || 1)) * 100)}%
            </h3>
          </div>
          <Rocket size={32} className="opacity-50" />
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(tasks.filter(t => t.date === today && t.completed).length / (tasks.filter(t => t.date === today).length || 1)) * 100}%` }}
            className="h-full bg-white" 
          />
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">오늘 할 일</h3>
        <button 
          onClick={() => {
            setNewTaskCategory(selectedKeywords[0] || '기타');
            setIsAddingTask(true);
          }}
          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xs text-gray-400">등록된 할 일이 없습니다.</p>
          </div>
        ) : (
          Object.entries(
            filteredTasks.reduce((acc: Record<string, Task[]>, task) => {
              if (!acc[task.category]) acc[task.category] = [];
              acc[task.category].push(task);
              return acc;
            }, {})
          ).map(([category, categoryTasks]) => {
            // Group tasks by goal within category
            const tasksWithGoal = (categoryTasks as Task[]).filter(t => t.goalId);
            const tasksWithoutGoal = (categoryTasks as Task[]).filter(t => !t.goalId);
            
            // Group tasks with goals by goalId
            const tasksByGoal = tasksWithGoal.reduce((acc: Record<string, Task[]>, task) => {
              const goalId = task.goalId!;
              if (!acc[goalId]) acc[goalId] = [];
              acc[goalId].push(task);
              return acc;
            }, {});

            return (
              <div key={category} className="space-y-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 bg-primary rounded-full" />
                  {category}
                </h4>

                {/* Tasks grouped by goals */}
                {Object.entries(tasksByGoal).map(([goalId, goalTasks]) => {
                  const goal = monthlyGoals.find(g => g.id === goalId);
                  if (!goal) return null;

                  return (
                    <div key={goalId} className="ml-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-[11px] font-bold">{goal.title}</h5>
                      </div>
                      
                      <div className="ml-3 space-y-2">
                        {(goalTasks as Task[]).map(task => (
                          <div key={task.id} className="relative group">
                            <div className={`glass-card p-3 rounded-xl flex items-center gap-3 transition-all ${task.completed ? 'opacity-50' : ''}`}>
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

                            {/* Kebab Menu */}
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
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Tasks without goals */}
                {tasksWithoutGoal.length > 0 && (
                  <div className="ml-3 space-y-2">
                    {tasksWithoutGoal.map(task => (
                      <div key={task.id} className="relative group">
                        <div className={`glass-card p-4 rounded-2xl flex items-center gap-3 transition-all ${task.completed ? 'opacity-50' : ''}`}>
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

                        {/* Kebab Menu */}
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
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isAddingTask && <AddTaskForm date={today} selectedKeywords={selectedKeywords} />}
      </div>
    </motion.div>
  );
};

export default HomePage;
