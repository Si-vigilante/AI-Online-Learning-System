import React from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { BookOpen, FileText, Video, Users, PenTool, BarChart3, Plus, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../services/auth';

interface TeacherDashboardProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function TeacherDashboard({ onNavigate, currentUser }: TeacherDashboardProps) {
  const stats = {
    totalStudents: 156,
    activeCourses: 5,
    pendingReviews: 12
  };
  
  const myCourses = [
    { id: 1, title: '深度学习基础', students: 45, progress: 'Week 8/12' },
    { id: 2, title: 'Python 编程入门', students: 68, progress: 'Week 5/10' },
    { id: 3, title: '数据结构与算法', students: 43, progress: 'Week 3/16' }
  ];
  
  const pendingReviews = [
    { id: 1, student: '张三', type: '报告', title: '机器学习期中报告', submitted: '2小时前' },
    { id: 2, student: '李四', type: '作业', title: '第五章课后练习', submitted: '5小时前' }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#845EF7] to-[#4C6EF5] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">{currentUser?.name || '教师'}，欢迎来到工作台</h1>
          <p className="text-lg opacity-90">AI 赋能教学，让创作与管理更高效</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#EDF2FF] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4C6EF5]" />
              </div>
            </div>
            <p className="text-sm text-[#ADB5BD] mb-1">总学生数</p>
            <h3>{stats.totalStudents} 人</h3>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#F3F0FF] rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#845EF7]" />
              </div>
            </div>
            <p className="text-sm text-[#ADB5BD] mb-1">进行中课程</p>
            <h3>{stats.activeCourses} 门</h3>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#FFF4E6] rounded-xl flex items-center justify-center">
                <PenTool className="w-6 h-6 text-[#FFD43B]" />
              </div>
            </div>
            <p className="text-sm text-[#ADB5BD] mb-1">待批改作业</p>
            <h3>{stats.pendingReviews} 份</h3>
          </Card>
        </div>
        
        {/* AI Tools */}
        <div className="mb-8">
          <h3 className="mb-4">AI 教学工具</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6" onClick={() => onNavigate('text-to-ppt')}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">文本转 PPT</h4>
                  <p className="text-sm text-[#ADB5BD] mb-3">一键生成结构化教学课件</p>
                  <Button variant="secondary" size="sm">
                    立即使用
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="p-6" onClick={() => onNavigate('ppt-to-video')}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#845EF7] to-[#BE4BDB] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">PPT 转视频</h4>
                  <p className="text-sm text-[#ADB5BD] mb-3">AI 自动生成教学视频</p>
                  <Button variant="secondary" size="sm">
                    立即使用
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="p-6" onClick={() => onNavigate('test-center')}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#51CF66] to-[#37B24D] rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">AI 智能出题</h4>
                  <p className="text-sm text-[#ADB5BD] mb-3">自动生成测验题库</p>
                  <Button variant="secondary" size="sm">
                    立即使用
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* My Courses & Pending Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3>我创建的课程</h3>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
                新建课程
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                {myCourses.map((course) => (
                  <div 
                    key={course.id} 
                    className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors cursor-pointer"
                    onClick={() => onNavigate('course-detail')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h5 className="mb-1">{course.title}</h5>
                        <p className="text-xs text-[#ADB5BD]">
                          {course.students} 名学生 · {course.progress}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#ADB5BD]" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          {/* Pending Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3>待批改作业</h3>
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                {pendingReviews.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors cursor-pointer"
                    onClick={() => onNavigate('report-review')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#4C6EF5] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{item.student[0]}</span>
                        </div>
                        <div>
                          <h5>{item.student}</h5>
                          <p className="text-xs text-[#ADB5BD]">{item.submitted}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#FFD43B]/20 text-[#FFD43B] px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-[#212529] ml-10">{item.title}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#E9ECEF]">
                <Button variant="primary" fullWidth onClick={() => onNavigate('report-review')}>
                  开始批改
                </Button>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Student Data Overview */}
        <div className="mt-8">
          <h3 className="mb-4">学生数据总览</h3>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">92%</div>
                <p className="text-sm text-[#ADB5BD]">平均出勤率</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">87</div>
                <p className="text-sm text-[#ADB5BD]">平均测验分数</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">78%</div>
                <p className="text-sm text-[#ADB5BD]">作业完成率</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">4.8</div>
                <p className="text-sm text-[#ADB5BD]">课程平均评分</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
