import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { userService, LoginRequest } from '../../../api/user.service';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [cognitoIdToken, setCognitoIdToken] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: (request: LoginRequest) => userService.login(request),
        onSuccess: (response) => {
            login(response);
            navigate('/');
        },
        onError: (error: any) => {
            setError(error.message || '로그인에 실패했습니다.');
        },
    });

    const handleCognitoLogin = () => {
        // TODO: Cognito 로그인 플로우 구현
        // 실제로는 AWS Cognito SDK를 사용하여 로그인 처리
        console.log('Cognito 로그인 시작');

        // 임시: 테스트용 토큰
        const testToken = 'test-cognito-id-token';
        setCognitoIdToken(testToken);

        loginMutation.mutate({ cognitoIdToken: testToken });
    };

    if (loginMutation.isPending) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    PlanIt 로그인
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    AI 기반 자기계발 투두리스트
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        {/* Cognito 로그인 버튼 */}
                        <button
                            onClick={handleCognitoLogin}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            AWS Cognito로 로그인
                        </button>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* 회원가입 링크 */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                계정이 없으신가요?{' '}
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    회원가입
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
