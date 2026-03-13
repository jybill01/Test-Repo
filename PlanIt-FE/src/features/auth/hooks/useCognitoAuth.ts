/**
 * Cognito 인증 훅
 */

import { useState, useEffect } from 'react';
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export const useCognitoAuth = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        console.log('[useCognitoAuth] checkUser 시작');
        try {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            console.log('[useCognitoAuth] 현재 사용자:', currentUser);
            setUser(currentUser);

            const session = await fetchAuthSession();
            console.log('[useCognitoAuth] 세션:', session);
            const token = session.tokens?.idToken?.toString();
            console.log('[useCognitoAuth] ID Token:', token ? '존재함' : '없음');
            setIdToken(token || null);
            setError(null);
        } catch (error: any) {
            console.log('[useCognitoAuth] 로그인된 사용자 없음:', error.message);
            setUser(null);
            setIdToken(null);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        console.log('[useCognitoAuth] Google 로그인 시작');
        console.log('[useCognitoAuth] 환경 변수 확인:', {
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
            domain: import.meta.env.VITE_COGNITO_DOMAIN,
            redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
        });

        try {
            // 기존 세션 완전 제거
            try {
                await signOut({ global: true });
            } catch {
                // 로그아웃 실패해도 계속 진행
            }

            // 스토리지 완전 초기화
            localStorage.clear();
            sessionStorage.clear();

            console.log('[useCognitoAuth] signInWithRedirect 호출 직전');
            await signInWithRedirect({ provider: 'Google' });
        } catch (error: any) {
            console.error('[useCognitoAuth] 로그인 에러:', error);
            console.error('[useCognitoAuth] 에러 타입:', typeof error);
            console.error('[useCognitoAuth] 에러 상세:', {
                name: error?.name,
                message: error?.message,
                toString: error?.toString(),
            });
            setError(error.message);
            alert(`로그인 실패: ${error.message || error.toString()}`);
            throw error;
        }
    };

    const logout = async () => {
        console.log('[useCognitoAuth] 로그아웃 시작');
        try {
            await signOut({ global: true });
            setUser(null);
            setIdToken(null);
            setError(null);
            localStorage.clear();
            sessionStorage.clear();
            console.log('[useCognitoAuth] 로그아웃 완료');
        } catch (error: any) {
            console.error('[useCognitoAuth] 로그아웃 에러:', error);
            setError(error.message);
            throw error;
        }
    };

    return {
        isLoading,
        user,
        idToken,
        error,
        login,
        logout,
        checkUser,
    };
};
