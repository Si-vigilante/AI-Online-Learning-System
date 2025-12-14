import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  const inputStyles = error 
    ? 'border-[#FF6B6B] focus:ring-[#FF6B6B]' 
    : 'border-[#E9ECEF] focus:ring-[#4C6EF5] focus:border-[#4C6EF5]';
  
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-[#212529]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 outline-none focus:ring-2 ${inputStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#FF6B6B]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-[#ADB5BD]">{helperText}</p>
      )}
    </div>
  );
}
