import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Heart, Check } from 'lucide-react';
import { Friend } from '../../../types';
import {
  scheduleService,
  FriendTaskItem,
  EmojiResponse,
  TaskEmojiGroupResponse,
} from '../../../api/schedule.service';

interface FriendTodoViewProps {
  friend: Friend;
  onBack: () => void;
  reactionTaskId: string | null;
  setReactionTaskId: (id: string | null) => void;
}

const FriendTodoView: React.FC<FriendTodoViewProps> = ({ friend, onBack }) => {
  const today = new Date().toISOString().split('T')[0];
  const [tasks, setTasks] = useState<FriendTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emojiList, setEmojiList] = useState<EmojiResponse[]>([]);
  const [reactionsMap, setReactionsMap] = useState<Record<number, TaskEmojiGroupResponse[]>>({});
  const [openPickerTaskId, setOpenPickerTaskId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await scheduleService.getFriendTasks(friend.id, today);
        setTasks(res.tasks || []);
        
        if (res.tasks && res.tasks.length > 0) {
          const results = await Promise.allSettled(
            res.tasks.map(t => scheduleService.getTaskReactions(t.taskId))
          );
          const newMap: Record<number, TaskEmojiGroupResponse[]> = {};
          results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
              newMap[res.tasks[i].taskId] = (result.value as any).reactions;
            }
          });
          setReactionsMap(newMap);
        }
      } catch (err) {
        console.error('[FriendTodoView] 데이터 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [friend.id]);

  useEffect(() => {
    scheduleService.getEmojiList()
      .then(setEmojiList)
      .catch(err => console.error('[FriendTodoView] 이모지 목록 조회 실패:', err));
  }, []);

  const handleEmojiClick = async (taskId: number, emoji: EmojiResponse) => {
    const reactions = reactionsMap[taskId] || [];
    const existing = reactions.find(r => r.emojiId === emoji.emojiId);
    const isRemoving = existing?.myReaction ?? false;

    setOpenPickerTaskId(null);

    try {
      if (isRemoving) {
        await scheduleService.deleteEmojiReaction(taskId, emoji.emojiId);
      } else {
        await scheduleService.addEmojiReaction(taskId, { emojiId: emoji.emojiId });
      }
      const updated = await scheduleService.getTaskReactions(taskId);
      setReactionsMap(prev => ({ ...prev, [taskId]: updated.reactions }));
    } catch (err) {
      console.error('[FriendTodoView] 이모지 반응 실패:', err);
    }
  };

  // --- 🎯 핵심 그룹화 로직 (Category -> Combined Goal Title) ---
  const groupedTasks = tasks.reduce((acc: Record<string, Record<string, FriendTaskItem[]>>, task) => {
    const category = task.category || '기타';
    
    // 월간 목표와 주간 목표를 " / " 로 결합하여 헤더로 사용
    let goalHeader = '기타 할 일';
    if (task.goalTitle || task.weekGoalsTitle) {
      goalHeader = `${task.goalTitle || '목표'} / ${task.weekGoalsTitle || '주간 목표'}`;
    }
    
    if (!acc[category]) acc[category] = {};
    if (!acc[category][goalHeader]) acc[category][goalHeader] = [];
    
    acc[category][goalHeader].push(task);
    return acc;
  }, {});

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/20">
            {friend.nickname[0]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{friend.nickname}님</h3>
            <p className="text-[10px] text-gray-400 font-medium">친구의 성장을 응원해주세요!</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">데이터를 분석하고 있어요</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-20">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 text-gray-200">
            <Heart size={32} />
          </div>
          <p className="text-xs font-bold text-gray-400 italic">아직 등록된 할 일이 없습니다.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide pb-10">
          {Object.entries(groupedTasks).map(([category, goals]) => (
            <div key={category} className="space-y-5">
              {/* 1단계: Category Header */}
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <div className="w-1.5 h-3 bg-primary rounded-full shadow-sm shadow-primary/30" />
                {category}
              </h4>

              {Object.entries(goals).map(([goalHeader, goalTasks]) => (
                <div key={goalHeader} className="ml-3 space-y-3">
                  {/* 2단계: Combined Goal Header (Monthly / Weekly) */}
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-[11px] font-bold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100/50">
                      {goalHeader}
                    </h5>
                  </div>
                  
                  {/* 3단계: Task Cards */}
                  <div className="space-y-2.5">
                    {goalTasks.map(task => (
                      <TaskItemCard 
                        key={task.taskId} 
                        task={task} 
                        reactions={reactionsMap[task.taskId] || []}
                        isOpen={openPickerTaskId === task.taskId}
                        onPickerToggle={() => setOpenPickerTaskId(openPickerTaskId === task.taskId ? null : task.taskId)}
                        onEmojiClick={(emoji) => handleEmojiClick(task.taskId, emoji)}
                        emojiList={emojiList}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// --- Sub Component: Task Item Card (UI 통일) ---
const TaskItemCard: React.FC<{
  task: FriendTaskItem;
  reactions: TaskEmojiGroupResponse[];
  isOpen: boolean;
  onPickerToggle: () => void;
  onEmojiClick: (emoji: EmojiResponse) => void;
  emojiList: EmojiResponse[];
}> = ({ task, reactions, isOpen, onPickerToggle, onEmojiClick, emojiList }) => {
  return (
    <div className="relative group">
      <div className={`glass-card p-4 rounded-2xl bg-white border-primary/5 transition-all ${
        task.complete ? 'opacity-50' : 'hover:scale-[1.01]'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              task.complete ? 'bg-primary border-primary text-white scale-90' : 'border-gray-200'
            }`}>
              {task.complete && <Check size={12} />}
            </div>
            <span className={`text-sm font-medium leading-relaxed truncate ${
              task.complete ? 'line-through text-gray-400' : 'text-gray-800'
            }`}>
              {task.content}
            </span>
          </div>
          <button
            onClick={onPickerToggle}
            className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${
              isOpen ? 'bg-primary text-white shadow-lg' : 'bg-primary/5 text-primary hover:bg-primary/10'
            }`}
          >
            응원하기
          </button>
        </div>

        {/* Reactions Section */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50/50">
            {reactions.map(r => (
              <div key={r.emojiId} className="group/emoji relative">
                <button
                  onClick={() => {
                    const emoji = emojiList.find(e => e.emojiId === r.emojiId);
                    if (emoji) onEmojiClick(emoji);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all active:scale-95 ${
                    r.myReaction 
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">{r.emojiChar}</span>
                  <span className="text-[10px] font-bold">{r.count}</span>
                </button>
                
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
      </div>

      {/* Emoji Picker Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-14 z-50 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gray-100 flex gap-1"
          >
            {emojiList.map(emoji => {
              const cur = reactions.find(r => r.emojiId === emoji.emojiId);
              return (
                <button
                  key={emoji.emojiId}
                  onClick={() => onEmojiClick(emoji)}
                  className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl transition-all hover:bg-gray-50 hover:scale-110 active:scale-90 ${
                    cur?.myReaction ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                  }`}
                >
                  {emoji.emojiChar}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendTodoView;
