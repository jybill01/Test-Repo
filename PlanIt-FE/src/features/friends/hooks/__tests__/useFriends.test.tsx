import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useFriends, useFriendRequests, useProcessFriendRequest, useDeleteFriend } from '../useFriends';
import { userService } from '../../../../api/user.service';

// userService mock
vi.mock('../../../../api/user.service', () => ({
    userService: {
        getFriends: vi.fn(),
        getReceivedRequests: vi.fn(),
        processFriendRequest: vi.fn(),
        deleteFriend: vi.fn(),
    },
}));

// QueryClient wrapper
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useFriends', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('친구 목록을 성공적으로 가져와야 함', async () => {
        const mockFriends = {
            content: [
                {
                    friendshipId: 1,
                    userId: 'user-1',
                    nickname: 'friend1',
                    email: 'friend1@example.com',
                    status: 'ACCEPTED',
                    createdAt: '2026-03-01T00:00:00Z',
                },
                {
                    friendshipId: 2,
                    userId: 'user-2',
                    nickname: 'friend2',
                    email: 'friend2@example.com',
                    status: 'ACCEPTED',
                    createdAt: '2026-03-02T00:00:00Z',
                },
            ],
            page: 0,
            size: 20,
            totalElements: 2,
            totalPages: 1,
            number: 0,
            first: true,
            last: true,
            empty: false,
        };

        vi.mocked(userService.getFriends).mockResolvedValue(mockFriends);

        const { result } = renderHook(() => useFriends(0, 20), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockFriends);
        expect(userService.getFriends).toHaveBeenCalledWith(0, 20);
    });

    it('친구 목록 가져오기 실패 시 에러를 반환해야 함', async () => {
        const mockError = new Error('Failed to fetch friends');
        vi.mocked(userService.getFriends).mockRejectedValue(mockError);

        const { result } = renderHook(() => useFriends(0, 20), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(mockError);
    });
});

describe('useFriendRequests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('받은 친구 요청 목록을 성공적으로 가져와야 함', async () => {
        const mockRequests = {
            content: [
                {
                    friendshipId: 1,
                    userId: 'user-1',
                    nickname: 'requester1',
                    email: 'requester1@example.com',
                    status: 'PENDING',
                    createdAt: '2026-03-01T00:00:00Z',
                },
            ],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
            number: 0,
            first: true,
            last: true,
            empty: false,
        };

        vi.mocked(userService.getReceivedRequests).mockResolvedValue(mockRequests);

        const { result } = renderHook(() => useFriendRequests(0, 20), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockRequests);
        expect(userService.getReceivedRequests).toHaveBeenCalledWith(0, 20);
    });

    it('친구 요청 목록 가져오기 실패 시 에러를 반환해야 함', async () => {
        const mockError = new Error('Failed to fetch friend requests');
        vi.mocked(userService.getReceivedRequests).mockRejectedValue(mockError);

        const { result } = renderHook(() => useFriendRequests(0, 20), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(mockError);
    });
});

describe('useProcessFriendRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('친구 요청을 성공적으로 처리해야 함', async () => {
        vi.mocked(userService.processFriendRequest).mockResolvedValue(undefined);

        const { result } = renderHook(() => useProcessFriendRequest(), {
            wrapper: createWrapper(),
        });

        const request = {
            friendshipId: 1,
            status: 'ACCEPTED' as const,
        };

        result.current.mutate(request);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(userService.processFriendRequest).toHaveBeenCalledWith(request);
    });

    it('친구 요청 처리 실패 시 에러를 반환해야 함', async () => {
        const mockError = new Error('Failed to process friend request');
        vi.mocked(userService.processFriendRequest).mockRejectedValue(mockError);

        const { result } = renderHook(() => useProcessFriendRequest(), {
            wrapper: createWrapper(),
        });

        const request = {
            friendshipId: 1,
            status: 'ACCEPTED' as const,
        };

        result.current.mutate(request);

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(mockError);
    });
});

describe('useDeleteFriend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('친구를 성공적으로 삭제해야 함', async () => {
        vi.mocked(userService.deleteFriend).mockResolvedValue(undefined);

        const { result } = renderHook(() => useDeleteFriend(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(userService.deleteFriend).toHaveBeenCalledWith(1);
    });

    it('친구 삭제 실패 시 에러를 반환해야 함', async () => {
        const mockError = new Error('Failed to delete friend');
        vi.mocked(userService.deleteFriend).mockRejectedValue(mockError);

        const { result } = renderHook(() => useDeleteFriend(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(mockError);
    });
});
