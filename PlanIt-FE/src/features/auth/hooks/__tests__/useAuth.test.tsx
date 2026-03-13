import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';
import { AuthResponse } from '../../../../api/user.service';

// Wrapper 컴포넌트
const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
    beforeEach(() => {
        // localStorage 초기화
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('초기 상태는 인증되지 않은 상태여야 함', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('login 함수는 사용자 정보를 설정하고 localStorage에 저장해야 함', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const mockAuthResponse: AuthResponse = {
            userId: 'test-user-id',
            nickname: 'testuser',
            email: 'test@example.com',
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        };

        act(() => {
            result.current.login(mockAuthResponse);
        });

        expect(result.current.user).toEqual(mockAuthResponse);
        expect(result.current.isAuthenticated).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'user',
            JSON.stringify({
                userId: mockAuthResponse.userId,
                nickname: mockAuthResponse.nickname,
                email: mockAuthResponse.email,
            })
        );
        expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', mockAuthResponse.accessToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockAuthResponse.refreshToken);
    });

    it('logout 함수는 사용자 정보를 제거하고 localStorage를 정리해야 함', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const mockAuthResponse: AuthResponse = {
            userId: 'test-user-id',
            nickname: 'testuser',
            email: 'test@example.com',
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        };

        act(() => {
            result.current.login(mockAuthResponse);
        });

        expect(result.current.isAuthenticated).toBe(true);

        act(() => {
            result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.removeItem).toHaveBeenCalledWith('user');
        expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('updateUser 함수는 사용자 정보를 업데이트해야 함', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const mockAuthResponse: AuthResponse = {
            userId: 'test-user-id',
            nickname: 'testuser',
            email: 'test@example.com',
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        };

        act(() => {
            result.current.login(mockAuthResponse);
        });

        const updates = {
            nickname: 'updateduser',
        };

        act(() => {
            result.current.updateUser(updates);
        });

        expect(result.current.user?.nickname).toBe('updateduser');
        expect(result.current.user?.email).toBe('test@example.com');
    });

    it('localStorage에 저장된 사용자 정보를 로드해야 함', async () => {
        const mockUser = {
            userId: 'test-user-id',
            nickname: 'testuser',
            email: 'test@example.com',
        };

        // localStorage mock 설정
        vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
            if (key === 'user') return JSON.stringify(mockUser);
            if (key === 'accessToken') return 'mock-access-token';
            if (key === 'refreshToken') return 'mock-refresh-token';
            return null;
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toEqual({
            ...mockUser,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        });
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('AuthProvider 없이 useAuth를 사용하면 에러를 던져야 함', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });
});
