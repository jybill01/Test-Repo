import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, MoreVertical, Edit2, ArrowRight, Trash2 } from 'lucide-react';
import { Task } from '../../../types';

export interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPostpone: (id: string) => void;
  onEdit: (id: string) => void;
  editingId: string | null;
  onUpdate: (id: string, text: string) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  isAdding: boolean;
  onAdd: () => void;
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  newTaskCategory?: string;
  setNewTaskCategory?: (cat: string) => void;
  categories?: string[];
}

const TaskList = ({ 
  tasks, onToggle, onDelete, onPostpone, onEdit, editingId, onUpdate, 
  activeMenuId, setActiveMenuId, isAdding, onAdd, newTaskText, setNewTaskText,
  newTaskCategory, setNewTaskCategory, categories
}: TaskListProps) => {
  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className="relative group">
          <div className={`glass-card p-4 rounded-2xl flex items-center gap-3 transition-all ${task.completed ? 'opacity-50' : ''}`}>
            <button 
              onClick={() => onToggle(task.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary text-white' : 'border-gray-200'}`}
            >
              {task.completed && <Check size={14} />}
            </button>
            
            {editingId === task.id ? (
              <input
                autoFocus
                defaultValue={task.text}
                onBlur={(e) => onUpdate(task.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onUpdate(task.id, e.currentTarget.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
              />
            ) : (
              <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                {task.text}
              </span>
            )}

            <button 
              onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Kebab Menu */}
          <AnimatePresence>
            {activeMenuId === task.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-14 z-50 w-32 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 overflow-hidden"
              >
                <button onClick={() => onEdit(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                  <Edit2 size={14} /> 수정
                </button>
                <button onClick={() => onPostpone(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                  <ArrowRight size={14} /> 미루기
                </button>
                <button onClick={() => onDelete(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">
                  <Trash2 size={14} /> 삭제
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {isAdding && (
        <div className="glass-card p-4 rounded-2xl border-2 border-dashed border-primary/30 space-y-3">
          <input
            autoFocus
            placeholder="할 일을 입력하세요"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            className="w-full bg-transparent border-none outline-none text-sm font-medium"
          />
          
          {categories && setNewTaskCategory && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewTaskCategory(cat)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    newTaskCategory === cat 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={onAdd}
              className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20"
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
