import React from 'react';
import { Card } from '../design-system/Card';
import { Clock, Award, BookOpen, TrendingUp, Target, Zap, Users, Brain, Activity, Shield, BarChart2 } from 'lucide-react';
import { UserProfile } from '../../services/auth';

interface LearningAnalyticsProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function LearningAnalytics({ onNavigate, currentUser }: LearningAnalyticsProps) {
  const analytics = {
    totalHours: 45.5,
    coursesCompleted: 3,
    averageScore: 87,
    streak: 12,
    weeklyGoal: 80
  };
  
  const knowledgeRadar = [
    { skill: '深度学习', value: 85 },
    { skill: 'Python', value: 92 },
    { skill: '数据分析', value: 78 },
    { skill: '算法', value: 75 },
    { skill: '数学基础', value: 88 }
  ];
  
  const weeklyActivity = [
    { day: '周一', hours: 2.5 },
    { day: '周二', hours: 3.2 },
    { day: '周三', hours: 1.8 },
    { day: '周四', hours: 4.0 },
    { day: '周五', hours: 2.3 },
    { day: '周六', hours: 3.5 },
    { day: '周日', hours: 2.0 }
  ];
  
  const testScores = [
    { date: '1月', score: 75 },
    { date: '2月', score: 80 },
    { date: '3月', score: 85 },
    { date: '4月', score: 87 },
    { date: '5月', score: 90 }
  ];
  
  const aiInsights = [
    {
      type: 'strength',
      title: '学习习惯优秀',
      description: '您保持了连续 12 天的学习记录，学习时间分布均衡'
    },
    {
      type: 'improvement',
      title: '算法知识需加强',
      description: '算法相关测验得分较低，建议重点复习数据结构与算法'
    },
    {
      type: 'trend',
      title: '进步显著',
      description: '最近 3 个月测验成绩持续上升，保持这个势头！'
    }
  ];
  
  const maxHours = Math.max(...weeklyActivity.map(d => d.hours));
  const weakPoints = [
    { topic: '算法', score: 68, suggestion: '增加排序/动态规划练习' },
    { topic: '数学基础', score: 72, suggestion: '补充线性代数与概率统计' }
  ];

  const classReport = {
    avgWatch: 36,
    avgScore: 82,
    topQuestion: '反向传播梯度消失',
    recommendation: '针对梯度问题安排专项直播答疑'
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#51CF66] to-[#37B24D] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">学习画像</h1>
          <p className="text-lg opacity-90">数据驱动的学习分析，助您精准提升</p>
          <p className="text-sm opacity-80 mt-3">
            当前身份：{currentUser?.role === 'teacher' ? '教师' : currentUser?.role === 'assistant' ? 'AI 助教' : '学生/访客'}
            {currentUser?.name ? `（${currentUser.name}）` : ''}
          </p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-[#EDF2FF] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-[#4C6EF5]" />
            </div>
            <div className="text-3xl mb-1">{analytics.totalHours}</div>
            <p className="text-sm text-[#ADB5BD]">总学习时长(h)</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-[#E7F5FF] rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-[#51CF66]" />
            </div>
            <div className="text-3xl mb-1">{analytics.coursesCompleted}</div>
            <p className="text-sm text-[#ADB5BD]">已完成课程</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-[#FFF4E6] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-7 h-7 text-[#FFD43B]" />
            </div>
            <div className="text-3xl mb-1">{analytics.averageScore}</div>
            <p className="text-sm text-[#ADB5BD]">平均分数</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-[#FFE3E3] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-[#FF6B6B]" />
            </div>
            <div className="text-3xl mb-1">{analytics.streak}</div>
            <p className="text-sm text-[#ADB5BD]">连续学习(天)</p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="w-14 h-14 bg-[#F3F0FF] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-7 h-7 text-[#845EF7]" />
            </div>
            <div className="text-3xl mb-1">{analytics.weeklyGoal}%</div>
            <p className="text-sm text-[#ADB5BD]">周目标达成</p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Activity */}
          <Card className="p-6">
            <h4 className="mb-6">本周学习时长</h4>
            <div className="space-y-4">
              {weeklyActivity.map((day) => (
                <div key={day.day}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{day.day}</span>
                    <span className="text-sm text-[#4C6EF5]">{day.hours}h</span>
                  </div>
                  <div className="w-full h-3 bg-[#E9ECEF] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] transition-all duration-300 rounded-full"
                      style={{ width: `${(day.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#212529]">
                本周累计学习 <strong className="text-[#4C6EF5]">19.3 小时</strong>，超过 78% 的同学
              </p>
            </div>
          </Card>
          
          {/* Test Scores Trend */}
          <Card className="p-6">
            <h4 className="mb-6">测验成绩趋势</h4>
            <div className="h-64 flex items-end justify-between gap-4">
              {testScores.map((item) => (
                <div key={item.date} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative">
                    <div 
                      className="w-full bg-gradient-to-t from-[#4C6EF5] to-[#845EF7] rounded-t-lg transition-all duration-300"
                      style={{ height: `${item.score * 2.4}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#4C6EF5] text-white text-xs px-2 py-1 rounded">
                      {item.score}
                    </div>
                  </div>
                  <span className="text-xs text-[#ADB5BD] mt-2">{item.date}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-[#E7F5FF] rounded-lg border border-[#51CF66]/20">
              <p className="text-sm text-[#212529]">
                <TrendingUp className="w-4 h-4 text-[#51CF66] inline mr-1" />
                成绩持续上升，进步幅度 <strong className="text-[#51CF66]">+15 分</strong>
              </p>
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Knowledge Radar */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h4 className="mb-6">知识点掌握雷达图</h4>
              <div className="relative h-96 flex items-center justify-center">
                {/* Simplified Radar Chart */}
                <div className="relative w-80 h-80">
                  {/* Background circles */}
                  {[20, 40, 60, 80, 100].map((percent) => (
                    <div
                      key={percent}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#E9ECEF] rounded-full"
                      style={{ 
                        width: `${percent}%`, 
                        height: `${percent}%` 
                      }}
                    />
                  ))}
                  
                  {/* Data representation */}
                  {knowledgeRadar.map((item, index) => {
                    const angle = (index * 360) / knowledgeRadar.length;
                    const radius = 140;
                    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
                    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                    
                    return (
                      <div
                        key={item.skill}
                        className="absolute top-1/2 left-1/2"
                        style={{
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                        }}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-[#4C6EF5] rounded-full flex items-center justify-center text-white text-xs">
                            {item.value}
                          </div>
                          <p className="absolute top-full mt-2 text-xs text-center whitespace-nowrap -translate-x-1/4">
                            {item.skill}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {knowledgeRadar.map((item) => (
                  <div key={item.skill} className="p-3 bg-[#F8F9FA] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{item.skill}</span>
                      <span className="text-sm text-[#4C6EF5]">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4C6EF5] transition-all duration-300"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          {/* AI Insights */}
          <div>
            <Card className="p-6">
              <h4 className="mb-6">AI 学习建议</h4>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    insight.type === 'strength' ? 'bg-[#E7F5FF] border-[#51CF66]/20' :
                    insight.type === 'improvement' ? 'bg-[#FFF4E6] border-[#FFD43B]/20' :
                    'bg-[#F3F0FF] border-[#845EF7]/20'
                  }`}>
                    <h5 className="mb-2">{insight.title}</h5>
                    <p className="text-sm text-[#ADB5BD]">{insight.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] rounded-lg text-white">
                <h5 className="mb-2 text-white">下周学习计划</h5>
                <ul className="text-sm space-y-1 opacity-90">
                  <li>• 完成"算法进阶"课程 3 个章节</li>
                  <li>• 练习 10 道算法题目</li>
                  <li>• 复习深度学习框架知识</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#4C6EF5]" />
                <h4 className="mb-0">个人学习画像（AI）</h4>
              </div>
              <span className="text-xs text-[#ADB5BD]">基于观看时长 / 测验成绩 / 提问内容</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F8F9FA] rounded-lg">
                <p className="text-sm text-[#ADB5BD] mb-2">薄弱知识点</p>
                <div className="space-y-3">
                  {weakPoints.map((item) => (
                    <div key={item.topic}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.topic}</span>
                        <span className="text-sm text-[#FF6B6B]">{item.score}</span>
                      </div>
                      <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF6B6B] transition-all" style={{ width: `${item.score}%` }} />
                      </div>
                      <p className="text-xs text-[#ADB5BD] mt-1">{item.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-[#F8F9FA] rounded-lg">
                <p className="text-sm text-[#ADB5BD] mb-2">学习习惯分析</p>
                <ul className="text-sm space-y-2">
                  <li>• 高峰时段：晚间 20:00-22:00，建议提前安排测验</li>
                  <li>• 视频观看平均完成度：82%，建议开启 1.25x 提升效率</li>
                  <li>• 提问偏好：算法/梯度问题，推荐专项巩固清单</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#37B24D]" />
              <h4 className="mb-0">班级整体报告</h4>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#ADB5BD]">平均观看时长</span>
              <span>{classReport.avgWatch} 分钟/周</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#ADB5BD]">平均测验分</span>
              <span>{classReport.avgScore}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#ADB5BD]">高频提问</span>
              <span>{classReport.topQuestion}</span>
            </div>
            <div className="p-3 bg-[#E7F5FF] rounded-lg border border-[#4C6EF5]/20 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-[#4C6EF5]" />
                <span className="text-[#4C6EF5]">教学建议</span>
              </div>
              <p className="text-[#495057]">{classReport.recommendation}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => onNavigate('ai-chat')}>
                <Activity className="w-4 h-4" />
                安排专项辅导
              </Button>
              <Button variant="ghost" size="sm">
                <BarChart2 className="w-4 h-4" />
                导出报告
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
