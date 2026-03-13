/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../api/user.service';

/**
 * 유저 검색 및 친구 요청 훅
 */
export const useSearchUsers = () => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const queryClient = useQueryClient();

    // 유저 검색
    const { data: searchResults, isLoading, refetch } = useQuery({
        queryKey: ['searchUsers', searchKeyword],
        queryFn: () => userService.searchUsers(searchKeyword),
        enabled: searchKeyword.length >= 2, // 최소 2자 이상 입력 시 검색
        staleTime: 30 * 1000, // 30초간 캐시 유지
    });

    // 친구 요청 보내기
    const sendRequestMutation = useMutation({
        mutationFn: (targetUserId: string) => userService.sendFriendRequest(targetUserId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
        },
    });

    return {
        searchKeyword,
        setSearchKeyword,
        searchResults: searchResults || [],
        isLoading,
        refetch,
        sendFriendRequest: sendRequestMutation.mutateAsync,
        isSending: sendRequestMutation.isPending,
    };
};
