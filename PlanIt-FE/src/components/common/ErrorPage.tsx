/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, Home, WifiOff, ServerCrash, Lock } from 'lucide-react';

export type ErrorType = '404' | '500' | 'network' | 'unauthorized' | 'forbidden' | 'generic';

interface ErrorPageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

const errorConfig = {
  '404': {
    icon: AlertCircle,
    title: '페이지를 찾을 수 없어요',
    message: '요청하신 페이지가 존재하지 않거나 이동되었을 수 있어요.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  '500': {
    icon: ServerCrash,
    title: '서버 오류가 발생했어요',
    message: '일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  network: {
    icon: WifiOff,
    title: '네트워크 연결 오류',
    message: '인터넷 연결을 확인하고 다시 시도해주세요.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  unauthorized: {
    icon: Lock,
    title: '로그인이 필요해요',
    message: '이 페이지에 접근하려면 로그인이 필요합니다.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  forbidden: {
    icon: Lock,
    title: '접근 권한이 없어요',
    message: '이 페이지에 접근할 권한이 없습니다.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  generic: {
    icon: AlertCircle,
    title: '오류가 발생했어요',
    message: '예상치 못한 문제가 발생했어요. 다시 시도해주세요.',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
};

const ErrorPage: React.FC<ErrorPageProps> = ({
  type = 'generic',
  title,
  message,
  onRetry,
  onGoHome,
  showHomeButton = true,
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[500px] px-6 py-12"
    >
      {/* Error Icon with Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mb-8"
      >
        {/* Outer Ring */}
        <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-sky/10 animate-pulse" />
        
        {/* Icon Container */}
        <div className={`relative w-32 h-32 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon size={48} className={config.color} strokeWidth={1.5} />
        </div>

        {/* Floating Particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 ${config.bgColor} rounded-full`}
            style={{
              top: `${20 + i * 20}%`,
              left: `${10 + i * 30}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>

      {/* Error Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-gray-800 mb-3 text-center"
      >
        {title || config.title}
      </motion.h2>

      {/* Error Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-gray-500 text-center mb-8 max-w-[280px] leading-relaxed"
      >
        {message || config.message}
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-3 w-full max-w-[280px]"
      >
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-primary to-sky text-white rounded-2xl font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw size={18} />
            다시 시도하기
          </button>
        )}

        {showHomeButton && onGoHome && (
          <button
            onClick={onGoHome}
            className="w-full py-3.5 px-6 glass-card rounded-2xl font-semibold text-sm text-gray-700 hover:bg-white/90 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home size={18} />
            홈으로 돌아가기
          </button>
        )}
      </motion.div>

      {/* Additional Help Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-gray-400 text-center mt-8"
      >
        문제가 계속되면 고객센터로 문의해주세요
      </motion.p>
    </motion.div>
  );
};

export default ErrorPage;
