import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Home, Brain, BarChart2, Calendar as CalendarIcon } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menus = [
    { id: 'friends', path: '/friends', label: '친구', icon: Users },
    { id: 'todo', path: '/todo', label: '할일 상세', icon: CalendarIcon },
    { id: 'home', path: '/home', label: '대시보드', icon: Home },
    { id: 'ai', path: '/ai', label: 'AI 할일 생성', icon: Brain },
    { id: 'report', path: '/report', label: '리포트', icon: BarChart2 },
  ];

  return (
    <div className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-4 pb-4">
      {menus.map((menu) => (
        <button
          key={menu.id}
          onClick={() => navigate(menu.path)}
          className={`flex flex-col items-center gap-1 transition-all flex-1 ${
            location.pathname === menu.path || (menu.path === '/home' && location.pathname === '/') ? 'text-primary' : 'text-gray-300'
          }`}
        >
          <menu.icon size={22} />
          <span className="text-[9px] font-bold whitespace-nowrap">{menu.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
