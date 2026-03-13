/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 프로젝트 전역 색상 상수
 * Tailwind CSS 색상과 일치하도록 관리
 */

export const COLORS = {
  // Primary Colors
  primary: '#7C5CFF',
  primaryLight: '#BBA8FF',
  sky: '#4DD3FF',
  
  // Gray Scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Semantic Colors
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    400: '#F87171',
    500: '#EF4444',
    700: '#B91C1C',
    800: '#991B1B',
  },
  
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
  },
  
  indigo: {
    600: '#4F46E5',
  },
  
  // Chart Colors
  chart: {
    primary: '#7C5CFF',
    secondary: '#FF8A8A',
    tertiary: '#4DD3FF',
    background: '#F3F4F6',
    text: '#9CA3AF',
  },
  
  // White & Transparent
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

/**
 * 차트 전용 색상 설정
 */
export const CHART_COLORS = {
  bar: {
    primary: COLORS.primary,
    secondary: COLORS.chart.secondary,
    inactive: COLORS.gray[100],
  },
  axis: {
    text: COLORS.gray[400],
    line: COLORS.gray[200],
  },
  tooltip: {
    background: COLORS.white,
    border: COLORS.gray[200],
  },
} as const;

/**
 * 그라데이션 색상 조합
 */
export const GRADIENTS = {
  primary: `linear-gradient(to bottom right, ${COLORS.primary}, ${COLORS.indigo[600]})`,
  primaryToSky: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.sky})`,
} as const;
