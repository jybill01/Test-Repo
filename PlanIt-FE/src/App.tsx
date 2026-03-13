/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Brain, BarChart3, Rocket, Check, Home, Calendar as CalendarIcon, Plus, MoreVertical, Edit2, Trash2, ArrowRight, Users, User, BarChart2, MessageCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Header from './components/layout/Header';
import BottomNav from './components/navigation/BottomNav';
import { Task, Friend, FriendRequest, ViewMode, Tab } from './types';
import { FriendsProvider } from './features/friends/context/FriendsContext';
import { TasksProvider } from './features/tasks/context/TasksContext';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// 코드 스플리팅: 페이지 컴포넌트를 lazy loading
const PageRenderer = lazy(() => import('./components/layout/PageRenderer'));
const OnboardingPage = lazy(() => import('./features/onboarding/pages/OnboardingPage'));
const CallbackPage = lazy(() => import('./features/auth/pages/CallbackPage'));

// KeywordChip은 common 컴포넌트에서 import
import KeywordChip from './components/common/KeywordChip';

// --- Main App ---

function AppContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(today);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // --- My Page State ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);
  const [tempKeywords, setTempKeywords] = useState<string[]>(selectedKeywords);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // --- Report Data ---
  const weeklyPerformance = [
    { day: '월', rate: 85, postponed: 2 },
    { day: '화', rate: 70, postponed: 1 },
    { day: '수', rate: 90, postponed: 0 },
    { day: '목', rate: 65, postponed: 4 },
    { day: '금', rate: 80, postponed: 1 },
    { day: '토', rate: 95, postponed: 0 },
    { day: '일', rate: 40, postponed: 5 },
  ];

  const growthData = [
    { month: '11월', score: 45 },
    { month: '12월', score: 62 },
    { month: '1월', score: 78 },
    { month: '현재', score: 88 },
  ];

  const keywords = ['언어', '운동', '마인드 컨트롤', '시간관리', '투자', '심리', '독서', '코딩'];

  // 로딩 중
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 인증되지 않은 경우 온보딩 페이지 표시
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <OnboardingPage />
      </Suspense>
    );
  }

  // 인증된 경우 메인 앱 표시
  return (
    <TasksProvider selectedKeywords={selectedKeywords}>
      <FriendsProvider>
        <div className="flex items-center justify-center min-h-screen bg-[#F0F4FF] p-4">
          {/* 개발용 임시 로그아웃 버튼 */}
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                if (confirm('로그아웃 하시겠습니까?')) {
                  logout();
                  window.location.href = '/';
                }
              }}
              className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-red-600 transition-colors"
            >
              로그아웃 (개발용)
            </button>
          )}

          <div className="w-full max-w-[420px] h-[840px] bg-[#F7F9FF] rounded-[40px] shadow-2xl overflow-hidden relative border-[8px] border-white flex flex-col">

            {/* Header */}
            <Header nickname={user?.nickname || nickname} />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4">
              <Suspense fallback={<LoadingSpinner />}>
                <PageRenderer
                  today={today}
                  selectedKeywords={selectedKeywords}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  nickname={user?.nickname || nickname}
                  setNickname={setNickname}
                  isEditingProfile={isEditingProfile}
                  setIsEditingProfile={setIsEditingProfile}
                  tempNickname={tempNickname}
                  setTempNickname={setTempNickname}
                  keywords={keywords}
                  tempKeywords={tempKeywords}
                  setTempKeywords={setTempKeywords}
                  setSelectedKeywords={setSelectedKeywords}
                  isDeletingAccount={isDeletingAccount}
                  setIsDeletingAccount={setIsDeletingAccount}
                  KeywordChip={KeywordChip}
                  weeklyPerformance={weeklyPerformance}
                  growthData={growthData}
                />
              </Suspense>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

          </div>
        </div>
      </FriendsProvider>
    </TasksProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* /auth/callback은 AuthProvider 안에서 처리 */}
        <Route
          path="/auth/callback"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <CallbackPage />
            </Suspense>
          }
        />
        {/* 나머지 모든 경로 */}
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}

// --- Navigation Component ---
