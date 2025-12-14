import React from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { FileText, Sparkles, Clock, Award, Plus, Play } from 'lucide-react';

interface TestCenterProps {
  onNavigate: (page: string) => void;
}

export function TestCenter({ onNavigate }: TestCenterProps) {
  const quizzes = [
    {
      id: 1,
      title: '深度学习基础 - 第一章测验',
      questions: 15,
      duration: 20,
      attempts: 2,
      bestScore: 85,
      status: 'completed'
    },
    {
      id: 2,
      title: '神经网络原理测验',
      questions: 20,
      duration: 30,
      attempts: 0,
      bestScore: null,
      status: 'available'
    },
    {
      id: 3,
      title: '深度学习框架实践',
      questions: 25,
      duration: 40,
      attempts: 0,
      bestScore: null,
      status: 'locked'
    }
  ];
  
  const recentAttempts = [
    {
      id: 1,
      quiz: '深度学习基础 - 第一章测验',
      score: 85,
      date: '2天前',
      duration: '18分钟'
    },
    {
      id: 2,
      quiz: 'Python 基础测验',
      score: 92,
      date: '5天前',
      duration: '15分钟'
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#51CF66] to-[#37B24D] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">AI 测验中心</h1>
          <p className="text-lg opacity-90">智能出题、自动评分、个性化反馈</p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* AI Generate */}
            <Card className="p-6 mb-8 bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-6 h-6" />
                    <h3 className="text-white">AI 智能出题</h3>
                  </div>
                  <p className="mb-6 opacity-90">
                    基于您的学习进度和知识掌握情况，AI 自动生成个性化测验题目
                  </p>
                  <Button variant="secondary" size="lg">
                    <Plus className="w-5 h-5" />
                    生成测验
                  </Button>
                </div>
                <div className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center ml-6">
                  <Sparkles className="w-16 h-16" />
                </div>
              </div>
            </Card>
            
            {/* Available Quizzes */}
            <div>
              <h3 className="mb-4">可用测验</h3>
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4>{quiz.title}</h4>
                          {quiz.status === 'completed' && (
                            <span className="text-xs bg-[#51CF66]/20 text-[#51CF66] px-3 py-1 rounded-full">
                              已完成
                            </span>
                          )}
                          {quiz.status === 'locked' && (
                            <span className="text-xs bg-[#ADB5BD]/20 text-[#ADB5BD] px-3 py-1 rounded-full">
                              未解锁
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 mb-4 text-sm text-[#ADB5BD]">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{quiz.questions} 题</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{quiz.duration} 分钟</span>
                          </div>
                          {quiz.bestScore !== null && (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              <span>最高分：{quiz.bestScore}</span>
                            </div>
                          )}
                        </div>
                        
                        {quiz.attempts > 0 && (
                          <p className="text-sm text-[#ADB5BD] mb-4">
                            已尝试 {quiz.attempts} 次
                          </p>
                        )}
                        
                        <div className="flex gap-3">
                          {quiz.status !== 'locked' && (
                            <Button 
                              variant={quiz.status === 'completed' ? 'secondary' : 'primary'}
                              onClick={() => onNavigate('exam-attempt')}
                            >
                              <Play className="w-4 h-4" />
                              {quiz.status === 'completed' ? '再次练习' : '开始测验'}
                            </Button>
                          )}
                          {quiz.status === 'completed' && (
                            <Button variant="ghost" onClick={() => onNavigate('exam-result')}>
                              查看结果
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="p-6">
              <h5 className="mb-4">测验统计</h5>
              <div className="space-y-4">
                <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="text-3xl mb-1">12</div>
                  <p className="text-sm text-[#ADB5BD]">已完成测验</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="text-3xl mb-1">87</div>
                  <p className="text-sm text-[#ADB5BD]">平均分数</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="text-3xl mb-1">5</div>
                  <p className="text-sm text-[#ADB5BD]">满分次数</p>
                </div>
              </div>
            </Card>
            
            {/* Recent Attempts */}
            <Card className="p-6">
              <h5 className="mb-4">最近测验</h5>
              <div className="space-y-3">
                {recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="p-4 bg-[#F8F9FA] rounded-lg">
                    <h5 className="mb-2 text-sm">{attempt.quiz}</h5>
                    <div className="flex items-center justify-between text-xs text-[#ADB5BD]">
                      <span>分数：{attempt.score}</span>
                      <span>{attempt.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Tips */}
            <Card className="p-6">
              <h5 className="mb-4">测验技巧</h5>
              <ul className="space-y-2 text-sm text-[#212529]">
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>认真复习课程内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>合理分配答题时间</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>仔细阅读题目要求</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>利用 AI 助教答疑</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
