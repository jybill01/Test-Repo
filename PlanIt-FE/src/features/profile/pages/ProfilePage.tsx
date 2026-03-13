import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userService, UpdateProfileRequest } from '../../../api/user.service';
import { useAuth } from '../../auth/context/AuthContext';
import { useCategories } from '../../auth/hooks/useCategories';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { User, Edit2, LogOut, Trash2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nickname: user?.nickname || '',
        selectedCategories: [] as number[],
    });

    const updateProfileMutation = useMutation({
        mutationFn: (request: UpdateProfileRequest) => userService.updateProfile(request),
        onSuccess: (response) => {
            updateUser({
                nickname: response.nickname,
                email: response.email,
            });
            setIsEditing(false);
            alert('프로필이 수정되었습니다.');
        },
        onError: (error: any) => {
            alert(error.message || '프로필 수정에 실패했습니다.');
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: () => userService.withdraw(),
        onSuccess: () => {
            logout();
            navigate('/login');
            alert('계정이 삭제되었습니다.');
        },
        onError: (error: any) => {
            alert(error.message || '계정 삭제에 실패했습니다.');
        },
    });

    const handleCategoryToggle = (categoryId: number) => {
        setFormData(prev => ({
            ...prev,
            selectedCategories: prev.selectedCategories.includes(categoryId)
                ? prev.selectedCategories.filter(id => id !== categoryId)
                : [...prev.selectedCategories, categoryId],
        }));
    };

    const handleSaveProfile = () => {
        if (!formData.nickname.trim()) {
            alert('닉네임을 입력해주세요.');
            return;
        }

        if (formData.selectedCategories.length === 0) {
            alert('최소 1개 이상의 관심 카테고리를 선택해주세요.');
            return;
        }

        updateProfileMutation.mutate({
            nickname: formData.nickname,
            interestCategoryIds: formData.selectedCategories,
        });
    };

    const handleWithdraw = () => {
        if (confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            withdrawMutation.mutate();
        }
    };

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            logout();
            navigate('/login');
        }
    };

    if (categoriesLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-8 h-8" />
                        내 프로필
                    </h1>
                </div>

                {/* 프로필 카드 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    {/* 프로필 정보 */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        className="text-xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-gray-900">{user?.nickname}</h2>
                                )}
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* 관심 카테고리 */}
                    {isEditing && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                관심 카테고리
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {categories?.map((category) => (
                                    <button
                                        key={category.categoryId}
                                        type="button"
                                        onClick={() => handleCategoryToggle(category.categoryId)}
                                        className={`py-2 px-4 rounded-md text-sm font-medium ${formData.selectedCategories.includes(category.categoryId)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 수정 버튼 */}
                    {isEditing && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={updateProfileMutation.isPending}
                                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {updateProfileMutation.isPending ? '저장 중...' : '저장'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                취소
                            </button>
                        </div>
                    )}
                </div>

                {/* 액션 버튼들 */}
                <div className="space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        <LogOut className="w-5 h-5" />
                        로그아웃
                    </button>

                    <button
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 border border-red-300 rounded-md text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                        <Trash2 className="w-5 h-5" />
                        {withdrawMutation.isPending ? '삭제 중...' : '계정 삭제'}
                    </button>
                </div>
            </div>
        </div>
    );
};
