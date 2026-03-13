import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { userService } from '../../../api/user.service';

export const CallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const processedRef = useRef(false);
    const [timeoutReached, setTimeoutReached] = useState(false);

    const processLogin = async () => {
        if (processedRef.current) {
            console.log('[CallbackPage] 이미 처리 중');
            return;
        }
        processedRef.current = true;

        try {
            console.log('[CallbackPage] 토큰 교환 완료, 세션 가져오기 시작');
            const session = await fetchAuthSession({ forceRefresh: true });
            const idToken = session.tokens?.idToken?.toString();

            if (!idToken) {
                console.error('[CallbackPage] idToken 없음');
                alert('로그인 처리 중 오류가 발생했습니다. (토큰 없음)');
                navigate('/');
                return;
            }

            console.log('[CallbackPage] idToken 획득 성공, 백엔드 로그인 호출');
            let authResponse;
            try {
                authResponse = await userService.login({ cognitoIdToken: idToken });
            } catch (loginError: any) {
                const errorCode = loginError?.response?.data?.code;
                console.log('[CallbackPage] 로그인 API 에러 발생, 코드:', errorCode);

                if (errorCode === 'U4014') {
                    // 신규 유저 (DB에 없음) → 온보딩으로
                    console.log('[CallbackPage] 신규 유저 감지(U4014) → 온보딩으로 이동');
                    sessionStorage.setItem('cognitoIdToken', idToken);
                    navigate('/onboarding');
                    return;
                }
                
                throw loginError;
            }

            console.log('[CallbackPage] 백엔드 응답:', authResponse);

            if (!authResponse) {
                // 신규 유저일 수도 있고, 탈퇴 유저일 수도 있음 → 탈퇴 여부 먼저 체크
                console.log('[CallbackPage] 백엔드 응답 null → 탈퇴 유저 체크');
                const withdrawnCheck = await userService.checkWithdrawn({
                    cognitoIdToken: idToken,
                });
                console.log('[CallbackPage] 탈퇴 유저 체크 결과:', withdrawnCheck);

                // 공통 응답 래퍼 { code, message, data } 대응
                const data = (withdrawnCheck as any)?.data ?? withdrawnCheck;

                // 서버가 isRestricted든 restricted든 둘 다 처리
                const isRestricted =
                    (data as any)?.isRestricted ?? (data as any)?.restricted;

                if (isRestricted) {
                    const availableAt = (data as any)?.availableAt;

                    alert(
                        `탈퇴 후 90일간 재가입이 불가능합니다.\n재가입 가능일: ${availableAt}`,
                    );
                    navigate('/');
                    return;
                }

                // 신규 유저 → 온보딩으로
                console.log('[CallbackPage] 신규 유저 → 온보딩으로');
                sessionStorage.setItem('cognitoIdToken', idToken);
                navigate('/onboarding');
                return;
            }

            // 기존 유저 → 로그인 완료
            login(authResponse);
            console.log('[CallbackPage] 로그인 완료 → 메인으로');
            navigate('/');
        } catch (error: any) {
            console.error('[CallbackPage] 처리 실패 상세:', error);
            console.error('[CallbackPage] 에러 메시지:', error?.message);
            console.error('[CallbackPage] 에러 응답:', error?.response?.data);
            console.error('[CallbackPage] 에러 상태코드:', error?.response?.status);
            alert(`로그인 처리 중 오류가 발생했습니다: ${error?.message}`);
            navigate('/');
        }
    };

    useEffect(() => {
        console.log('[CallbackPage] 마운트됨, Hub 리스너 등록');
        let timeoutId: NodeJS.Timeout;

        const unsubscribe = Hub.listen('auth', ({ payload }) => {
            console.log('[CallbackPage] Auth 이벤트:', payload.event, payload);

            if (payload.event === 'signInWithRedirect') {
                console.log(
                    '[CallbackPage] signInWithRedirect 이벤트 수신 → processLogin 호출',
                );
                clearTimeout(timeoutId);
                processLogin();
            }

            if (payload.event === 'signInWithRedirect_failure') {
                console.error('[CallbackPage] 로그인 실패:', payload.data);
                clearTimeout(timeoutId);
                alert('로그인에 실패했습니다. 다시 시도해주세요.');
                navigate('/');
            }
        });

        // 10초 타임아웃
        timeoutId = setTimeout(() => {
            console.warn('[CallbackPage] 10초 타임아웃 도달, Hub 이벤트 없음');
            setTimeoutReached(true);

            getCurrentUser()
                .then(() => {
                    console.log(
                        '[CallbackPage] 타임아웃 후 사용자 확인 성공 → processLogin 호출',
                    );
                    processLogin();
                })
                .catch((error) => {
                    console.error('[CallbackPage] 타임아웃 후 사용자 확인 실패:', error);
                    alert('로그인 처리 시간이 초과되었습니다. 다시 시도해주세요.');
                    navigate('/');
                });
        }, 10000);

        return () => {
            console.log('[CallbackPage] 언마운트, 리스너 해제');
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">로그인 처리 중...</p>
                <p className="mt-2 text-xs text-gray-400">
                    {timeoutReached
                        ? '처리 중입니다. 조금만 더 기다려주세요...'
                        : '잠시만 기다려주세요'}
                </p>
            </div>
        </div>
    );
};

export default CallbackPage;
