import React, { useState } from 'react';
import { Input } from '../design-system/Input';
import { Button } from '../design-system/Button';
import { Scan, ArrowRight } from 'lucide-react';
import { UserProfile, loginWithFace, loginWithPassword } from '../../services/auth';

interface LoginProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export function Login({ onNavigate, onLoginSuccess }: LoginProps) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState('');
  const [faceMessage, setFaceMessage] = useState('');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [pulseKey, setPulseKey] = useState(0);
  const [manualSlideTick, setManualSlideTick] = useState(0);
  const [dragState, setDragState] = useState({ dragging: false, startX: 0, deltaX: 0 });
  
  const slides = [
    {
      title: '知域 · AI 智能教学系统',
      subtitle: 'Next-generation AI learning platform for lifelong learners',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: 'AI 让学习更聪明，而不是更辛苦',
      subtitle: 'AI makes learning smarter, not harder',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: '未来课堂，从现在开始',
      subtitle: 'The future classroom starts now',
      gradient: 'from-cyan-500 to-blue-600'
    }
  ];
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (delta: number) => {
    setCurrentSlide((prev) => {
      const next = (prev + delta + slides.length) % slides.length;
      return next;
    });
    setManualSlideTick((tick) => tick + 1);
  };

  const handleDragStart = (clientX: number) => {
    setDragState({ dragging: true, startX: clientX, deltaX: 0 });
  };

  const handleDragMove = (clientX: number) => {
    if (!dragState.dragging) return;
    setDragState((prev) => ({ ...prev, deltaX: clientX - prev.startX }));
  };

  const handleDragEnd = () => {
    if (!dragState.dragging) return;
    const { deltaX } = dragState;
    if (deltaX > 60) {
      goToSlide(-1);
    } else if (deltaX < -60) {
      goToSlide(1);
    }
    setDragState({ dragging: false, startX: 0, deltaX: 0 });
  };
  
  const handleLogin = () => {
    if (!studentId || !password) {
      setError('请输入学号/工号和密码');
      return;
    }
    try {
      const user = loginWithPassword(studentId.trim(), password);
      setError('');
      setFaceMessage('');
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    }
  };

  const handleFaceLogin = () => {
    if (!studentId) {
      setError('请输入学号/工号以进行人脸验证');
      return;
    }
    try {
      const user = loginWithFace(studentId.trim());
      setError('');
      setFaceMessage('人脸验证通过，已为您快捷登录');
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '人脸识别登录失败');
      setFaceMessage('');
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="mb-3 text-4xl md:text-5xl font-bold text-[#212529] leading-tight">
              知域 · AI 智能教学系统
            </h1>
            <p className="text-[#ADB5BD] text-base">Log in to the AI-powered learning platform</p>
          </div>
          
          <div className="space-y-4 mb-6">
            <Input
              label="学号 / 工号"
              placeholder="请输入您的学号或工号"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              error={error && !studentId ? error : undefined}
            />
            
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && studentId ? error : undefined}
            />
            
            <div className="flex justify-end">
              <button className="text-sm text-[#4C6EF5] hover:text-[#3B5BDB]">
                忘记密码？
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FFF5F5] text-[#E03131] text-sm border border-[#FFC9C9]">
              {error}
            </div>
          )}
          {faceMessage && (
            <div className="mb-4 p-3 rounded-lg bg-[#E6FCF5] text-[#0CA678] text-sm border border-[#C3FAE8]">
              {faceMessage}
            </div>
          )}
          
          <Button fullWidth size="lg" onClick={handleLogin}>
            登录
          </Button>
          
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E9ECEF]" />
            <span className="text-sm text-[#ADB5BD]">或使用以下方式登录</span>
            <div className="flex-1 h-px bg-[#E9ECEF]" />
          </div>
          
          <button
            type="button"
            className="w-full bg-[#F8F9FA] rounded-xl p-6 flex items-center justify-between hover:bg-[#E9ECEF] transition-colors text-left"
            onClick={handleFaceLogin}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Scan className="w-6 h-6 text-[#4C6EF5]" />
              </div>
              <div>
                <p className="text-sm">人脸识别登录</p>
                <p className="text-xs text-[#ADB5BD]">需先在个人中心绑定</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#ADB5BD]" />
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-[#ADB5BD]">
              还没有账号？
              <button 
                className="text-[#4C6EF5] hover:text-[#3B5BDB] ml-1"
                onClick={() => onNavigate('register')}
              >
                注册一个 →
              </button>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Visual */}
      <div
        className="flex-1 relative bg-gradient-to-br from-[#4C6EF5] via-[#6A5AE0] to-[#845EF7] p-12 flex items-center justify-center overflow-hidden"
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
          const percentX = ((e.clientX - rect.left) / rect.width) * 100;
          const percentY = ((e.clientY - rect.top) / rect.height) * 100;
          setParallax({ x, y });
          setPointer({ x: percentX, y: percentY });
          handleDragMove(e.clientX);
        }}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => {
          setParallax({ x: 0, y: 0 });
          handleDragEnd();
        }}
        onClick={() => setPulseKey((v) => v + 1)}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > 12 || Math.abs(e.deltaX) > 12) {
            goToSlide(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
          }
        }}
        tabIndex={0}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = ((touch.clientX - rect.left) / rect.width - 0.5) * 12;
          const y = ((touch.clientY - rect.top) / rect.height - 0.5) * 12;
          const percentX = ((touch.clientX - rect.left) / rect.width) * 100;
          const percentY = ((touch.clientY - rect.top) / rect.height) * 100;
          setParallax({ x, y });
          setPointer({ x: percentX, y: percentY });
          handleDragMove(touch.clientX);
        }}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ animation: 'pulse 10s ease-in-out infinite' }}
        >
          <div className="absolute top-10 left-16 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-16 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1), transparent 45%),
                radial-gradient(140px circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.25), transparent 55%)
              `,
              transform: `translate(${parallax.x}px, ${parallax.y}px)`,
              transition: 'transform 150ms ease-out'
            }}
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="ripple-ring ripple-ring--outer"
            style={{ transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.6}px)` }}
          />
          <div
            className="ripple-ring ripple-ring--middle"
            style={{ transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.8}px)` }}
          />
          <div
            className="ripple-ring ripple-ring--inner"
            style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
          />
          <div
            className="orbit-dot"
            style={{ transform: `translate(${parallax.x * 1.4}px, ${parallax.y * 1.4}px)` }}
          />
          {[...Array(6)].map((_, i) => (
            <div
              key={`${pulseKey}-${i}`}
              className="sparkle"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 3) * 18}%`,
                animationDelay: `${i * 0.6}s`,
                transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 text-white text-center max-w-lg">
          <div className="transition-all duration-500">
            <h2 className="mb-4 text-white">{slides[currentSlide].title}</h2>
            <p className="text-lg opacity-90">{slides[currentSlide].subtitle}</p>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
                onClick={() => goToSlide(index - currentSlide)}
                aria-label={`slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Abstract Illustration */}
          <div className="mt-16 relative h-64 flex items-center justify-center">
            <div
              className="w-16 h-16 bg-white/40 rounded-full blur-lg"
              style={{ animation: 'pulse 3s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
