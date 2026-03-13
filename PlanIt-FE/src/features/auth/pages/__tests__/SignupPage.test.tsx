import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SignupPage } from '../SignupPage';
import { AuthProvider } from '../../context/AuthContext';
import { userService } from '../../../../api/user.service';

// userService mock
vi.mock('../../../../api/user.service', () => ({
    userService: {
        signup: vi.fn(),
        getCategories: vi.fn(),
    },
}));

// react-router-dom mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

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

    return ({ children }: { children: import('react').ReactNode }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
            </QueryClientProvider>
        </BrowserRouter>
    );
};

describe('SignupPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // 카테고리 목록 mock
        vi.mocked(userService.getCategories).mockResolvedValue([
            { categoryId: 1, name: '운동', colorHex: '#FF5733', description: '' },
            { categoryId: 2, name: '독서', colorHex: '#33FF57', description: '' },
            { categoryId: 3, name: '공부', colorHex: '#3357FF', description: '' },
        ]);
    });

    it('회원가입 폼이 렌더링되어야 함', async () => {
        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        await waitFor(() => {
            expect(screen.queryByText(/로딩/i)).not.toBeInTheDocument();
        });

        // 기본 폼 요소 확인
        expect(screen.getByLabelText(/닉네임/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    });

    it('카테고리 목록이 표시되어야 함', async () => {
        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        await waitFor(() => {
            expect(screen.getByText('운동')).toBeInTheDocument();
            expect(screen.getByText('독서')).toBeInTheDocument();
            expect(screen.getByText('공부')).toBeInTheDocument();
        });
    });

    it('카테고리 선택이 동작해야 함', async () => {
        const user = userEvent.setup();
        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        await waitFor(() => {
            expect(screen.getByText('운동')).toBeInTheDocument();
        });

        const categoryButton = screen.getByText('운동');
        await user.click(categoryButton);

        // 선택된 상태 확인 (스타일 변경 등)
        expect(categoryButton.closest('button')).toHaveClass('selected');
    });

    it('유효성 검증이 동작해야 함', async () => {
        const user = userEvent.setup();
        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        await waitFor(() => {
            expect(screen.queryByText(/로딩/i)).not.toBeInTheDocument();
        });

        // 빈 폼으로 제출 시도
        const submitButton = screen.getByRole('button', { name: /회원가입/i });
        await user.click(submitButton);

        // 에러 메시지 확인
        await waitFor(() => {
            expect(screen.getByText(/닉네임을 입력해주세요/i)).toBeInTheDocument();
        });
    });

    it('회원가입이 성공적으로 처리되어야 함', async () => {
        const user = userEvent.setup();
        const mockResponse = {
            userId: 'user-123',
            nickname: 'testuser',
            email: 'test@example.com',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        };

        vi.mocked(userService.signup).mockResolvedValue(mockResponse);

        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        await waitFor(() => {
            expect(screen.queryByText(/로딩/i)).not.toBeInTheDocument();
        });

        // 폼 입력
        const nicknameInput = screen.getByLabelText(/닉네임/i);
        const emailInput = screen.getByLabelText(/이메일/i);

        await user.type(nicknameInput, 'testuser');
        await user.type(emailInput, 'test@example.com');

        // 카테고리 선택
        await waitFor(() => {
            expect(screen.getByText('운동')).toBeInTheDocument();
        });
        const categoryButton = screen.getByText('운동');
        await user.click(categoryButton);

        // 약관 동의
        const termsCheckbox = screen.getByRole('checkbox', { name: /서비스 이용약관/i });
        await user.click(termsCheckbox);

        // 제출
        const submitButton = screen.getByRole('button', { name: /회원가입/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(userService.signup).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('회원가입 실패 시 에러 메시지가 표시되어야 함', async () => {
        const user = userEvent.setup();
        const mockError = new Error('닉네임이 이미 사용 중입니다.');

        vi.mocked(userService.signup).mockRejectedValue(mockError);

        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        await waitFor(() => {
            expect(screen.queryByText(/로딩/i)).not.toBeInTheDocument();
        });

        // 폼 입력
        const nicknameInput = screen.getByLabelText(/닉네임/i);
        const emailInput = screen.getByLabelText(/이메일/i);

        await user.type(nicknameInput, 'testuser');
        await user.type(emailInput, 'test@example.com');

        // 제출
        const submitButton = screen.getByRole('button', { name: /회원가입/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/닉네임이 이미 사용 중입니다/i)).toBeInTheDocument();
        });
    });

    it('카테고리 로딩 중에는 로딩 스피너가 표시되어야 함', () => {
        vi.mocked(userService.getCategories).mockImplementation(
            () => new Promise(() => { }) // 무한 대기
        );

        const Wrapper = createWrapper();
        render(<SignupPage />, { wrapper: Wrapper });

        expect(screen.getByText(/로딩/i)).toBeInTheDocument();
    });
});
