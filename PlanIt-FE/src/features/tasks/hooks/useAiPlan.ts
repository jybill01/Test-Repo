import { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import axios from 'axios';
import { Task } from '../../../types';
import { PlanData } from '../types/aiPlan.types';
import { strategyService } from '../../../api/strategy.service';

export const useAiPlan = (
  tasks: Task[],
  setTasks: (tasks: Task[]) => void,
  onSuccess?: () => void,
  selectedKeywords: string[] = [] // 🎯 추가
) => {
  const today = new Date().toISOString().split('T')[0];
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStartDate, setAiStartDate] = useState(today);
  const [aiEndDate, setAiEndDate] = useState(today);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState<string[]>([]);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateAiPlan = async () => {
    if (!aiPrompt) return;

    setIsAiGenerating(true);
    setPlanData(null); // 이전 데이터 초기화

    try {
      // Backend API 호출
      const response = await strategyService.generatePlan({
        goalText: aiPrompt,
        startDate: aiStartDate,
        endDate: aiEndDate,
      });

      setPlanData(response);
    } catch (error) {
      console.error("❌ AI 계획 생성 실패:", error);

      // 에러 상세 정보 출력
      if (axios.isAxiosError(error)) {
        console.error('상태 코드:', error.response?.status);
        console.error('에러 메시지:', error.response?.data);
        console.error('요청 URL:', error.config?.url);
        console.error('Base URL:', error.config?.baseURL);
      }

      alert("AI 계획 생성에 실패했습니다. 다시 시도해주세요.");

      // Fallback: 기존 로직 유지 (개발 중 백엔드 없을 때 대비)
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `목표: ${aiPrompt}, 기간: ${aiStartDate} ~ ${aiEndDate}. 이 목표를 달성하기 위한 구체적인 할 일 목록을 3-5개 정도 생성해줘. 한국어로 답변해줘.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });
        const generated = JSON.parse(response.text || "[]");
        setAiGeneratedTasks(generated);
      } catch (fallbackError) {
        console.error("Fallback AI Generation Error:", fallbackError);
        setAiGeneratedTasks([`[${aiPrompt}] 기초 다지기`, `[${aiPrompt}] 실전 연습`, `[${aiPrompt}] 보완 및 마무리`]);
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!planData || !planData.goal) {
      alert("저장할 계획이 없습니다.");
      return;
    }

    setIsSaving(true);

    // 🎯 카테고리 결정 로직: planData.categoryName 최우선 사용
    let categoryName: string;

    if (planData.categoryName) {
      // 1순위: 백엔드에서 생성된 카테고리명 사용
      categoryName = planData.categoryName;
      console.log('✅ 백엔드 생성 카테고리 사용:', categoryName);
    } else if (selectedKeywords.length > 0) {
      // 2순위: 사용자 선택 키워드 사용
      categoryName = selectedKeywords[0];
      console.log('⚠️ 키워드 fallback 사용:', categoryName);
    } else {
      // 3순위: 최후 fallback
      categoryName = "기타";
      console.log('⚠️ 기타 fallback 사용');
    }

    // 저장 요청 직전 로깅
    const saveRequest = {
      categoryName: categoryName,
      goal: {
        title: aiPrompt,
        startDate: aiStartDate,
        endDate: aiEndDate,
        weekGoals: planData.goal.weekGoals
      }
    };

    console.log('🚀 저장 요청 데이터:', saveRequest);
    console.log('📋 최종 categoryName:', categoryName);

    try {
      const response = await strategyService.savePlan(saveRequest);

      alert(`계획이 저장되었습니다! (Goal ID: ${response.goalId})`);

      // 🔄 서버 데이터 재조회 트리거 호출
      if (onSuccess) {
        onSuccess();
      }

      // 저장 후 초기화
      setPlanData(null);
      setAiPrompt('');
    } catch (error) {
      console.error("❌ 계획 저장 실패:", error);

      if (axios.isAxiosError(error)) {
        console.error('상태 코드:', error.response?.status);
        console.error('에러 메시지:', error.response?.data);
      }

      alert("계획 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const addAiTasksToMyList = () => {
    const newTasks: Task[] = aiGeneratedTasks.map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      date: aiStartDate,
      completed: false,
      category: 'AI 추천'
    }));
    setTasks([...tasks, ...newTasks]);
    setAiGeneratedTasks([]);
    setAiPrompt('');
  };

  return {
    aiPrompt,
    setAiPrompt,
    aiStartDate,
    setAiStartDate,
    aiEndDate,
    setAiEndDate,
    aiGeneratedTasks,
    planData,
    setPlanData,
    isAiGenerating,
    isSaving,
    isAiExpanded,
    setIsAiExpanded,
    generateAiPlan,
    savePlan,
    addAiTasksToMyList
  };
};
