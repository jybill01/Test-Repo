/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { useCategories } from '../../auth/hooks/useCategories';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const MyPage: React.FC = () => {
  const { profile, updateProfile, deleteAccount, isLoading } = useUser();
  const { data: categories } = useCategories();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [tempCategoryIds, setTempCategoryIds] = useState<number[]>([]);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // 프로필 수정 모드 진입
  const handleEditStart = () => {
    if (profile) {
      setTempNickname(profile.nickname);
      setTempCategoryIds(profile.interests.map(c => c.categoryId));
      setIsEditingProfile(true);
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (tempCategoryIds.length < 3) {
      alert('카테고리를 최소 3개 이상 선택해주세요.');
      return;
    }

    if (tempCategoryIds.length > 4) {
      alert('카테고리는 최대 4개까지 선택할 수 있습니다.');
      return;
    }

    try {
      await updateProfile({
        nickname: tempNickname,
        interestCategoryIds: tempCategoryIds,
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('프로필 수정 실패:', error);
    }
  };

  // 계정 삭제
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('계정 삭제 실패:', error);
    }
  };

  // 카테고리 토글
  const toggleCategory = (categoryId: number) => {
    if (tempCategoryIds.includes(categoryId)) {
      setTempCategoryIds(tempCategoryIds.filter(id => id !== categoryId));
    } else if (tempCategoryIds.length < 4) {
      setTempCategoryIds([...tempCategoryIds, categoryId]);
    } else {
      alert('카테고리는 최대 4개까지 선택할 수 있습니다.');
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      key="mypage"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col pt-4"
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Profile Card */}
        <div className="glass-card p-6 rounded-[32px] mb-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
              {profile.nickname[0].toUpperCase()}
            </div>
            {isEditingProfile ? (
              <input
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value)}
                className="text-center text-lg font-bold bg-gray-50 rounded-xl px-4 py-2 outline-none border-2 border-primary/20"
                placeholder="닉네임 입력"
              />
            ) : (
              <h4 className="text-lg font-bold">{profile.nickname}</h4>
            )}
            <p className="text-xs text-gray-400 mt-1">{profile.email}</p>
          </div>

          <div className="space-y-6">
            <div>
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                관심 카테고리
              </h5>
              <div className="flex flex-wrap gap-2">
                {isEditingProfile ? (
                  // 수정 모드: 모든 카테고리 표시
                  categories?.map(category => {
                    const isSelected = tempCategoryIds.includes(category.categoryId);
                    return (
                      <button
                        key={category.categoryId}
                        onClick={() => toggleCategory(category.categoryId)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${isSelected
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {category.name}
                      </button>
                    );
                  })
                ) : (
                  // 조회 모드: 선택된 카테고리만 표시
                  profile.interests.map(category => (
                    <span
                      key={category.categoryId}
                      className="px-3 py-1.5 bg-primary/5 text-primary text-[11px] font-bold rounded-lg"
                      style={{ backgroundColor: `${category.colorHex}20`, color: category.colorHex }}
                    >
                      {category.name}
                    </span>
                  ))
                )}
              </div>
              {isEditingProfile && (
                <p className="text-xs text-gray-400 mt-2">
                  3~4개 선택해주세요 ({tempCategoryIds.length}/4)
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                연결된 계정
              </h5>
              <div className="flex items-center gap-3">
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  className="w-4 h-4"
                  alt="Google"
                />
                <span className="text-xs font-bold text-gray-600">Google 계정 연결됨</span>
              </div>
            </div>
          </div>
        </div>

        {/* 프로필 수정/저장 버튼 */}
        <div className="mb-4">
          {isEditingProfile ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold"
                disabled={!tempNickname.trim() || tempCategoryIds.length < 3 || tempCategoryIds.length > 4}
              >
                저장
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditStart}
              className="w-full py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              프로필 수정
            </button>
          )}
        </div>

        {/* 계정 탈퇴 버튼 */}
        <button
          onClick={() => setIsDeletingAccount(true)}
          className="w-full py-4 text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
        >
          계정 탈퇴
        </button>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {isDeletingAccount && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-[32px] w-full max-w-[300px] text-center shadow-2xl"
            >
              <h3 className="font-bold mb-2">정말 탈퇴하시겠어요?</h3>
              <p className="text-xs text-gray-500 mb-6">
                탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeletingAccount(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold"
                >
                  탈퇴하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyPage;
