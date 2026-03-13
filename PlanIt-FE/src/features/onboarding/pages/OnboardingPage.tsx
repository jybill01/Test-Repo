/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Brain, BarChart3, Rocket, Check, Loader2 } from 'lucide-react';
import { useCategories } from '../../auth/hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../../api/user.service';
import { useAuth } from '../../auth/context/AuthContext';
import { useCognitoAuth } from '../../auth/hooks/useCognitoAuth';
import ErrorPage from '../../../components/common/ErrorPage';

const PlanetAnimation = ({ size = 'large' }: { size?: 'small' | 'large' }) => {
  const isLarge = size === 'large';
  const containerSize = isLarge ? 'w-[220px] h-[220px]' : 'w-[160px] h-[160px]';
  const planetSize = isLarge ? 'w-[150px] h-[150px]' : 'w-[100px] h-[100px]';
  const orbitSize = isLarge ? 'w-[200px] h-[200px]' : 'w-[130px] h-[130px]';

  return (
    <div className={`relative ${containerSize} mx-auto mb-8`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`${planetSize} rounded-full planet-gradient shadow-[0_20px_60px_rgba(124,92,255,0.35)] animate-spin-planet`} />
      </div>
      <div className={`absolute top-1/2 left-1/2 ${orbitSize} -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-primary/20`} />
      <div className={`absolute top-1/2 left-1/2 ${orbitSize} -translate-x-1/2 -translate-y-1/2 animate-rotate-star`}>
        {[0, 120, 240].map((deg) => (
          <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-sky rounded-full shadow-[0_0_12px_rgba(77,211,255,0.7)] animate-twinkle" />
          </div>
        ))}
      </div>
    </div>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl mb-4 w-full max-w-[320px] flex gap-4 items-start"
  >
    <div className="p-2 bg-primary/10 rounded-xl text-primary">
      <Icon size={20} />
    </div>
    <div>
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

interface KeywordChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

const KeywordChip: React.FC<KeywordChipProps> = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    type="button"
    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${active ? 'text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    style={active ? { backgroundColor: color || '#7C5CFF' } : undefined}
  >
    {label}
  </button>
);

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [agreedTerms, setAgreedTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();
  const { login } = useAuth();
  const { login: cognitoLogin } = useCognitoAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = sessionStorage.getItem('cognitoIdToken');
    if (savedToken) {
      setStep(2);
    }
  }, []);

  const toggleCategory = (categoryId: number) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
    } else if (selectedCategoryIds.length < 4) {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    } else {
      alert('카테고리는 최대 4개까지 선택할 수 있습니다.');
    }
  };

  const handleComplete = async () => {
    if (!agreedTerms.service || !agreedTerms.privacy) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    if (selectedCategoryIds.length < 3) {
      alert('카테고리를 최소 3개 이상 선택해주세요.');
      return;
    }

    if (selectedCategoryIds.length > 4) {
      alert('카테고리는 최대 4개까지 선택할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cognitoIdToken = sessionStorage.getItem('cognitoIdToken');

      if (!cognitoIdToken) {
        alert('로그인 정보가 만료되었습니다. 다시 로그인해주세요.');
        navigate('/');
        return;
      }

      const agreedTermIds: number[] = [];
      if (agreedTerms.service) agreedTermIds.push(1);
      if (agreedTerms.privacy) agreedTermIds.push(2);
      if (agreedTerms.marketing) agreedTermIds.push(3);

      const payload = JSON.parse(atob(cognitoIdToken.split('.')[1]));
      const email = payload.email;

      const response = await userService.signup({
        nickname,
        email,
        cognitoIdToken,
        agreedTermIds,
        interestCategoryIds: selectedCategoryIds,
        isRetentionAgreed: agreedTerms.marketing,
      });

      console.log('[OnboardingPage] signup 응답 전체:', response);
      console.log('[OnboardingPage] signup 응답 타입:', typeof response);
      console.log('[OnboardingPage] signup 응답 JSON:', JSON.stringify(response));

      // base.ts post()가 이미 response.data.data를 언래핑해서 반환
      const authData = response;
      console.log('[OnboardingPage] login에 넘길 데이터:', authData);

      if (!authData || !authData.accessToken) {
        console.error('[OnboardingPage] authData 없음 또는 accessToken 누락:', authData);
        alert('회원가입 처리 중 오류가 발생했습니다. (서버 응답 없음)\n브라우저 콘솔 및 User-svc 서버 로그를 확인해주세요.');
        return; // navigate 없이 return → cognitoIdToken 유지
      }

      // 성공 확정 후에만 sessionStorage 제거
      sessionStorage.removeItem('cognitoIdToken');

      login(authData);
      navigate('/');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      console.error('에러 응답 데이터:', error?.response?.data);
      console.error('에러 상태코드:', error?.response?.status);

      const message = error?.response?.data?.message;

      // ✅ 90일 재가입 제한 팝업
      if (message?.includes('90일')) {
        alert('탈퇴 한 후 90일 동안 재가입이 불가능합니다.');
        navigate('/');
        return;
      }

      alert(message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-[420px] h-[840px] bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl overflow-hidden relative border-[8px] border-white">
        <AnimatePresence>
          {step > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setStep((s) => s - 1)}
              className="absolute top-[46px] left-6 z-50 p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="h-full w-full relative">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="p1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col items-center justify-center px-8 text-center pb-32"
              >
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                  <PlanetAnimation />
                  <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                    Plan <span className="text-primary">It</span>
                  </h1>
                  <p className="text-lg font-semibold text-gray-500">AI 기반 자기계발 투두리스트</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="absolute bottom-10 left-8 right-8 h-14 rounded-2xl bg-gradient-to-br from-primary to-sky text-white font-bold shadow-xl shadow-primary/30 active:scale-95 transition-transform"
                >
                  다음
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="p2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col items-center pt-12 px-8 pb-32"
              >
                <div className="w-full flex justify-center mb-8">
                  <span className="text-lg font-extrabold">
                    Plan<span className="text-primary">It</span>
                  </span>
                </div>
                <PlanetAnimation size="small" />
                <h2 className="text-xl font-extrabold mb-8 text-center">Plan → Do → Achieve</h2>
                <div className="w-full overflow-y-auto max-h-[380px] pr-1 scrollbar-hide">
                  <FeatureCard icon={Brain} title="AI 계획 생성" description="목표 기반으로 일·주·월 계획을 자동 구성합니다." />
                  <FeatureCard icon={BarChart3} title="실행 분석" description="완료 패턴을 분석해 전략을 다시 설계합니다." />
                  <FeatureCard icon={Rocket} title="목표 달성" description="데이터 기반 실행 루프를 통해 성취를 만듭니다." />
                </div>
                <button
                  onClick={async () => {
                    console.log('[OnboardingPage] Google 로그인 버튼 클릭');
                    try {
                      await cognitoLogin();
                    } catch (err: any) {
                      console.error('[OnboardingPage] 로그인 실패:', err);
                    }
                  }}
                  className="absolute bottom-10 left-8 right-8 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center gap-3 font-semibold shadow-sm active:scale-95 transition-transform"
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    className="w-5 h-5"
                    alt="Google"
                  />
                  Google로 계속하기
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="p3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col pt-12 px-8 pb-32"
              >
                <div className="w-full flex justify-center mb-10">
                  <span className="text-lg font-extrabold">
                    Plan<span className="text-primary">It</span>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold mb-2">약관 동의</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  서비스 이용을 위해 약관에 동의해주세요
                </p>

                <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl mb-6 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms.service && agreedTerms.privacy && agreedTerms.marketing}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAgreedTerms({ service: checked, privacy: checked, marketing: checked });
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-bold">전체 동의</span>
                  </label>
                  <div className="h-px bg-gray-200" />
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms.service}
                      onChange={(e) =>
                        setAgreedTerms({ ...agreedTerms, service: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      서비스 이용약관 <span className="text-primary">(필수)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms.privacy}
                      onChange={(e) =>
                        setAgreedTerms({ ...agreedTerms, privacy: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      개인정보 처리방침 <span className="text-primary">(필수)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms.marketing}
                      onChange={(e) =>
                        setAgreedTerms({ ...agreedTerms, marketing: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      마케팅 수신 동의 <span className="text-gray-400">(선택)</span>
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!agreedTerms.service || !agreedTerms.privacy}
                  className="absolute bottom-10 left-8 right-8 h-14 rounded-2xl bg-gradient-to-br from-primary to-sky text-white font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  다음
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="p4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col pt-12 px-8 pb-32"
              >
                <div className="w-full flex justify-center mb-10">
                  <span className="text-lg font-extrabold">
                    Plan<span className="text-primary">It</span>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold mb-2">기본정보 입력</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  나를 표현할 닉네임과 관심 카테고리를 선택해주세요
                </p>

                <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl mb-6">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력해주세요"
                    className="w-full bg-transparent border-none outline-none text-base font-medium placeholder:text-gray-300"
                    maxLength={20}
                  />
                </div>

                <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl mb-8">
                  {categoriesError ? (
                    <ErrorPage
                      type="network"
                      title="카테고리를 불러올 수 없어요"
                      message="백엔드 서버 연결을 확인해주세요"
                      onRetry={() => refetchCategories()}
                      showHomeButton={false}
                    />
                  ) : categoriesLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <p className="text-sm text-gray-500">카테고리 불러오는 중...</p>
                    </div>
                  ) : categories && categories.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {categories.map((category) => (
                          <KeywordChip
                            key={category.categoryId}
                            label={category.name}
                            active={selectedCategoryIds.includes(category.categoryId)}
                            onClick={() => toggleCategory(category.categoryId)}
                            color={category.colorHex}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Check size={12} />
                        3~4개 선택해주세요 ({selectedCategoryIds.length}/4)
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-sm text-gray-500 mb-4">카테고리를 불러올 수 없습니다</p>
                      <button
                        onClick={() => refetchCategories()}
                        className="text-xs text-primary hover:underline"
                      >
                        다시 시도
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleComplete}
                  disabled={
                    !nickname ||
                    selectedCategoryIds.length < 3 ||
                    selectedCategoryIds.length > 4 ||
                    isSubmitting
                  }
                  className="absolute bottom-10 left-8 right-8 h-14 rounded-2xl bg-gradient-to-br from-primary to-sky text-white font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    '시작하기'
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ backgroundColor: step === i ? '#7C5CFF' : '#D1D5DB' }}
              className="w-2 h-2 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
