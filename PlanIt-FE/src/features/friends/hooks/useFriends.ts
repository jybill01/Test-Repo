import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, Friend, FriendRequest, PageResponse, ProcessFriendRequestRequest } from '../../../api/user.service';

export const useFriends = (page = 0, size = 20) => {
    return useQuery<PageResponse<Friend>, Error>({
        queryKey: ['friends', page, size],
        queryFn: () => userService.getFriends(page, size),
    });
};

export const useFriendRequests = (page = 0, size = 20) => {
    return useQuery<PageResponse<FriendRequest>, Error>({
        queryKey: ['friendRequests', page, size],
        queryFn: () => userService.getReceivedRequests(page, size),
    });
};

export const useProcessFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, ProcessFriendRequestRequest>({
        mutationFn: (request) => userService.processFriendRequest(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
            queryClient.invalidateQueries({ queryKey: ['friends'] });
        },
    });
};

export const useDeleteFriend = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: (friendshipId) => userService.deleteFriend(friendshipId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
        },
    });
};
