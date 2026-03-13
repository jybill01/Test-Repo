import { useQuery } from '@tanstack/react-query';
import { userService, Category } from '../../../api/user.service';

export const useCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ['categories'],
        queryFn: () => userService.getCategories(),
        staleTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
        retry: 2, // 2번 재시도
    });
};
