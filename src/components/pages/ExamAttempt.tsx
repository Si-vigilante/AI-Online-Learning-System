import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { QuestionCard } from '../design-system/QuestionCard';
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react';

interface ExamAttemptProps {
  onNavigate: (page: string) => void;
}

export function ExamAttempt({ onNavigate }: ExamAttemptProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  
  const questions = [
    {
      id: 1,
      type: 'single' as const,
      question: '深度学习是机器学习的哪个分支？',
      options: ['监督学习', '无监督学习', '强化学习', '以上都不是']
    },
    {
      id: 2,
      type: 'multiple' as const,
      question: '以下哪些是常用的深度学习框架？（多选）',
      options: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras']
    },
    {
      id: 3,
      type: 'single' as const,
      question: '神经网络中的激活函数作用是什么？',
      options: [
        '增加模型复杂度',
        '引入非线性',
        '加快训练速度',
        '防止过拟合'
      ]
    },
    {
      id: 4,
      type: 'text' as const,
      question: '请简述反向传播算法的基本原理。'
    }
  ];
  
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  
  const handleAnswerChange = (questionId: number, selectedAnswers: string[]) => {
    setAnswers({ ...answers, [questionId]: selectedAnswers });
  };
  
  const handleTextChange = (questionId: number, text: string) => {
    setTextAnswers({ ...textAnswers, [questionId]: text });
  };
  
  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleSubmit = () => {
    onNavigate('exam-result');
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E9ECEF] sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3>深度学习基础 - 第一章测验</h3>
              <p className="text-sm text-[#ADB5BD]">
                第 {currentQuestion + 1} 题 / 共 {totalQuestions} 题
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#4C6EF5]" />
                <span className={`text-lg ${timeRemaining < 300 ? 'text-[#FF6B6B]' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Button variant="secondary" onClick={handleSubmit}>
                <Flag className="w-4 h-4" />
                提交答卷
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#4C6EF5] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#4C6EF5] rounded-full flex items-center justify-center text-white">
                    {currentQuestion + 1}
                  </div>
                  <h4>
                    {currentQ.type === 'single' && '单选题'}
                    {currentQ.type === 'multiple' && '多选题'}
                    {currentQ.type === 'text' && '主观题'}
                  </h4>
                </div>
              </div>
              
              <QuestionCard
                type={currentQ.type}
                question={currentQ.question}
                options={currentQ.options}
                selectedAnswers={answers[currentQ.id] || []}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
                textAnswer={textAnswers[currentQ.id] || ''}
                onTextChange={(text) => handleTextChange(currentQ.id, text)}
              />
              
              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E9ECEF]">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一题
                </Button>
                
                {currentQuestion < totalQuestions - 1 ? (
                  <Button onClick={handleNext}>
                    下一题
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit}>
                    <Flag className="w-4 h-4" />
                    提交答卷
                  </Button>
                )}
              </div>
            </Card>
          </div>
          
          {/* Question Navigation Sidebar */}
          <div>
            <Card className="p-6 sticky top-24">
              <h5 className="mb-4">答题卡</h5>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id]?.length > 0 || textAnswers[q.id];
                  const isCurrent = index === currentQuestion;
                  
                  return (
                    <button
                      key={q.id}
                      className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-[#4C6EF5] text-white ring-2 ring-[#4C6EF5] ring-offset-2'
                          : isAnswered
                          ? 'bg-[#51CF66] text-white'
                          : 'bg-[#F8F9FA] text-[#ADB5BD] hover:bg-[#E9ECEF]'
                      }`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#4C6EF5] rounded" />
                  <span>当前题目</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#51CF66] rounded" />
                  <span>已作答</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded" />
                  <span>未作答</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-[#E9ECEF]">
                <div className="text-center mb-4">
                  <div className="text-2xl mb-1">
                    {Object.keys({...answers, ...textAnswers}).length} / {totalQuestions}
                  </div>
                  <p className="text-sm text-[#ADB5BD]">已完成题目</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
