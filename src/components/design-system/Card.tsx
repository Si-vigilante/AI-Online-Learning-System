import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = true, onClick }: CardProps) {
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
  const clickable = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-md transition-all duration-300 ${hoverStyles} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
