import React from 'react';

interface KeywordChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const KeywordChip: React.FC<KeywordChipProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
      active 
        ? 'bg-gradient-to-br from-primary to-sky text-white shadow-lg shadow-primary/20' 
        : 'bg-[#EEF2FF] text-[#1A1F36] hover:bg-[#E0E7FF]'
    }`}
  >
    {label}
  </button>
);

export default KeywordChip;
