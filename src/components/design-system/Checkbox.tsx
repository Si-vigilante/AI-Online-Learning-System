import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div 
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          checked 
            ? 'bg-[#4C6EF5] border-[#4C6EF5]' 
            : 'bg-white border-[#E9ECEF] group-hover:border-[#4C6EF5]'
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </div>
      {label && <span className="text-sm text-[#212529]">{label}</span>}
    </label>
  );
}
