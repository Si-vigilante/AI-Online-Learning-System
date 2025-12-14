import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div 
        className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
          checked ? 'bg-[#4C6EF5]' : 'bg-[#E9ECEF]'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div 
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </div>
      {label && <span className="text-sm text-[#212529]">{label}</span>}
    </label>
  );
}
