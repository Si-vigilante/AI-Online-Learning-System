import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { ChatBubble } from '../design-system/ChatBubble';
import { Send, Sparkles, BookOpen, HelpCircle } from 'lucide-react';

interface AIChatProps {
  onNavigate: (page: string) => void;
}

export function AIChat({ onNavigate }: AIChatProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      message: '你好！我是你的 AI 助教。我可以帮助你解答课程相关问题、总结知识点、推荐学习资源。有什么我可以帮助你的吗？',
      sender: 'ai' as const,
      timestamp: '14:30'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  
  const quickQuestions = [
    '帮我总结本节课要点',
    '解释一下反向传播算法',
    '推荐相关学习资料',
    '这个概念的应用场景'
  ];
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      message: inputMessage,
      sender: 'user' as const,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        message: '让我来帮你解答这个问题。根据课程内容，深度学习是机器学习的一个子领域，它使用多层神经网络来学习数据的表示。主要特点包括：\n\n1. 自动特征学习\n2. 层次化表示\n3. 端到端学习\n\n需要我详细展开某个方面吗？',
        sender: 'ai' as const,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };
  
  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#845EF7] to-[#BE4BDB] text-white py-8 px-8">
        <div className="container-custom">
          <h2 className="text-white mb-2">AI 助教答疑</h2>
          <p className="opacity-90">24/7 智能解答，助力您的学习之旅</p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-16rem)] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-[#E9ECEF]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#845EF7] to-[#BE4BDB] rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4>AI 助教</h4>
                    <p className="text-sm text-[#ADB5BD]">在线 · 随时为您服务</p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.message}
                    sender={msg.sender}
                    timestamp={msg.timestamp}
                  />
                ))}
              </div>
              
              {/* Input Area */}
              <div className="p-6 border-t border-[#E9ECEF]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border-2 border-[#E9ECEF] rounded-lg focus:border-[#845EF7] focus:ring-2 focus:ring-[#845EF7] outline-none transition-all"
                    placeholder="输入您的问题..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-[#845EF7]" />
                <h5>快捷问题</h5>
              </div>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors text-sm"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Context Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#4C6EF5]" />
                <h5>当前上下文</h5>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm mb-1">课程</p>
                  <h5>深度学习基础</h5>
                </div>
                <div className="p-3 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm mb-1">当前章节</p>
                  <h5>第一章：深度学习简介</h5>
                </div>
              </div>
            </Card>
            
            {/* AI Features */}
            <Card className="p-6">
              <h5 className="mb-4">AI 助教能力</h5>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#845EF7] flex-shrink-0 mt-0.5" />
                  <span>智能理解课程内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#845EF7] flex-shrink-0 mt-0.5" />
                  <span>引用相关课程片段</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#845EF7] flex-shrink-0 mt-0.5" />
                  <span>推荐学习路径</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#845EF7] flex-shrink-0 mt-0.5" />
                  <span>生成练习题目</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
