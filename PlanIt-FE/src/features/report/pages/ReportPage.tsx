import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Rocket, ArrowRight, Brain, TrendingUp, Clock, MessageCircle, Send, X } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { useTasksContext } from '../../tasks/context/TasksContext';
import { insightService, FeedbackDashboard } from '../../../api/insight.service';
import { chatbotService } from '../../../api/chatbot.service';

interface ReportPageProps {
  selectedKeywords: string[];
  weeklyPerformance: any[];
  growthData: any[];
}

const ReportPage: React.FC<ReportPageProps> = ({
  selectedKeywords,
  weeklyPerformance,
  growthData,
}) => {
  const { tasks } = useTasksContext();
  const [dashboard, setDashboard] = useState<FeedbackDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // 현재 연월과 주차 계산
  const getCurrentYearMonthWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}-${month}`;

    // 간단한 주차 계산 (1일 기준)
    const day = now.getDate();
    const week = Math.ceil(day / 7);

    return { yearMonth, week };
  };

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const { yearMonth, week } = getCurrentYearMonthWeek();
        const data = await insightService.getFeedbackDashboard(yearMonth, week);
        setDashboard(data);
        console.log('=== data: ', data);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);

        // IS4041 에러 처리 (데이터 부족)
        if (err?.response?.data?.error?.code === 'IS4041') {
          setError('분석할 통계 데이터가 부족합니다.');
        } else {
          setError('리포트를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 컴포넌트 마운트 시 1회만 실행

  // 챗봇 질의 전송
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || chatLoading) return;

    setChatLoading(true);
    setChatError(null);

    try {
      const response = await chatbotService.queryChatbot(chatQuery);
      console.log('[Chatbot] Response received:', response);
      setChatResponse(response.answer); // 기존 답변 덮어쓰기
      setChatQuery(''); // 입력창 초기화
    } catch (err: any) {
      console.error('[Chatbot] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setChatError('답변을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setChatLoading(false);
    }
  };

  // 챗봇 팝업 닫기
  const handleCloseChatPopup = () => {
    setIsChatOpen(false);
    setChatQuery('');
    setChatResponse(null);
    setChatError(null);
  };

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col pt-4 relative"
    >
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Brain size={32} className="text-primary" />
          </div>
          <h4 className="font-bold mb-2">AI 리포트 생성 중...</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            데이터를 분석하고 있습니다.
          </p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <BarChart3 size={32} className="text-red-300" />
          </div>
          <h4 className="font-bold mb-2 text-red-600">{error}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            더 많은 할 일을 완료하고 다시 시도해주세요.
          </p>
        </div>
      ) : dashboard ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 pb-10">
          {/* Growth Encouragement Card */}
          <div className="glass-card p-6 rounded-[32px] bg-gradient-to-br from-primary to-indigo-600 text-white border-none shadow-xl shadow-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Rocket size={18} className="text-white" />
              <h4 className="text-sm font-bold">성장 격려 피드백</h4>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
              <p className="text-[11px] font-bold opacity-90 leading-relaxed">
                {dashboard.feedbacks.growth.message}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-sky-300" />
                <span className="text-[10px] opacity-80">
                  {dashboard.feedbacks.growth.topicName} 분야 {dashboard.feedbacks.growth.growthRate > 0 ? '+' : ''}{dashboard.feedbacks.growth.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Chart - API 데이터 사용 */}
          {dashboard.feedbacks.timeline.chartData && dashboard.feedbacks.timeline.chartData.length > 0 && (
            <div className="glass-card p-6 rounded-[32px]">
              <h4 className="text-sm font-bold mb-6">성장 타임라인</h4>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.feedbacks.timeline.chartData}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                    />
                    <Bar dataKey="completionRate" radius={[4, 4, 4, 4]} barSize={30}>
                      {dashboard.feedbacks.timeline.chartData.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === dashboard.feedbacks.timeline.chartData.length - 1 ? '#7C5CFF' : '#F3F4F6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-4">
                {dashboard.feedbacks.timeline.message}
              </p>
            </div>
          )}

          {/* Timeline Analysis */}
          <div className="glass-card p-6 rounded-[32px]">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <h4 className="text-sm font-bold">타임라인 분석</h4>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
              {dashboard.feedbacks.timeline.message}
            </p>
          </div>

          {/* Pattern Analysis */}
          <div className="glass-card p-6 rounded-[32px]">
            <h4 className="text-sm font-bold mb-4">미룸 패턴 분석</h4>

            {/* Pattern Chart */}
            {dashboard.feedbacks.pattern.chartData && dashboard.feedbacks.pattern.chartData.length > 0 && (
              <div className="h-[180px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.feedbacks.pattern.chartData.map(item => ({
                    day: getDayOfWeekKorean(item.day).substring(0, 1), // 월, 화, 수...
                    completed: item.completed,
                    postponed: item.postponed
                  }))}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="completed" name="완료" fill="#7C5CFF" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="postponed" name="미룸" fill="#FF8A8A" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-red-400" />
                <h5 className="text-[11px] font-bold text-red-800">미룸 패턴 주의보</h5>
              </div>
              <p className="text-[10px] text-red-700 leading-relaxed">
                {dashboard.feedbacks.pattern.message}
              </p>
              <div className="mt-2 text-[10px] text-red-600">
                <span className="font-bold">{getDayOfWeekKorean(dashboard.feedbacks.pattern.worstDay)}</span> 평균 미룸: {dashboard.feedbacks.pattern.avgPostponeCount.toFixed(1)}회
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="glass-card p-5 rounded-3xl bg-amber-50/50 border-amber-100/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                <Brain size={14} />
              </div>
              <h4 className="text-xs font-bold text-amber-800">AI 종합 피드백</h4>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed mb-3">
              {dashboard.feedbacks.summary.message}
            </p>
            {/* <div className="flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">완료율:</span>
                <span className="font-bold text-amber-800">{dashboard.feedbacks.summary.completionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">완료:</span>
                <span className="font-bold text-amber-800">{dashboard.feedbacks.summary.completedTasks}/{dashboard.feedbacks.summary.totalTasks}</span>
              </div>
            </div> */}
          </div>
        </div>
      ) : null}

      {/* Chatbot FAB Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-6 right-6 w-12 h-12 bg-[#7C5CFF] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 z-50"
        aria-label="챗봇 열기"
      >
        <MessageCircle size={24} className="text-white" />
      </button>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseChatPopup}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#7C5CFF]/10 rounded-lg text-[#7C5CFF]">
                    <Brain size={16} />
                  </div>
                  <h3 className="text-sm font-bold">AI 피드백 챗봇</h3>
                </div>
                <button
                  onClick={handleCloseChatPopup}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Response Display */}
              {chatResponse && (
                <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {chatResponse}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {chatError && (
                <div className="mb-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-xs text-red-700 leading-relaxed">
                    {chatError}
                  </p>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleChatSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    placeholder="할 일에 대해 궁금한 점을 물어보세요"
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    disabled={chatLoading}
                    className="w-full h-24 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium outline-none focus:border-[#7C5CFF]/30 transition-all resize-none placeholder:text-gray-300 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={chatLoading || !chatQuery.trim()}
                  className="w-full py-3 bg-[#7C5CFF] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#7C5CFF]/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6B4FE8] transition-all flex items-center justify-center gap-2"
                >
                  {chatLoading ? (
                    '답변 생성 중...'
                  ) : (
                    <>
                      <Send size={14} />
                      질문하기
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 요일 한글 변환 헬퍼 함수
const getDayOfWeekKorean = (day: string): string => {
  const dayMap: Record<string, string> = {
    MONDAY: '월요일',
    TUESDAY: '화요일',
    WEDNESDAY: '수요일',
    THURSDAY: '목요일',
    FRIDAY: '금요일',
    SATURDAY: '토요일',
    SUNDAY: '일요일',
  };
  return dayMap[day] || day;
};

export default ReportPage;