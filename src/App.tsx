import React, { useEffect, useState, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { UserProfile, UserRole, clearSession, deleteUser, getCurrentUser, ensureTestStudent } from './services/auth';
import { ensureCourseSeed } from './services/courses';

// Pages
import { Login } from './components/pages/Login';
import { Register } from './components/pages/Register';
import { StudentDashboard } from './components/pages/StudentDashboard';
import { TeacherDashboard } from './components/pages/TeacherDashboard';
import { TextToPPT } from './components/pages/TextToPPT';
import { PPTToVideo } from './components/pages/PPTToVideo';
import { CourseList } from './components/pages/CourseList';
import { CourseDetail } from './components/pages/CourseDetail';
import { VideoPlayer } from './components/pages/VideoPlayer';
import { AIChat } from './components/pages/AIChat';
import { TestCenter } from './components/pages/TestCenter';
import { ExamAttempt } from './components/pages/ExamAttempt';
import { ExamResult } from './components/pages/ExamResult';
import { ReportUpload } from './components/pages/ReportUpload';
import { ReportReview } from './components/pages/ReportReview';
import { ReportCenter } from './components/pages/ReportCenter';
import { LearningAnalytics } from './components/pages/LearningAnalytics';
import { Profile } from './components/pages/Profile';
import { Settings } from './components/pages/Settings';
import { FlowChart } from './components/pages/FlowChart';
import { StudyHub } from './components/pages/StudyHub';
import { RestRoom } from './components/pages/RestRoom';
import { useRightClickSwipeBack } from './hooks/useRightClickSwipeBack';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();
  const navStack = useRef<string[]>([]);
  useRightClickSwipeBack();

  const getLandingPage = (role: UserRole) => {
    if (role === 'teacher') return 'teacher-dashboard';
    if (role === 'assistant') return 'ai-chat';
    return 'student-dashboard';
  };

  useEffect(() => {
    ensureCourseSeed();
    ensureTestStudent();
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
      setUserRole(sessionUser.role);
      setCurrentPage(getLandingPage(sessionUser.role));
      navStack.current = [];
    } else {
      setCurrentPage('login');
    }
  }, []);
  
  const handleNavigate = (page: string) => {
    if (page === currentPage) return;
    navStack.current.push(currentPage);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (navStack.current.length > 0) {
      const prev = navStack.current.pop() as string;
      setCurrentPage(prev);
    } else {
      setCurrentPage(getLandingPage(userRole));
    }
  };

  const handleOpenCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentPage('course-detail');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUserRole(user.role);
    navStack.current = [];
    setCurrentPage(getLandingPage(user.role));
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    navStack.current = [];
    setCurrentPage('login');
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    deleteUser(currentUser.userId);
    setCurrentUser(null);
    setUserRole('student');
    navStack.current = [];
    setCurrentPage('register');
  };
  
  const renderPage = () => {
    const pageProps = { onNavigate: handleNavigate };
    
    switch (currentPage) {
      case 'login':
        return <Login {...pageProps} onLoginSuccess={handleLoginSuccess} />;
      case 'register':
        return <Register {...pageProps} onRegisterSuccess={handleLoginSuccess} />;
      case 'student-dashboard':
        return <StudentDashboard {...pageProps} currentUser={currentUser} onSelectCourse={handleOpenCourse} />;
      case 'teacher-dashboard':
        return <TeacherDashboard {...pageProps} currentUser={currentUser} onSelectCourse={handleOpenCourse} />;
      case 'text-to-ppt':
        return <TextToPPT {...pageProps} />;
      case 'ppt-to-video':
        return <PPTToVideo {...pageProps} />;
      case 'course-list':
        return <CourseList {...pageProps} currentUser={currentUser} onSelectCourse={handleOpenCourse} />;
      case 'course-detail':
        return (
          <CourseDetail
            {...pageProps}
            currentUser={currentUser}
            courseId={selectedCourseId}
            onSelectCourse={handleOpenCourse}
          />
        );
      case 'video-player':
        return <VideoPlayer {...pageProps} />;
      case 'ai-chat':
        return <AIChat {...pageProps} />;
      case 'test-center':
        return <TestCenter {...pageProps} currentUser={currentUser} />;
      case 'report-center':
        return <ReportCenter {...pageProps} currentUser={currentUser} />;
      case 'exam-attempt':
        return <ExamAttempt {...pageProps} />;
      case 'exam-result':
        return <ExamResult {...pageProps} />;
      case 'report-upload':
        return <ReportUpload {...pageProps} />;
      case 'report-review':
        return <ReportReview {...pageProps} currentUser={currentUser} />;
      case 'learning-analytics':
        return <LearningAnalytics {...pageProps} currentUser={currentUser} />;
      case 'study-hub':
        return <StudyHub />;
      case 'rest-room':
        return <RestRoom {...pageProps} />;
      case 'profile':
        return <Profile {...pageProps} currentUser={currentUser} onProfileUpdate={setCurrentUser} />;
      case 'settings':
        return <Settings {...pageProps} currentUser={currentUser} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />;
      case 'flow-chart':
        return <FlowChart {...pageProps} />;
      default:
        return <FlowChart {...pageProps} />;
    }
  };
  
  const pageContent = renderPage();
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        userRole={userRole}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="page-shell overflow-hidden">
        <div key={currentPage} className="page-transition">
          {pageContent}
        </div>
      </main>
      
      {/* Quick Access Floating Button */}
      {!['login', 'register', 'flow-chart'].includes(currentPage) && (
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-3 z-40">
          <button
            className="w-14 h-14 bg-white text-[#4C6EF5] border border-[#E9ECEF] rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:-translate-y-0.5 transition-all"
            onClick={handleBack}
            title="返回上一页"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="w-14 h-14 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl hover:scale-110 transition-all"
            onClick={() => handleNavigate('flow-chart')}
            title="查看系统架构"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
