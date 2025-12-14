import React from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { BookOpen, MessageCircle, FileText, TrendingUp, Clock, Award, Play, CheckCircle } from 'lucide-react';
import { UserProfile } from '../../services/auth';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function StudentDashboard({ onNavigate, currentUser }: StudentDashboardProps) {
  const stats = currentUser?.stats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHours: 0,
    certificates: 0
  };

  const todayProgress = {
    studyTime: stats.totalHours > 0 ? `${stats.totalHours} 小时` : '0 小时',
    completedLessons: stats.coursesCompleted || 0,
    quizScore: stats.certificates > 0 ? 85 : 0
  };
  
  const recommendedCourses = [
    { id: 1, title: '深度学习基础', progress: 0, instructor: '张教授', thumbnail: 'ai-neural' },
    { id: 2, title: 'Python 数据分析', progress: 0, instructor: '李老师', thumbnail: 'data-science' },
    { id: 3, title: '机器学习实战', progress: 0, instructor: '王博士', thumbnail: 'machine-learning' }
  ];
  
  const pendingTasks = [
    { id: 1, type: 'quiz', title: '暂无待办', deadline: '' },
    { id: 2, type: 'report', title: '暂无待办', deadline: '' }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">欢迎回来，{currentUser?.name || '学生'}！</h1>
          <p className="text-lg opacity-90">你的学习旅程由 AI 贴身陪伴</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Today's Progress */}
        <div className="mb-8">
          <h3 className="mb-4">今日学习进度</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-[#EDF2FF] rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#4C6EF5]" />
                </div>
                <span className="text-xs text-[#ADB5BD]">今日</span>
              </div>
              <p className="text-sm text-[#ADB5BD] mb-1">学习时长</p>
              <h3>{todayProgress.studyTime}</h3>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-[#F3F0FF] rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#845EF7]" />
                </div>
                <span className="text-xs text-[#ADB5BD]">今日</span>
              </div>
              <p className="text-sm text-[#ADB5BD] mb-1">完成课程</p>
              <h3>{todayProgress.completedLessons} 节</h3>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-[#E7F5FF] rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#51CF66]" />
                </div>
                <span className="text-xs text-[#ADB5BD]">最近测验</span>
              </div>
              <p className="text-sm text-[#ADB5BD] mb-1">平均分数</p>
              <h3>{todayProgress.quizScore} 分</h3>
            </Card>
          </div>
        </div>
        
        {/* Recommended Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3>AI 推荐课程</h3>
            <Button variant="ghost" onClick={() => onNavigate('course-list')}>
              查看全部
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden" onClick={() => onNavigate('course-detail')}>
                <div className="h-40 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white opacity-50" />
                </div>
                <div className="p-5">
                  <h4 className="mb-2">{course.title}</h4>
                  <p className="text-sm text-[#ADB5BD] mb-3">讲师：{course.instructor}</p>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#ADB5BD]">学习进度</span>
                      <span className="text-xs text-[#4C6EF5]">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4C6EF5] transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <Button variant={course.progress > 0 ? 'primary' : 'secondary'} fullWidth size="sm">
                    <Play className="w-4 h-4" />
                    {course.progress > 0 ? '继续学习' : '开始学习'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Quick Actions & Pending Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div>
            <h3 className="mb-4">快捷功能</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center" onClick={() => onNavigate('ai-chat')}>
                <div className="w-14 h-14 bg-[#F3F0FF] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-7 h-7 text-[#845EF7]" />
                </div>
                <h5>AI 助教答疑</h5>
                <p className="text-xs text-[#ADB5BD] mt-1">24/7 智能解答</p>
              </Card>
              
              <Card className="p-6 text-center" onClick={() => onNavigate('test-center')}>
                <div className="w-14 h-14 bg-[#EDF2FF] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-[#4C6EF5]" />
                </div>
                <h5>AI 测验</h5>
                <p className="text-xs text-[#ADB5BD] mt-1">智能出题评分</p>
              </Card>
              
              <Card className="p-6 text-center" onClick={() => onNavigate('learning-analytics')}>
                <div className="w-14 h-14 bg-[#E7F5FF] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-7 h-7 text-[#51CF66]" />
                </div>
                <h5>学习画像</h5>
                <p className="text-xs text-[#ADB5BD] mt-1">数据驱动分析</p>
              </Card>
              
              <Card className="p-6 text-center" onClick={() => onNavigate('course-list')}>
                <div className="w-14 h-14 bg-[#FFF4E6] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-[#FFD43B]" />
                </div>
                <h5>课程中心</h5>
                <p className="text-xs text-[#ADB5BD] mt-1">浏览所有课程</p>
              </Card>
            </div>
          </div>
          
          {/* Pending Tasks */}
          <div>
            <h3 className="mb-4">待完成任务</h3>
            <Card className="p-6">
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-4 p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      task.type === 'quiz' ? 'bg-[#EDF2FF]' : 'bg-[#F3F0FF]'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        task.type === 'quiz' ? 'text-[#4C6EF5]' : 'text-[#845EF7]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h5 className="mb-1">{task.title}</h5>
                      <p className="text-xs text-[#ADB5BD]">截止时间：{task.deadline}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {pendingTasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-[#51CF66] mx-auto mb-3" />
                  <p className="text-[#ADB5BD]">太棒了！暂无待完成任务</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
