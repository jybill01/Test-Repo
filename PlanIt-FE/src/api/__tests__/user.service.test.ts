import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { userService, SignupRequest, UpdateProfileRequest, ProcessFriendRequestRequest } from '../user.service';

// axios mock
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // axios.create mock 설정
        mockedAxios.create.mockReturnValue(mockedAxios as any);
    });

    describe('signup', () => {
        it('회원가입 요청을 성공적으로 처리해야 함', async () => {
            const mockRequest: SignupRequest = {
                nickname: 'testuser',
                email: 'test@example.com',
                cognitoIdToken: 'cognito-token-123',
                agreedTermIds: [1, 2],
                interestCategoryIds: [1, 2, 3],
                isRetentionAgreed: true,
            };

            const mockResponse = {
                data: {
                    data: {
                        userId: 'user-123',
                        nickname: 'testuser',
                        email: 'test@example.com',
                        accessToken: 'access-token',
                        refreshToken: 'refresh-token',
                    },
                },
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await userService.signup(mockRequest);

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.post).toHaveBeenCalledWith('/auth/signup', mockRequest);
        });

        it('회원가입 실패 시 에러를 던져야 함', async () => {
            const mockRequest: SignupRequest = {
                nickname: 'testuser',
                email: 'test@example.com',
                cognitoIdToken: 'cognito-token-123',
                agreedTermIds: [1, 2],
                interestCategoryIds: [1, 2, 3],
                isRetentionAgreed: true,
            };

            const mockError = new Error('Signup failed');
            mockedAxios.post.mockRejectedValue(mockError);

            await expect(userService.signup(mockRequest)).rejects.toThrow('Signup failed');
        });
    });

    describe('updateProfile', () => {
        it('프로필 수정 요청을 성공적으로 처리해야 함', async () => {
            const mockRequest: UpdateProfileRequest = {
                nickname: 'updateduser',
                interestCategoryIds: [1, 2, 3, 4],
            };

            const mockResponse = {
                data: {
                    data: {
                        userId: 'user-123',
                        nickname: 'updateduser',
                        email: 'test@example.com',
                    },
                },
            };

            mockedAxios.put.mockResolvedValue(mockResponse);

            const result = await userService.updateProfile(mockRequest);

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.put).toHaveBeenCalledWith('/profile', mockRequest);
        });
    });

    describe('searchUsers', () => {
        it('유저 검색 요청을 성공적으로 처리해야 함', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            userId: 'user-1',
                            nickname: 'user1',
                            email: 'user1@example.com',
                        },
                        {
                            userId: 'user-2',
                            nickname: 'user2',
                            email: 'user2@example.com',
                        },
                    ],
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await userService.searchUsers('user');

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('/search', {
                params: { nickname: 'user' },
            });
        });
    });

    describe('getFriends', () => {
        it('친구 목록 조회 요청을 성공적으로 처리해야 함', async () => {
            const mockResponse = {
                data: {
                    data: {
                        content: [
                            {
                                friendshipId: 1,
                                userId: 'user-1',
                                nickname: 'friend1',
                                email: 'friend1@example.com',
                                createdAt: '2026-03-01T00:00:00Z',
                            },
                        ],
                        page: 0,
                        size: 20,
                        totalElements: 1,
                        totalPages: 1,
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await userService.getFriends(0, 20);

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('/friends', {
                params: { page: 0, size: 20 },
            });
        });
    });

    describe('getReceivedRequests', () => {
        it('받은 친구 요청 목록 조회를 성공적으로 처리해야 함', async () => {
            const mockResponse = {
                data: {
                    data: {
                        content: [
                            {
                                friendshipId: 1,
                                requesterId: 'user-1',
                                requesterNickname: 'requester1',
                                requesterEmail: 'requester1@example.com',
                                createdAt: '2026-03-01T00:00:00Z',
                            },
                        ],
                        page: 0,
                        size: 20,
                        totalElements: 1,
                        totalPages: 1,
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await userService.getReceivedRequests(0, 20);

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('/friends/requests/received', {
                params: { page: 0, size: 20 },
            });
        });
    });

    describe('processFriendRequest', () => {
        it('친구 요청 처리를 성공적으로 수행해야 함', async () => {
            const request: ProcessFriendRequestRequest = {
                friendshipId: 1,
                status: 'ACCEPTED',
            };

            const mockResponse = {
                data: {
                    data: null,
                },
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            await userService.processFriendRequest(request);

            expect(mockedAxios.post).toHaveBeenCalledWith('/friends/requests', request);
        });
    });

    describe('deleteFriend', () => {
        it('친구 삭제를 성공적으로 수행해야 함', async () => {
            const mockResponse = {
                data: {
                    data: null,
                },
            };

            mockedAxios.delete.mockResolvedValue(mockResponse);

            await userService.deleteFriend(1);

            expect(mockedAxios.delete).toHaveBeenCalledWith('/friends/1');
        });
    });

    describe('getCategories', () => {
        it('카테고리 목록 조회를 성공적으로 처리해야 함', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            categoryId: 1,
                            name: '운동',
                            colorCode: '#FF5733',
                        },
                        {
                            categoryId: 2,
                            name: '독서',
                            colorCode: '#33FF57',
                        },
                    ],
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await userService.getCategories();

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('/categories');
        });
    });

    describe('getTerms', () => {
        it('약관 목록 조회를 성공적으로 처리해야 함', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            termId: 1,
                            title: '서비스 이용약관',
                            content: '약관 내용...',
                            type: 'SERVICE',
                            isRequired: true,
                            version: '1.0',
                        },
                    ],
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await userService.getTerms();

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('/terms');
        });

        it('타입별 약관 조회를 성공적으로 처리해야 함', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            termId: 1,
                            title: '서비스 이용약관',
                            content: '약관 내용...',
                            type: 'SERVICE',
                            isRequired: true,
                            version: '1.0',
                        },
                    ],
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await userService.getTerms('SERVICE');

            expect(result).toEqual(mockResponse.data.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('/terms', {
                params: { type: 'SERVICE' },
            });
        });
    });

    describe('withdraw', () => {
        it('계정 삭제를 성공적으로 수행해야 함', async () => {
            const mockResponse = {
                data: {
                    data: null,
                },
            };

            mockedAxios.delete.mockResolvedValue(mockResponse);

            await userService.withdraw();

            expect(mockedAxios.delete).toHaveBeenCalledWith('/auth/withdraw');
        });
    });
});
