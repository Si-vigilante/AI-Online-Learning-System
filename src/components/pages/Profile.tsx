import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { User, Mail, Phone, Calendar, Award, BookOpen, Edit2, Camera } from 'lucide-react';
import { UserProfile, rolePermissions, updateUserProfile } from '../../services/auth';
import { Toggle } from '../design-system/Toggle';

interface ProfileProps {
  onNavigate: (page: string) => void;
  currentUser: UserProfile | null;
  onProfileUpdate: (user: UserProfile) => void;
}

export function Profile({ onNavigate, currentUser, onProfileUpdate }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(currentUser);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [interests, setInterests] = useState<string[]>(currentUser?.interests || ['深度学习', 'Python', '数据科学']);
  const [enrollDate] = useState('2021-09-01');
  const [major, setMajor] = useState(currentUser?.major || '计算机科学与技术');
  const [grade, setGrade] = useState(currentUser?.grade || '');
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    faceBound: Boolean(currentUser?.faceBound)
  });
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setProfile(currentUser);
  }, [currentUser]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Card className="p-8 text-center max-w-lg w-full">
          <h3 className="mb-2">请先登录</h3>
          <p className="text-[#ADB5BD] mb-6">登录后可查看个人中心、身份与权限信息</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => onNavigate('login')}>去登录</Button>
            <Button variant="secondary" onClick={() => onNavigate('register')}>注册</Button>
          </div>
        </Card>
      </div>
    );
  }

  const stats = profile.stats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHours: 0,
    certificates: 0
  };

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name,
      email: profile.email || '',
      phone: profile.phone || '',
      faceBound: Boolean(profile.faceBound)
    });
    setInterests(profile.interests || []);
    setMajor(profile.major || '');
    setGrade(profile.grade || '');
  }, [profile]);
  
  const achievements = [
    {
      id: 1,
      title: '学习新星',
      description: '连续学习 30 天',
      icon: '🌟',
      date: '2024-11-15',
      earned: true
    },
    {
      id: 2,
      title: 'AI 达人',
      description: '完成所有 AI 课程',
      icon: '🤖',
      date: '2024-12-01',
      earned: true
    },
    {
      id: 3,
      title: '测验高手',
      description: '5 次测验满分',
      icon: '🏆',
      date: null,
      earned: false
    },
    {
      id: 4,
      title: '知识分享者',
      description: '回答 50 个问题',
      icon: '📚',
      date: null,
      earned: false
    }
  ];
  
  const recentActivity = [
    { id: 1, type: 'course', title: '完成"深度学习基础"第三章', time: '2小时前' },
    { id: 2, type: 'quiz', title: '神经网络测验 - 得分 85', time: '1天前' },
    { id: 3, type: 'report', title: '提交期中报告', time: '2天前' }
  ];

  const handleSave = () => {
    try {
      const updated = updateUserProfile(profile.userId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        faceBound: form.faceBound,
        major: major.trim() || undefined,
        grade: grade.trim() || undefined,
        interests: interests,
        avatar: avatarPreview || profile.avatar
      });
      setProfile(updated);
      onProfileUpdate(updated);
      setMessage('已保存个人信息');
      setError('');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请稍后重试');
      setMessage('');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-6 text-center">
              <div className="relative inline-block mb-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-full flex items-center justify-center text-white text-3xl mx-auto">
                    {profile.name[0]}
                  </div>
                )}
                <button
                  className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#F8F9FA] transition-colors border border-[#E9ECEF]"
                  onClick={handleAvatarClick}
                  disabled={!isEditing}
                  title={isEditing ? '上传头像' : '点击编辑后更换头像'}
                >
                  <Camera className="w-4 h-4 text-[#4C6EF5]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              
              <h3 className="mb-1">{profile.name}</h3>
              <p className="text-sm text-[#ADB5BD] mb-4">账号：{profile.userId}</p>
              
              <div className="flex justify-center gap-2 mb-6">
                <span className="px-3 py-1 bg-[#EDF2FF] text-[#4C6EF5] text-xs rounded-full">
                  {profile.role === 'teacher' ? '教师' : profile.role === 'assistant' ? 'AI 助教' : '学生'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${form.faceBound ? 'bg-[#E6FCF5] text-[#0CA678]' : 'bg-[#FFF5F5] text-[#E03131]'}`}>
                  {form.faceBound ? '已绑定人脸' : '未绑定人脸'}
                </span>
              </div>
              
              {message && (
                <p className="text-xs text-[#0CA678] mb-3">{message}</p>
              )}
              {error && (
                <p className="text-xs text-[#E03131] mb-3">{error}</p>
              )}

              <Button 
                variant={isEditing ? 'primary' : 'secondary'} 
                fullWidth
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? '保存修改' : '编辑资料'}
              </Button>
            </Card>
            
            {/* Stats */}
            <Card className="p-6">
              <h5 className="mb-4">学习统计</h5>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#ADB5BD]">已报名课程</span>
                  <span className="text-lg">{stats.coursesEnrolled}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#ADB5BD]">已完成课程</span>
                  <span className="text-lg">{stats.coursesCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#ADB5BD]">学习时长</span>
                  <span className="text-lg">{stats.totalHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#ADB5BD]">获得证书</span>
                  <span className="text-lg">{stats.certificates}</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="mb-1">个人信息</h4>
                  <p className="text-sm text-[#ADB5BD]">绑定学号/工号与人脸识别，确保身份可信</p>
                </div>
                <Toggle
                  checked={form.faceBound}
                  onChange={(checked) => setForm({ ...form, faceBound: checked })}
                  label={form.faceBound ? '已开启人脸辅助' : '未开启'}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="姓名"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!isEditing}
                />
                
                <Input
                  label="学号 / 工号"
                  value={profile.userId}
                  disabled
                />
                
                <Input
                  label="邮箱"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!isEditing}
                />
                
                <Input
                  label="手机号"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!isEditing}
                />
                
                <Input
                  label="入学日期"
                  type="date"
                  value={enrollDate}
                  disabled
                />
                
                <Input
                  label="专业"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  disabled={!isEditing}
                />

                <Input
                  label="年级"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="mt-6">
                <label className="block mb-2 text-sm text-[#212529]">
                  兴趣领域
                </label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-[#EDF2FF] text-[#4C6EF5] rounded-full text-sm"
                    >
                      {interest}
                      {isEditing && (
                        <button
                          className="ml-2 text-[#4C6EF5] hover:text-[#3B5BDB]"
                          onClick={() => setInterests(interests.filter((_, i) => i !== index))}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <button
                      className="px-4 py-2 border-2 border-dashed border-[#E9ECEF] rounded-full text-sm text-[#ADB5BD] hover:border-[#4C6EF5] hover:text-[#4C6EF5] transition-colors"
                      onClick={() => {
                        const value = prompt('添加新的兴趣领域');
                        if (value) {
                          setInterests([...interests, value]);
                        }
                      }}
                    >
                      + 添加
                    </button>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Role permissions */}
            <Card className="p-6">
              <h4 className="mb-4">角色权限</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rolePermissions[profile.role].map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] rounded-lg text-sm text-[#212529]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#EDF2FF] text-[#4C6EF5] flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    {permission}
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Achievements */}
            <Card className="p-6">
              <h4 className="mb-6">成就徽章</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl text-center transition-all ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-[#FFD43B]/20 to-[#FFA94D]/20 border-2 border-[#FFD43B]/50'
                        : 'bg-[#F8F9FA] opacity-50'
                    }`}
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <h5 className="text-sm mb-1">{achievement.title}</h5>
                    <p className="text-xs text-[#ADB5BD]">{achievement.description}</p>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs text-[#FFD43B] mt-2">{achievement.date}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Recent Activity */}
            <Card className="p-6">
              <h4 className="mb-6">最近活动</h4>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-[#F8F9FA] rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'course' ? 'bg-[#EDF2FF]' :
                      activity.type === 'quiz' ? 'bg-[#E7F5FF]' :
                      'bg-[#F3F0FF]'
                    }`}>
                      {activity.type === 'course' && <BookOpen className="w-5 h-5 text-[#4C6EF5]" />}
                      {activity.type === 'quiz' && <Award className="w-5 h-5 text-[#51CF66]" />}
                      {activity.type === 'report' && <Edit2 className="w-5 h-5 text-[#845EF7]" />}
                    </div>
                    <div className="flex-1">
                      <h5 className="mb-1">{activity.title}</h5>
                      <p className="text-xs text-[#ADB5BD]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
