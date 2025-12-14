import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function Dropdown({ options, value, onChange, placeholder = '请选择', label }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="block mb-2 text-sm text-[#212529]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          className="w-full px-4 py-2.5 bg-white border-2 border-[#E9ECEF] rounded-lg flex items-center justify-between hover:border-[#4C6EF5] transition-all duration-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-[#212529]' : 'text-[#ADB5BD]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-[#ADB5BD] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-[#E9ECEF] rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2.5 cursor-pointer hover:bg-[#F8F9FA] transition-colors ${
                  option.value === value ? 'bg-[#EDF2FF] text-[#4C6EF5]' : 'text-[#212529]'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
