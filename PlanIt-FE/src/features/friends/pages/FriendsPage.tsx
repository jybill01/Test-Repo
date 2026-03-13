/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFriends, useFriendRequests, useProcessFriendRequest, useDeleteFriend } from '../hooks/useFriends';
import { useSearchUsers } from '../hooks/useSearchUsers';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { UserPlus, UserMinus, Check, X, Search, Users, Bell } from 'lucide-react';
import { Friend } from '../../../api/user.service';
import FriendTodoView from '../components/FriendTodoView';
import { motion, AnimatePresence } from 'motion/react';

export const FriendsPage: React.FC = () => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [reactionTaskId, setReactionTaskId] = useState<string | null>(null);

  const { data: friendsData, isLoading: friendsLoading, refetch: refetchFriends } = useFriends(0, 50);
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useFriendRequests(0, 50);
  const processRequestMutation = useProcessFriendRequest();
  const deleteFriendMutation = useDeleteFriend();

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isLoading: searchLoading,
    sendFriendRequest,
    isSending
  } = useSearchUsers();

  if (friendsLoading || requestsLoading) return <LoadingSpinner />;

  if (selectedFriend) {
    return (
      <FriendTodoView
        friend={{ id: selectedFriend.userId, nickname: selectedFriend.nickname, tasks: [] }}
        onBack={() => { setSelectedFriend(null); setReactionTaskId(null); }}
        reactionTaskId={reactionTaskId}
        setReactionTaskId={setReactionTaskId}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      
      {/* 1. 검색창 Section */}
      <section>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="새로운 친구의 닉네임 검색..."
            className="w-full bg-white border-primary/5 glass-card py-4 pl-12 pr-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        
        {/* 검색 결과 레이어 */}
        <AnimatePresence>
          {searchKeyword.length >= 2 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 bg-white rounded-2xl shadow-xl border border-primary/5 overflow-hidden"
            >
              {searchLoading ? (
                <div className="p-4 flex justify-center"><LoadingSpinner /></div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">결과가 없습니다</div>
              ) : (
                searchResults.map((user) => (
                  <div key={user.userId} className="p-4 flex items-center justify-between border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-xs">{user.nickname[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{user.nickname}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user.userId).then(() => { alert('요청을 보냈습니다'); setSearchKeyword(''); })}
                      disabled={isSending}
                      className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      요청
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. 친구 요청 Section (있을 때만 표시) */}
      {requestsData && requestsData.content.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Bell size={12} />
            새로운 친구 요청
          </h4>
          <div className="space-y-2">
            {requestsData.content.map((request) => (
              <div key={request.friendshipId} className="glass-card p-4 rounded-3xl bg-amber-50/30 border-amber-200/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold text-xs">{request.nickname[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{request.nickname}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{request.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => processRequestMutation.mutate({ friendshipId: request.friendshipId, status: 'ACCEPTED' })}
                    className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => processRequestMutation.mutate({ friendshipId: request.friendshipId, status: 'REJECTED' })}
                    className="w-8 h-8 rounded-lg bg-white text-gray-400 border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. 내 친구 목록 Section */}
      <section>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
          <Users size={12} />
          내 친구 목록 ({friendsData?.totalElements || 0})
        </h4>
        <div className="space-y-3">
          {friendsData?.content.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border-dashed border-gray-200 bg-white/50">
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">아직 친구가 없습니다</p>
            </div>
          ) : (
            friendsData?.content.map((friend) => (
              <div 
                key={friend.friendshipId} 
                className="glass-card p-4 rounded-3xl bg-white border-primary/5 flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-sm shadow-inner">
                    {friend.nickname[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">{friend.nickname}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{friend.email}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (confirm(`${friend.nickname}님을 친구 목록에서 삭제하시겠습니까?`)) {
                      deleteFriendMutation.mutate(friend.friendshipId);
                    }
                  }}
                  className="p-2 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
};
