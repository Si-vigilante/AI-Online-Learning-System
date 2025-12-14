import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Tabs } from '../design-system/Tabs';
import { Play, BookOpen, FileText, Clock, Users, Star, CheckCircle, Lock } from 'lucide-react';

interface CourseDetailProps {
  onNavigate: (page: string) => void;
}

export function CourseDetail({ onNavigate }: CourseDetailProps) {
  const [activeTab, setActiveTab] = useState('curriculum');
  
  const courseData = {
    title: '深度学习基础',
    instructor: '张教授',
    rating: 4.8,
    students: 1256,
    duration: '12周',
    progress: 35,
    description: '本课程将带您系统学习深度学习的核心概念和实践技能，从神经网络基础到深度学习框架应用，通过实战项目掌握 AI 技术。',
    learningGoals: [
      '理解神经网络的工作原理',
      '掌握深度学习常用框架',
      '能够构建和训练深度学习模型',
      '应用深度学习解决实际问题'
    ]
  };
  
  const curriculum = [
    {
      id: 1,
      title: '第一章：深度学习简介',
      lessons: [
        { id: 1, title: '什么是深度学习', duration: '15分钟', completed: true, locked: false },
        { id: 2, title: '深度学习的应用场景', duration: '20分钟', completed: true, locked: false },
        { id: 3, title: '神经网络基础概念', duration: '25分钟', completed: false, locked: false }
      ]
    },
    {
      id: 2,
      title: '第二章：神经网络原理',
      lessons: [
        { id: 4, title: '感知机模型', duration: '18分钟', completed: false, locked: false },
        { id: 5, title: '激活函数详解', duration: '22分钟', completed: false, locked: false },
        { id: 6, title: '反向传播算法', duration: '30分钟', completed: false, locked: true }
      ]
    },
    {
      id: 3,
      title: '第三章：深度学习框架',
      lessons: [
        { id: 7, title: 'TensorFlow 入门', duration: '25分钟', completed: false, locked: true },
        { id: 8, title: 'PyTorch 基础', duration: '25分钟', completed: false, locked: true },
        { id: 9, title: '模型构建实践', duration: '35分钟', completed: false, locked: true }
      ]
    }
  ];
  
  const recommendedQuizzes = [
    { id: 1, title: '第一章测验', questions: 10, duration: '15分钟' },
    { id: 2, title: '神经网络基础测验', questions: 15, duration: '20分钟' }
  ];
  
  const tabs = [
    { key: 'curriculum', label: '课程内容', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'intro', label: '课程介绍', icon: <FileText className="w-4 h-4" /> }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-white mb-4">{courseData.title}</h1>
              <p className="text-lg opacity-90 mb-6">{courseData.description}</p>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{courseData.students} 名学生</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{courseData.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#FFD43B] text-[#FFD43B]" />
                  <span>{courseData.rating} 评分</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button size="lg" onClick={() => onNavigate('video-player')}>
                  <Play className="w-5 h-5" />
                  继续学习
                </Button>
                <Button variant="secondary" size="lg">
                  <FileText className="w-5 h-5" />
                  课程资料
                </Button>
              </div>
            </div>
            
            <div>
              <Card className="p-6">
                <h4 className="mb-4">学习进度</h4>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#ADB5BD]">总体进度</span>
                    <span className="text-lg text-[#4C6EF5]">{courseData.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#E9ECEF] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] transition-all duration-300"
                      style={{ width: `${courseData.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ADB5BD]">已完成</span>
                    <span>7 / 20 课时</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ADB5BD]">预计完成</span>
                    <span>8 周后</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              
              <div className="mt-6">
                {activeTab === 'curriculum' && (
                  <div className="space-y-6">
                    {curriculum.map((chapter) => (
                      <div key={chapter.id}>
                        <h4 className="mb-4">{chapter.title}</h4>
                        <div className="space-y-2">
                          {chapter.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                lesson.locked
                                  ? 'border-[#E9ECEF] bg-[#F8F9FA] opacity-60'
                                  : 'border-[#E9ECEF] hover:border-[#4C6EF5] cursor-pointer'
                              }`}
                              onClick={() => !lesson.locked && onNavigate('video-player')}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                lesson.completed
                                  ? 'bg-[#51CF66] text-white'
                                  : lesson.locked
                                  ? 'bg-[#E9ECEF]'
                                  : 'bg-[#EDF2FF]'
                              }`}>
                                {lesson.completed ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : lesson.locked ? (
                                  <Lock className="w-5 h-5 text-[#ADB5BD]" />
                                ) : (
                                  <Play className="w-5 h-5 text-[#4C6EF5]" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h5 className="mb-1">{lesson.title}</h5>
                                <p className="text-xs text-[#ADB5BD]">{lesson.duration}</p>
                              </div>
                              
                              {lesson.locked && (
                                <span className="text-xs text-[#ADB5BD] bg-[#E9ECEF] px-3 py-1 rounded-full">
                                  待解锁
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'intro' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3">课程简介</h4>
                      <p className="text-[#212529] leading-relaxed">{courseData.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="mb-3">学习目标</h4>
                      <ul className="space-y-2">
                        {courseData.learningGoals.map((goal, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#51CF66] flex-shrink-0 mt-0.5" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="mb-3">授课讲师</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-full flex items-center justify-center text-white text-xl">
                          张
                        </div>
                        <div>
                          <h5>{courseData.instructor}</h5>
                          <p className="text-sm text-[#ADB5BD]">深度学习专家 · 博士导师</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div>
            <Card className="p-6 mb-6">
              <h4 className="mb-4">推荐测验</h4>
              <div className="space-y-3">
                {recommendedQuizzes.map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors cursor-pointer"
                    onClick={() => onNavigate('test-center')}
                  >
                    <h5 className="mb-2">{quiz.title}</h5>
                    <div className="flex items-center gap-4 text-xs text-[#ADB5BD]">
                      <span>{quiz.questions} 题</span>
                      <span>{quiz.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="mb-4">需要帮助？</h4>
              <p className="text-sm text-[#ADB5BD] mb-4">
                遇到问题？AI 助教随时为您解答
              </p>
              <Button variant="primary" fullWidth onClick={() => onNavigate('ai-chat')}>
                咨询 AI 助教
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
