/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { ErrorType } from '../components/common/ErrorPage';

interface ErrorState {
  hasError: boolean;
  type: ErrorType;
  title?: string;
  message?: string;
}

/**
 * API 에러 처리를 위한 커스텀 훅
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    type: 'generic',
  });

  /**
   * 에러 처리 함수
   */
  const handleError = useCallback((err: unknown) => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      switch (status) {
        case 401:
          setError({
            hasError: true,
            type: 'unauthorized',
            message: message || '로그인이 필요합니다.',
          });
          break;

        case 403:
          setError({
            hasError: true,
            type: 'forbidden',
            message: message || '접근 권한이 없습니다.',
          });
          break;

        case 404:
          setError({
            hasError: true,
            type: '404',
            message: message || '요청한 리소스를 찾을 수 없습니다.',
          });
          break;

        case 500:
        case 502:
        case 503:
          setError({
            hasError: true,
            type: '500',
            message: message || '서버 오류가 발생했습니다.',
          });
          break;

        default:
          if (err.code === 'ERR_NETWORK') {
            setError({
              hasError: true,
              type: 'network',
              message: '네트워크 연결을 확인해주세요.',
            });
          } else {
            setError({
              hasError: true,
              type: 'generic',
              message: message || '오류가 발생했습니다.',
            });
          }
      }
    } else if (err instanceof Error) {
      setError({
        hasError: true,
        type: 'generic',
        message: err.message,
      });
    } else {
      setError({
        hasError: true,
        type: 'generic',
        message: '알 수 없는 오류가 발생했습니다.',
      });
    }
  }, []);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError({
      hasError: false,
      type: 'generic',
    });
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};
