import React, { useEffect, useState } from 'react';
import { Input } from '../design-system/Input';
import { Button } from '../design-system/Button';
import { Dropdown } from '../design-system/Dropdown';
import { ArrowLeft } from 'lucide-react';
import { UserProfile, UserRole, registerUser } from '../../services/auth';
import { Toggle } from '../design-system/Toggle';

interface RegisterProps {
  onNavigate: (page: string) => void;
  onRegisterSuccess: (user: UserProfile) => void;
}

export function Register({ onNavigate, onRegisterSuccess }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    role: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    faceBound: true
  });
  const [error, setError] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    major: '',
    grade: '',
    interests: [] as string[]
  });
  const baseInterestOptions = [
    '人工智能', '数据分析', '软件工程', '产品设计', '算法与竞赛',
    '前端开发', '后端开发', '大模型应用', '跨学科创新', '科研实践',
    '写作', '语言学习', '学习方法', '职业发展'
  ];
  const [interestOptions, setInterestOptions] = useState<string[]>(baseInterestOptions);

  const keywordTagMap: { keywords: string[]; tags: string[] }[] = [
    {
      keywords: ['计算机', '软件', 'cs', 'ai', '人工智能', '算法', '大数据'],
      tags: ['人工智能', '数据分析', '软件工程', '算法与竞赛', '大模型应用', '后端开发']
    },
    {
      keywords: ['前端', 'web', '可视化'],
      tags: ['前端开发', '交互设计', '产品设计']
    },
    {
      keywords: ['设计', '艺术', '媒体', '视觉'],
      tags: ['产品设计', '交互设计', '数字媒体', '创意表达']
    },
    {
      keywords: ['金融', '经管', '经济', '会计', '财务'],
      tags: ['数据分析', '金融科技', '商业分析', '职业发展']
    },
    {
      keywords: ['医学', '医', '护理'],
      tags: ['科研实践', '数据分析', '行业应用', '健康科技']
    },
    {
      keywords: ['教育', '师范'],
      tags: ['教育技术', '学习科学', '写作', '课堂设计']
    }
  ];

  const buildInterestOptions = (major: string, selected: string[]) => {
    const normalized = major.toLowerCase();
    const matched: string[] = [];
    keywordTagMap.forEach(({ keywords, tags }) => {
      if (keywords.some((k) => normalized.includes(k.toLowerCase()))) {
        matched.push(...tags);
      }
    });
    const merged = Array.from(
      new Set<string>([
        ...selected,
        ...matched,
        ...baseInterestOptions,
      ])
    );
    return merged.slice(0, 18);
  };

  useEffect(() => {
    if (!showStudentModal) return;
    setInterestOptions(buildInterestOptions(studentInfo.major, studentInfo.interests));
  }, [studentInfo.major, studentInfo.interests, showStudentModal]);
  
  const roleOptions = [
    { value: 'student', label: '学生' },
    { value: 'teacher', label: '教师' },
    { value: 'assistant', label: 'AI 助教' }
  ];
  
  const handleRegister = () => {
    if (!formData.name || !formData.userId || !formData.role) {
      setError('请完整填写姓名、学号/工号与身份');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (formData.role === 'student') {
      if (!studentInfo.major || !studentInfo.grade) {
        setError('请填写学生基础资料：专业与年级');
        setShowStudentModal(true);
        return;
      }
    }

    try {
      const user = registerUser({
        name: formData.name.trim(),
        userId: formData.userId.trim(),
        role: formData.role as UserRole,
        password: formData.password,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        faceBound: formData.faceBound,
        major: studentInfo.major || undefined,
        grade: studentInfo.grade || undefined,
        interests: studentInfo.interests.length ? studentInfo.interests : undefined
      });
      setError('');
      onRegisterSuccess(user);
      onNavigate(user.role === 'teacher' ? 'teacher-dashboard' : user.role === 'assistant' ? 'ai-chat' : 'student-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E9ECEF] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button 
            className="flex items-center gap-2 text-[#ADB5BD] hover:text-[#4C6EF5] mb-6 transition-colors"
            onClick={() => onNavigate('login')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回登录</span>
          </button>
          
          <div className="mb-8">
            <h2 className="mb-2">创建您的账号</h2>
            <p className="text-[#ADB5BD]">加入 AI 驱动的学习平台，开启智能学习之旅</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Input
              label="姓名"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            
            <Input
              label="学号 / 工号"
              placeholder="请输入学号或工号"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            />
          </div>
          
          <div className="mb-6">
            <Dropdown
              label="身份选择"
              options={roleOptions}
              value={formData.role}
              onChange={(value) => {
                setFormData({ ...formData, role: value });
                if (value === 'student') setShowStudentModal(true);
              }}
              placeholder="请选择您的身份"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Input
              label="密码"
              type="password"
              placeholder="请设置密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="至少 8 个字符"
            />
            
            <Input
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <Input
              label="邮箱（可选）"
              type="email"
              placeholder="用于接收通知"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            
            <Input
              label="手机号（可选）"
              placeholder="便于找回账号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="mb-6 p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] flex items-center justify-between">
            <div>
              <p className="text-sm text-[#212529] font-medium">人脸识别辅助验证</p>
              <p className="text-xs text-[#ADB5BD] mt-1">绑定后可在登录页使用人脸识别快捷登录</p>
            </div>
            <Toggle
              checked={formData.faceBound}
              onChange={(checked) => setFormData({ ...formData, faceBound: checked })}
              label={formData.faceBound ? '已开启' : '未开启'}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FFF5F5] text-[#E03131] text-sm border border-[#FFC9C9]">
              {error}
            </div>
          )}
          
          <div className="mb-6 p-4 bg-[#EDF2FF] rounded-lg border border-[#4C6EF5]/20">
            <p className="text-sm text-[#212529]">
              <strong>注册即表示您同意：</strong>
            </p>
            <ul className="mt-2 text-sm text-[#ADB5BD] space-y-1 ml-4">
              <li>• 遵守平台使用条款和隐私政策</li>
              <li>• 提供真实准确的个人信息</li>
              <li>• 合理使用 AI 辅助学习功能</li>
            </ul>
          </div>
          
          <Button fullWidth size="lg" onClick={handleRegister}>
            创建账号
          </Button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-[#ADB5BD]">
            已经有账号？
            <button 
              className="text-[#4C6EF5] hover:text-[#3B5BDB] ml-1"
              onClick={() => onNavigate('login')}
            >
              立即登录 →
            </button>
          </p>
        </div>
      </div>

      {/* 学生基础资料弹窗 */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="mb-1">填写学生基础资料</h4>
                <p className="text-sm text-[#ADB5BD]">用于个性化学习推荐，后续可在个人中心修改</p>
              </div>
              <button
                className="text-sm text-[#4C6EF5] hover:text-[#3B5BDB]"
                onClick={() => setShowStudentModal(false)}
              >
                暂不填写
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="专业"
                placeholder="如：计算机科学与技术"
                value={studentInfo.major}
                onChange={(e) => setStudentInfo({ ...studentInfo, major: e.target.value })}
              />
              <Input
                label="年级"
                placeholder="如：大三 / 研一 / 2022级"
                value={studentInfo.grade}
                onChange={(e) => setStudentInfo({ ...studentInfo, grade: e.target.value })}
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-[#212529]">想学习的方向 / 想收获的内容</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((tag) => {
                  const active = studentInfo.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        active
                          ? 'bg-[#EDF2FF] text-[#4C6EF5] border-[#4C6EF5]'
                          : 'border-[#E9ECEF] text-[#212529] hover:border-[#4C6EF5]'
                      }`}
                      onClick={() => {
                        const next = active
                          ? studentInfo.interests.filter((t) => t !== tag)
                          : [...studentInfo.interests, tag];
                        setStudentInfo({ ...studentInfo, interests: next });
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowStudentModal(false)}>取消</Button>
              <Button onClick={() => setShowStudentModal(false)}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
