import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { FileText, Sparkles, Clock, Award, Plus, Play, Shield, Eye, Camera, Timer, Shuffle, BookOpenCheck } from 'lucide-react';
import { UserProfile } from '../../services/auth';

interface TestCenterProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function TestCenter({ onNavigate, currentUser }: TestCenterProps) {
  const resolvedRole = currentUser?.role === 'teacher' ? 'teacher' : 'student';
  const [aiConfig, setAiConfig] = useState({
    difficulty: '中等',
    questionTypes: ['单选', '多选', '判断', '简答'],
    knowledge: ['激活函数', '反向传播'],
    randomAssemble: true
  });
  const [proctorSettings, setProctorSettings] = useState({
    timer: true,
    antiCheat: true,
    camera: false
  });

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
          <div className="flex gap-3 mt-4 text-sm opacity-80">
            当前身份：{resolvedRole === 'teacher' ? '教师端' : '学生端'}
          </div>
        </div>
      </div>
      
      <div className="container-custom py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teacher AI Generate */}
            {resolvedRole === 'teacher' && (
              <Card className="p-6 bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      <h3 className="text-white">AI 自动出题</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80 mb-1">知识点范围</p>
                        <div className="flex flex-wrap gap-2">
                          {aiConfig.knowledge.map((k) => (
                            <span key={k} className="px-3 py-1 bg-white/15 rounded-full text-xs">{k}</span>
                          ))}
                          <button className="text-xs underline" onClick={() => setAiConfig({ ...aiConfig, knowledge: [...aiConfig.knowledge, '卷积网络'] })}>
                            + 添加
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80 mb-1">难度</p>
                        <select
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
                          value={aiConfig.difficulty}
                          onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })}
                        >
                          <option>简单</option>
                          <option>中等</option>
                          <option>困难</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-white/10 rounded-lg">
                      <p className="text-xs opacity-80 mb-1">题型组合（客观/主观）</p>
                      <div className="flex flex-wrap gap-2">
                        {['单选', '多选', '判断', '简答', '论述'].map((type) => (
                          <button
                            key={type}
                            className={`px-3 py-1 rounded-full text-xs border ${aiConfig.questionTypes.includes(type) ? 'bg-white text-[#4C6EF5]' : 'border-white/40'}`}
                            onClick={() => {
                              const has = aiConfig.questionTypes.includes(type);
                              setAiConfig({
                                ...aiConfig,
                                questionTypes: has ? aiConfig.questionTypes.filter((t) => t !== type) : [...aiConfig.questionTypes, type]
                              });
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        <input
                          type="checkbox"
                          checked={aiConfig.randomAssemble}
                          onChange={(e) => setAiConfig({ ...aiConfig, randomAssemble: e.target.checked })}
                        />
                        题库随机组卷
                      </label>
                      <span className="text-white/80">自动包含客观题即时评分与主观题语义评分</span>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="secondary" size="lg">
                        <Plus className="w-5 h-5" />
                        生成测验
                      </Button>
                      <Button variant="ghost" size="lg">
                        <BookOpenCheck className="w-5 h-5" />
                        预览题单
                      </Button>
                    </div>
                  </div>
                  <div className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center ml-6">
                    <Sparkles className="w-16 h-16" />
                  </div>
                </div>
              </Card>
            )}

            {/* Student anti-cheat settings */}
            {resolvedRole === 'student' && (
            <Card className="p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#37B24D]" />
                    <h4 className="mb-0">考前检查 · 防作弊</h4>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onNavigate('exam-attempt')}>开始答题</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-[#37B24D]" />
                      <span>计时</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={proctorSettings.timer} onChange={(e) => setProctorSettings({ ...proctorSettings, timer: e.target.checked })} />
                      开启倒计时
                    </label>
                  </div>
                  <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-[#37B24D]" />
                      <span>切屏警告</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={proctorSettings.antiCheat} onChange={(e) => setProctorSettings({ ...proctorSettings, antiCheat: e.target.checked })} />
                      防止切出考试页面
                    </label>
                  </div>
                  <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-[#37B24D]" />
                      <span>摄像头监考</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={proctorSettings.camera} onChange={(e) => setProctorSettings({ ...proctorSettings, camera: e.target.checked })} />
                      开启监控（需授权）
                    </label>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Available Quizzes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="mb-0">可用测验</h3>
                {resolvedRole === 'teacher' && (
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('exam-result')}>
                    智能批改复核
                  </Button>
                )}
              </div>
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
