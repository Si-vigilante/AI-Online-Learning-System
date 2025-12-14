import React from 'react';
import { Checkbox } from './Checkbox';

interface QuestionCardProps {
  type: 'single' | 'multiple' | 'text';
  question: string;
  options?: string[];
  selectedAnswers?: string[];
  onAnswerChange?: (answers: string[]) => void;
  textAnswer?: string;
  onTextChange?: (text: string) => void;
}

export function QuestionCard({ 
  type, 
  question, 
  options = [], 
  selectedAnswers = [], 
  onAnswerChange,
  textAnswer = '',
  onTextChange
}: QuestionCardProps) {
  const handleSingleChoice = (option: string) => {
    onAnswerChange?.([option]);
  };
  
  const handleMultipleChoice = (option: string) => {
    if (selectedAnswers.includes(option)) {
      onAnswerChange?.(selectedAnswers.filter(a => a !== option));
    } else {
      onAnswerChange?.([...selectedAnswers, option]);
    }
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-[#E9ECEF]">
      <p className="mb-4">{question}</p>
      
      {type === 'text' ? (
        <textarea
          className="w-full px-4 py-3 border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5] outline-none transition-all resize-none"
          rows={6}
          placeholder="请在此输入您的答案..."
          value={textAnswer}
          onChange={(e) => onTextChange?.(e.target.value)}
        />
      ) : (
        <div className="space-y-3">
          {options.map((option, index) => (
            <label
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border-2 border-[#E9ECEF] hover:border-[#4C6EF5] cursor-pointer transition-all"
            >
              {type === 'multiple' ? (
                <Checkbox
                  checked={selectedAnswers.includes(option)}
                  onChange={() => handleMultipleChoice(option)}
                />
              ) : (
                <div 
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedAnswers.includes(option)
                      ? 'border-[#4C6EF5] bg-[#4C6EF5]'
                      : 'border-[#E9ECEF]'
                  }`}
                  onClick={() => handleSingleChoice(option)}
                >
                  {selectedAnswers.includes(option) && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              )}
              <span className="flex-1">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
