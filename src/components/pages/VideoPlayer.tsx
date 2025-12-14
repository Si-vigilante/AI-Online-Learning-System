import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Tabs } from '../design-system/Tabs';
import { Play, Pause, Volume2, Settings, Maximize, BookOpen, MessageSquare, Lightbulb, ChevronRight } from 'lucide-react';
import { QuestionCard } from '../design-system/QuestionCard';

interface VideoPlayerProps {
  onNavigate: (page: string) => void;
}

export function VideoPlayer({ onNavigate }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [showPopupQuiz, setShowPopupQuiz] = useState(false);
  
  const tabs = [
    { key: 'notes', label: '笔记', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'discussion', label: '讨论', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'keypoints', label: '知识点', icon: <Lightbulb className="w-4 h-4" /> }
  ];
  
  const notes = [
    { id: 1, time: '02:15', content: '深度学习的定义：机器学习的一个分支' },
    { id: 2, time: '05:42', content: '神经网络的三个核心组成部分' }
  ];
  
  const keyPoints = [
    { id: 1, time: '00:45', title: '深度学习简介', description: '什么是深度学习及其发展历程' },
    { id: 2, time: '03:20', title: '应用场景', description: '计算机视觉、NLP、语音识别' },
    { id: 3, time: '06:10', title: '神经网络基础', description: '感知机模型与多层网络' }
  ];
  
  const discussions = [
    { id: 1, user: '学生A', time: '2小时前', content: '请问激活函数为什么这么重要？' },
    { id: 2, user: '学生B', time: '5小时前', content: '这节课讲得很清楚，受益匪浅！' }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-[#212529] to-[#495057] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    size="lg"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                </div>
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="w-full h-1 bg-white/30 rounded-full mb-3">
                    <div className="w-1/3 h-full bg-[#4C6EF5] rounded-full" />
                  </div>
                  
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <Volume2 className="w-5 h-5" />
                      <span className="text-sm">08:32 / 25:40</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <select className="bg-transparent text-sm">
                        <option>1.0x</option>
                        <option>1.25x</option>
                        <option>1.5x</option>
                        <option>2.0x</option>
                      </select>
                      <Settings className="w-5 h-5" />
                      <Maximize className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                {/* Popup Quiz */}
                {showPopupQuiz && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                      <h4 className="mb-4">弹题测验</h4>
                      <QuestionCard
                        type="single"
                        question="深度学习是机器学习的哪个分支？"
                        options={[
                          '监督学习',
                          '无监督学习',
                          '强化学习',
                          '以上都不是'
                        ]}
                        selectedAnswers={[]}
                        onAnswerChange={() => {}}
                      />
                      <Button fullWidth className="mt-4" onClick={() => setShowPopupQuiz(false)}>
                        提交答案
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="mb-2">第一章：深度学习简介</h3>
                <p className="text-[#ADB5BD]">讲师：张教授 · 第 1 课 / 共 20 课</p>
              </div>
            </Card>
            
            {/* Course Navigation */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost">
                  上一课
                </Button>
                <span className="text-sm text-[#ADB5BD]">课程列表</span>
                <Button variant="primary" onClick={() => setShowPopupQuiz(true)}>
                  下一课
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Right Sidebar */}
          <div>
            <Card className="p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              
              <div className="mt-6">
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <Button variant="secondary" fullWidth size="sm">
                      + 添加笔记
                    </Button>
                    
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 bg-[#F8F9FA] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-[#4C6EF5] bg-[#EDF2FF] px-2 py-1 rounded">
                            {note.time}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'keypoints' && (
                  <div className="space-y-4">
                    {keyPoints.map((point) => (
                      <div key={point.id} className="p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-[#FFD43B] flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#4C6EF5]">{point.time}</span>
                              <h5>{point.title}</h5>
                            </div>
                            <p className="text-sm text-[#ADB5BD]">{point.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'discussion' && (
                  <div className="space-y-4">
                    <textarea
                      className="w-full px-4 py-3 border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5] outline-none resize-none"
                      rows={3}
                      placeholder="发表您的看法..."
                    />
                    <Button fullWidth size="sm">发送</Button>
                    
                    <div className="space-y-3 mt-6">
                      {discussions.map((item) => (
                        <div key={item.id} className="p-4 bg-[#F8F9FA] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#4C6EF5] rounded-full flex items-center justify-center text-white text-xs">
                              {item.user[2]}
                            </div>
                            <span className="text-sm">{item.user}</span>
                            <span className="text-xs text-[#ADB5BD]">{item.time}</span>
                          </div>
                          <p className="text-sm">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="p-6 mt-6">
              <h5 className="mb-3">AI 助教</h5>
              <p className="text-sm text-[#ADB5BD] mb-4">
                对这节课有疑问？让 AI 助教帮您解答
              </p>
              <Button variant="primary" fullWidth onClick={() => onNavigate('ai-chat')}>
                <MessageSquare className="w-4 h-4" />
                开始咨询
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
