/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UpdateProfileRequest } from '../../../api/user.service';

/**
 * 사용자 프로필 관리 훅
 */
export const useUser = () => {
  const queryClient = useQueryClient();

  // 프로필 조회
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  // 프로필 수정
  const updateProfileMutation = useMutation({
    mutationFn: (request: UpdateProfileRequest) => userService.updateProfile(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  // 계정 삭제
  const deleteAccountMutation = useMutation({
    mutationFn: () => userService.withdraw(),
    onSuccess: () => {
      queryClient.clear(); // 모든 캐시 삭제
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
};
