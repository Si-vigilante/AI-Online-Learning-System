import React from 'react';
import { Bot, User } from 'lucide-react';

interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'ai';
  timestamp?: string;
}

export function ChatBubble({ message, sender, timestamp }: ChatBubbleProps) {
  const isAI = sender === 'ai';
  
  return (
    <div className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'} mb-4`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isAI ? 'bg-[#F3F0FF]' : 'bg-[#EDF2FF]'
      }`}>
        {isAI ? (
          <Bot className="w-5 h-5 text-[#845EF7]" />
        ) : (
          <User className="w-5 h-5 text-[#4C6EF5]" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[70%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isAI 
            ? 'bg-white border border-[#E9ECEF] rounded-tl-none' 
            : 'bg-[#4C6EF5] text-white rounded-tr-none'
        }`}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        {timestamp && (
          <p className="text-xs text-[#ADB5BD] mt-1 px-2">{timestamp}</p>
        )}
      </div>
    </div>
  );
}
