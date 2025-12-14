import React from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { LogIn, UserPlus, Home, FileText, Video, BookOpen, MessageCircle, ClipboardList, Upload, BarChart3, User, Settings, ArrowRight } from 'lucide-react';

interface FlowChartProps {
  onNavigate: (page: string) => void;
}

export function FlowChart({ onNavigate }: FlowChartProps) {
  const flowNodes = [
    {
      id: 'auth',
      title: '认证模块',
      pages: [
        { name: '登录页面', page: 'login', icon: <LogIn className="w-4 h-4" />, desc: 'Login' },
        { name: '注册页面', page: 'register', icon: <UserPlus className="w-4 h-4" />, desc: 'Register' }
      ],
      color: 'from-[#4C6EF5] to-[#3B5BDB]'
    },
    {
      id: 'dashboard',
      title: '首页模块',
      pages: [
        { name: '学生首页', page: 'student-dashboard', icon: <Home className="w-4 h-4" />, desc: 'Student Dashboard' },
        { name: '教师首页', page: 'teacher-dashboard', icon: <Home className="w-4 h-4" />, desc: 'Teacher Dashboard' }
      ],
      color: 'from-[#845EF7] to-[#7048E8]'
    },
    {
      id: 'content-creation',
      title: '教材生成模块',
      pages: [
        { name: '文本转PPT', page: 'text-to-ppt', icon: <FileText className="w-4 h-4" />, desc: 'Text-to-PPT' },
        { name: 'PPT转视频', page: 'ppt-to-video', icon: <Video className="w-4 h-4" />, desc: 'PPT-to-Video' }
      ],
      color: 'from-[#51CF66] to-[#37B24D]'
    },
    {
      id: 'courses',
      title: '线上课程模块',
      pages: [
        { name: '课程目录', page: 'course-list', icon: <BookOpen className="w-4 h-4" />, desc: 'Course List' },
        { name: '课程详情', page: 'course-detail', icon: <BookOpen className="w-4 h-4" />, desc: 'Course Detail' },
        { name: '视频播放', page: 'video-player', icon: <Video className="w-4 h-4" />, desc: 'Video Player' }
      ],
      color: 'from-[#FF6B6B] to-[#FA5252]'
    },
    {
      id: 'ai-assist',
      title: 'AI助教模块',
      pages: [
        { name: 'AI助教答疑', page: 'ai-chat', icon: <MessageCircle className="w-4 h-4" />, desc: 'AI Assist Chat' }
      ],
      color: 'from-[#FFD43B] to-[#FCC419]'
    },
    {
      id: 'testing',
      title: 'AI测验模块',
      pages: [
        { name: '测验中心', page: 'test-center', icon: <ClipboardList className="w-4 h-4" />, desc: 'Test Center' },
        { name: '测验答题', page: 'exam-attempt', icon: <ClipboardList className="w-4 h-4" />, desc: 'Exam Attempt' },
        { name: '测验结果', page: 'exam-result', icon: <ClipboardList className="w-4 h-4" />, desc: 'Exam Result' }
      ],
      color: 'from-[#20C997] to-[#12B886]'
    },
    {
      id: 'reports',
      title: 'AI报告模块',
      pages: [
        { name: '报告提交', page: 'report-upload', icon: <Upload className="w-4 h-4" />, desc: 'Report Upload' },
        { name: 'AI批改', page: 'report-review', icon: <FileText className="w-4 h-4" />, desc: 'AI Report Review' }
      ],
      color: 'from-[#E64980] to-[#C2255C]'
    },
    {
      id: 'analytics',
      title: '学习画像模块',
      pages: [
        { name: '学习分析', page: 'learning-analytics', icon: <BarChart3 className="w-4 h-4" />, desc: 'Learning Analytics' }
      ],
      color: 'from-[#339AF0] to-[#1C7ED6]'
    },
    {
      id: 'user',
      title: '用户模块',
      pages: [
        { name: '用户中心', page: 'profile', icon: <User className="w-4 h-4" />, desc: 'Profile' },
        { name: '系统设置', page: 'settings', icon: <Settings className="w-4 h-4" />, desc: 'Settings' }
      ],
      color: 'from-[#ADB5BD] to-[#868E96]'
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">系统架构流程图</h1>
          <p className="text-lg opacity-90">知域 · AI 智能教学系统 - 完整信息架构</p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        {/* System Overview */}
        <Card className="p-8 mb-8">
          <h3 className="mb-4">系统概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">18</div>
              <p className="text-sm text-[#ADB5BD]">页面总数</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">9</div>
              <p className="text-sm text-[#ADB5BD]">功能模块</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">10+</div>
              <p className="text-sm text-[#ADB5BD]">设计组件</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">AI</div>
              <p className="text-sm text-[#ADB5BD]">智能驱动</p>
            </div>
          </div>
        </Card>
        
        {/* Flow Diagram */}
        <div className="space-y-6">
          {flowNodes.map((module, index) => (
            <div key={module.id}>
              <Card className="overflow-hidden">
                <div className={`bg-gradient-to-r ${module.color} text-white p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white mb-1">{module.title}</h3>
                      <p className="text-sm opacity-90">{module.pages.length} 个页面</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-2xl">{index + 1}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {module.pages.map((page) => (
                      <div
                        key={page.page}
                        className="group p-4 bg-[#F8F9FA] rounded-lg hover:bg-white hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-[#4C6EF5]"
                        onClick={() => onNavigate(page.page)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${module.color} rounded-lg flex items-center justify-center text-white`}>
                            {page.icon}
                          </div>
                          <ArrowRight className="w-5 h-5 text-[#ADB5BD] group-hover:text-[#4C6EF5] transition-colors" />
                        </div>
                        <h5 className="mb-1">{page.name}</h5>
                        <p className="text-xs text-[#ADB5BD]">{page.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              {/* Arrow between modules */}
              {index < flowNodes.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="w-px h-8 bg-[#E9ECEF]" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* User Flow */}
        <Card className="p-8 mt-8">
          <h3 className="mb-6">典型用户流程</h3>
          <div className="space-y-8">
            {/* Student Flow */}
            <div>
              <h4 className="mb-4 text-[#4C6EF5]">学生学习流程</h4>
              <div className="flex items-center gap-3 overflow-x-auto pb-4">
                {[
                  '登录',
                  '浏览课程',
                  '观看视频',
                  'AI助教答疑',
                  '完成测验',
                  '查看分析'
                ].map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="flex-shrink-0 px-6 py-3 bg-[#EDF2FF] text-[#4C6EF5] rounded-lg whitespace-nowrap">
                      {index + 1}. {step}
                    </div>
                    {index < 5 && (
                      <ArrowRight className="w-5 h-5 text-[#ADB5BD] flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Teacher Flow */}
            <div>
              <h4 className="mb-4 text-[#845EF7]">教师教学流程</h4>
              <div className="flex items-center gap-3 overflow-x-auto pb-4">
                {[
                  '登录',
                  '生成PPT',
                  '创建视频',
                  'AI出题',
                  '批改报告',
                  '查看数据'
                ].map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="flex-shrink-0 px-6 py-3 bg-[#F3F0FF] text-[#845EF7] rounded-lg whitespace-nowrap">
                      {index + 1}. {step}
                    </div>
                    {index < 5 && (
                      <ArrowRight className="w-5 h-5 text-[#ADB5BD] flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Design System Info */}
        <Card className="p-8 mt-8">
          <h3 className="mb-6">设计系统规范</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="mb-3">配色方案</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#4C6EF5] rounded" />
                  <span className="text-sm">主色 #4C6EF5</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#845EF7] rounded" />
                  <span className="text-sm">强调色 #845EF7</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#51CF66] rounded" />
                  <span className="text-sm">成功色 #51CF66</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="mb-3">字体系统</h5>
              <div className="space-y-2 text-sm">
                <p>• 西文：Inter</p>
                <p>• 中文：Noto Sans SC</p>
                <p>• 圆角：8-12px</p>
                <p>• 阴影：柔和渐变</p>
              </div>
            </div>
            
            <div>
              <h5 className="mb-3">核心组件</h5>
              <div className="space-y-2 text-sm">
                <p>• 按钮 (3种变体)</p>
                <p>• 输入框 (带验证)</p>
                <p>• 卡片 (可悬停)</p>
                <p>• 对话气泡 (AI/用户)</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
