import React, { useState } from 'react';
import { Home, BookOpen, MessageCircle, FileText, BarChart3, User, Settings, Menu, X, Sparkles, LogOut, Shield, Users } from 'lucide-react';
import { UserProfile, UserRole } from '../services/auth';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: UserRole;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export function Navigation({ currentPage, onNavigate, userRole = 'student', currentUser, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const studentNav = [
    { id: 'student-dashboard', label: '首页', icon: <Home className="w-5 h-5" /> },
    { id: 'course-list', label: '课程', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'ai-chat', label: 'AI助教', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'test-center', label: '测验', icon: <FileText className="w-5 h-5" /> },
    { id: 'learning-analytics', label: '学习画像', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'study-hub', label: '在线自习室', icon: <Users className="w-5 h-5" /> }
  ];
  
  const teacherNav = [
    { id: 'teacher-dashboard', label: '工作台', icon: <Home className="w-5 h-5" /> },
    { id: 'text-to-ppt', label: '生成PPT', icon: <FileText className="w-5 h-5" /> },
    { id: 'ppt-to-video', label: '生成视频', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'course-list', label: '课程管理', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'test-center', label: 'AI出题', icon: <FileText className="w-5 h-5" /> },
    { id: 'study-hub', label: '在线自习室', icon: <Users className="w-5 h-5" /> }
  ];

  const assistantNav = [
    { id: 'ai-chat', label: 'AI答疑', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'test-center', label: '测验批改', icon: <FileText className="w-5 h-5" /> },
    { id: 'report-review', label: '报告审核', icon: <Shield className="w-5 h-5" /> },
    { id: 'learning-analytics', label: '学习画像', icon: <BarChart3 className="w-5 h-5" /> }
  ];
  
  const navItems = userRole === 'teacher' ? teacherNav : userRole === 'assistant' ? assistantNav : studentNav;
  
  // Don't show navigation on login/register/flow-chart pages
  if (['login', 'register', 'flow-chart'].includes(currentPage)) {
    return null;
  }
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-b border-[#E9ECEF] sticky top-0 z-50">
        <div className="container-custom py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onNavigate(userRole === 'teacher' ? 'teacher-dashboard' : userRole === 'assistant' ? 'ai-chat' : 'student-dashboard')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm md:text-base font-semibold text-[#212529] whitespace-nowrap">知域 · AI 智能教学系统</p>
                <p className="text-xs text-[#ADB5BD] whitespace-nowrap leading-snug">
                  {userRole === 'teacher' ? '教师中心' : userRole === 'assistant' ? 'AI 助教' : '智慧学习平台'}
                </p>
              </div>
            </div>
            
            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentPage === item.id
                      ? 'bg-[#EDF2FF] text-[#4C6EF5]'
                      : 'text-[#212529] hover:bg-[#F8F9FA]'
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
                onClick={() => onNavigate('profile')}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-[#E9ECEF]"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-full flex items-center justify-center text-white text-sm">
                    {currentUser?.name?.[0] || 'U'}
                  </div>
                )}
                <span className="text-sm">{currentUser?.name || '用户'}</span>
              </button>
              
              <button 
                className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
                onClick={() => onNavigate('settings')}
              >
                <Settings className="w-5 h-5 text-[#ADB5BD]" />
              </button>
              
              <button 
                className="p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#ADB5BD] hover:text-[#FF6B6B]"
                onClick={() => {
                  onLogout?.();
                  onNavigate('login');
                }}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white border-b border-[#E9ECEF] sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div
            className="flex items-center gap-2"
            onClick={() => onNavigate(userRole === 'teacher' ? 'teacher-dashboard' : userRole === 'assistant' ? 'ai-chat' : 'student-dashboard')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">知域 · AI 智能教学系统</span>
          </div>
          
          <button
            className="p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-[#E9ECEF] bg-white">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentPage === item.id
                      ? 'bg-[#EDF2FF] text-[#4C6EF5]'
                      : 'text-[#212529] hover:bg-[#F8F9FA]'
                  }`}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              
              <div className="pt-4 border-t border-[#E9ECEF] space-y-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F8F9FA]"
                  onClick={() => {
                    onNavigate('profile');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <User className="w-5 h-5" />
                  <span>个人中心</span>
                </button>
                
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F8F9FA]"
                  onClick={() => {
                    onNavigate('settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Settings className="w-5 h-5" />
                  <span>系统设置</span>
                </button>
                
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F8F9FA] text-[#FF6B6B]"
                onClick={() => {
                  onLogout?.();
                  onNavigate('login');
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
