import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Friend, FriendRequest } from '../../../types';

interface FriendsContextType {
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;
  friendRequests: FriendRequest[];
  setFriendRequests: (requests: FriendRequest[]) => void;
  friendSearchQuery: string;
  setFriendSearchQuery: (query: string) => void;
  selectedFriendId: string | null;
  setSelectedFriendId: (id: string | null) => void;
  friendToRemoveId: string | null;
  setFriendToRemoveId: (id: string | null) => void;
  reactionTaskId: string | null;
  setReactionTaskId: (id: string | null) => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [friends, setFriends] = useState<Friend[]>([
    { id: 'f1', nickname: '김철수', tasks: [{ id: 'ft1', text: '스쿼트 100개', date: today, completed: false, category: '운동' }] },
    { id: 'f2', nickname: '이영희', tasks: [{ id: 'ft2', text: '영어 단어 50개', date: today, completed: true, category: '언어' }] },
  ]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: 'r1', nickname: '박지민' },
  ]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendToRemoveId, setFriendToRemoveId] = useState<string | null>(null);
  const [reactionTaskId, setReactionTaskId] = useState<string | null>(null);

  const value = {
    friends,
    setFriends,
    friendRequests,
    setFriendRequests,
    friendSearchQuery,
    setFriendSearchQuery,
    selectedFriendId,
    setSelectedFriendId,
    friendToRemoveId,
    setFriendToRemoveId,
    reactionTaskId,
    setReactionTaskId,
  };

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
};

export const useFriendsContext = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriendsContext must be used within a FriendsProvider');
  }
  return context;
};
