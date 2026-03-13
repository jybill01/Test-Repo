import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { userService, SignupRequest } from '../../../api/user.service';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        cognitoIdToken: '', // Cognito 로그인 후 받은 ID Token
        selectedCategories: [] as number[],
        agreedTerms: [] as number[],
        isRetentionAgreed: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const signupMutation = useMutation({
        mutationFn: (request: SignupRequest) => userService.signup(request),
        onSuccess: (response) => {
            login(response);
            navigate('/');
        },
        onError: (error: any) => {
            setErrors({ submit: error.message || '회원가입에 실패했습니다.' });
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

    const handleTermToggle = (termId: number) => {
        setFormData(prev => ({
            ...prev,
            agreedTerms: prev.agreedTerms.includes(termId)
                ? prev.agreedTerms.filter(id => id !== termId)
                : [...prev.agreedTerms, termId],
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nickname.trim()) {
            newErrors.nickname = '닉네임을 입력해주세요.';
        }

        if (!formData.email.trim()) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        if (formData.selectedCategories.length === 0) {
            newErrors.categories = '최소 1개 이상의 관심 카테고리를 선택해주세요.';
        }

        if (formData.agreedTerms.length === 0) {
            newErrors.terms = '필수 약관에 동의해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const request: SignupRequest = {
            nickname: formData.nickname,
            email: formData.email,
            cognitoIdToken: formData.cognitoIdToken,
            agreedTermIds: formData.agreedTerms,
            interestCategoryIds: formData.selectedCategories,
            isRetentionAgreed: formData.isRetentionAgreed,
        };

        signupMutation.mutate(request);
    };

    if (categoriesLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    회원가입
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* 닉네임 입력 */}
                        <div>
                            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                                닉네임
                            </label>
                            <input
                                id="nickname"
                                type="text"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {errors.nickname && (
                                <p className="mt-2 text-sm text-red-600">{errors.nickname}</p>
                            )}
                        </div>

                        {/* 이메일 입력 */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                이메일
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* 관심 카테고리 선택 */}
                        <div>
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
                            {errors.categories && (
                                <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
                            )}
                        </div>

                        {/* 약관 동의 */}
                        <div>
                            <div className="flex items-center">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={formData.agreedTerms.includes(1)}
                                    onChange={() => handleTermToggle(1)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                    서비스 이용약관 및 개인정보 처리방침에 동의합니다 (필수)
                                </label>
                            </div>
                            {errors.terms && (
                                <p className="mt-2 text-sm text-red-600">{errors.terms}</p>
                            )}
                        </div>

                        {/* 90일 보관 정책 */}
                        <div>
                            <div className="flex items-center">
                                <input
                                    id="retention"
                                    type="checkbox"
                                    checked={formData.isRetentionAgreed}
                                    onChange={(e) => setFormData({ ...formData, isRetentionAgreed: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="retention" className="ml-2 block text-sm text-gray-900">
                                    90일 보관 정책에 동의합니다 (선택)
                                </label>
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {errors.submit && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-800">{errors.submit}</p>
                            </div>
                        )}

                        {/* 제출 버튼 */}
                        <button
                            type="submit"
                            disabled={signupMutation.isPending}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {signupMutation.isPending ? '처리 중...' : '회원가입'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
