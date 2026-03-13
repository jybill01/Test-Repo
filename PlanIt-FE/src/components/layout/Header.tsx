import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  nickname: string;
}

const Header: React.FC<HeaderProps> = ({ nickname }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const getTitle = () => {
    if (path === '/home' || path === '/') return `${nickname}님 안녕하세요`;
    if (path === '/todo') return '할 일 관리';
    if (path === '/friends') return '친구';
    if (path === '/report') return '리포트 피드백';
    if (path === '/mypage') return '마이페이지';
    if (path === '/ai') return 'AI 할일 생성';
    return '';
  };

  const getSubtitle = () => {
    if (path === '/home' || path === '/') return '플랜잇이 오늘의 성취를 응원합니다';
    if (path === '/todo') return '오늘의 할 일을 플랜잇이 정리했습니다';
    if (path === '/friends') return '서로의 성장을 응원하세요';
    if (path === '/report') return '이번 주 나는 얼마나 성장했을까?';
    if (path === '/mypage') return '계정 설정';
    if (path === '/ai') return '플랜잇과 함께 계획을 세우고 달성하세요';
    return '';
  };

  return (
    <div className="pt-12 px-6 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-md">
      <div>
        <h2 className="text-xl font-bold">{getTitle()}</h2>
        <p className="text-xs text-gray-500">{getSubtitle()}</p>
      </div>
      <button 
        onClick={() => navigate('/mypage')}
        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold hover:bg-primary/20 transition-colors"
      >
        {nickname[0]}
      </button>
    </div>
  );
};

export default Header;
