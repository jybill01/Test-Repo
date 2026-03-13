import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signOut } from 'aws-amplify/auth';
import { userService, AuthResponse } from '../../../api/user.service';

interface AuthContextType {
    user: AuthResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (authResponse: AuthResponse) => void;
    logout: () => Promise<void>;
    updateUser: (user: Partial<AuthResponse>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            try {
                const storedUser = localStorage.getItem('user');
                const accessToken = localStorage.getItem('accessToken');
                const refreshToken = localStorage.getItem('refreshToken');

                if (storedUser && accessToken && refreshToken) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser({
                        ...parsedUser,
                        accessToken,
                        refreshToken,
                    });
                }
            } catch (error) {
                console.error('Failed to load user from localStorage:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = (authResponse: AuthResponse) => {
        if (!authResponse) {
            console.error('[AuthContext] login 호출됐지만 authResponse가 null입니다:', authResponse);
            return;
        }

        if (!authResponse.userId || !authResponse.accessToken || !authResponse.refreshToken) {
            console.error('[AuthContext] authResponse 필드 누락:', authResponse);
            return;
        }

        setUser(authResponse);

        localStorage.setItem('user', JSON.stringify({
            userId: authResponse.userId,
            nickname: authResponse.nickname,
            email: authResponse.email,
        }));
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
    };

    const logout = async () => {
        // Cognito 세션 클리어
        try {
            await signOut();
            console.log('[AuthContext] Cognito signOut 완료');
        } catch (error) {
            console.error('[AuthContext] Cognito signOut 실패:', error);
        }

        // 로컬 상태 및 스토리지 전체 클리어
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('cognitoIdToken');
    };

    const updateUser = (updates: Partial<AuthResponse>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);

            localStorage.setItem('user', JSON.stringify({
                userId: updatedUser.userId,
                nickname: updatedUser.nickname,
                email: updatedUser.email,
            }));
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
