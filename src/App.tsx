import React, { useEffect, useState } from 'react';
import { Navigation } from './components/Navigation';
import { UserProfile, UserRole, clearSession, deleteUser, getCurrentUser, ensureTestStudent } from './services/auth';

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
import { LearningAnalytics } from './components/pages/LearningAnalytics';
import { Profile } from './components/pages/Profile';
import { Settings } from './components/pages/Settings';
import { FlowChart } from './components/pages/FlowChart';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const getLandingPage = (role: UserRole) => {
    if (role === 'teacher') return 'teacher-dashboard';
    if (role === 'assistant') return 'ai-chat';
    return 'student-dashboard';
  };

  useEffect(() => {
    ensureTestStudent();
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
      setUserRole(sessionUser.role);
      setCurrentPage(getLandingPage(sessionUser.role));
    } else {
      setCurrentPage('login');
    }
  }, []);
  
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setCurrentPage(getLandingPage(user.role));
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    deleteUser(currentUser.userId);
    setCurrentUser(null);
    setUserRole('student');
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
        return <StudentDashboard {...pageProps} currentUser={currentUser} />;
      case 'teacher-dashboard':
        return <TeacherDashboard {...pageProps} currentUser={currentUser} />;
      case 'text-to-ppt':
        return <TextToPPT {...pageProps} />;
      case 'ppt-to-video':
        return <PPTToVideo {...pageProps} />;
      case 'course-list':
        return <CourseList {...pageProps} />;
      case 'course-detail':
        return <CourseDetail {...pageProps} />;
      case 'video-player':
        return <VideoPlayer {...pageProps} />;
      case 'ai-chat':
        return <AIChat {...pageProps} />;
      case 'test-center':
        return <TestCenter {...pageProps} />;
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
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        userRole={userRole}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main>
        {renderPage()}
      </main>
      
      {/* Quick Access Floating Button */}
      {!['login', 'register', 'flow-chart'].includes(currentPage) && (
        <button
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl hover:scale-110 transition-all z-40"
          onClick={() => handleNavigate('flow-chart')}
          title="查看系统架构"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
