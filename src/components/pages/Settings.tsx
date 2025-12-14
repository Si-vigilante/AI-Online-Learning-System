import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Toggle } from '../design-system/Toggle';
import { Input } from '../design-system/Input';
import { Settings as SettingsIcon, Bell, Lock, User, Moon, Globe, Trash2 } from 'lucide-react';
import { UserProfile } from '../../services/auth';

interface SettingsProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export function Settings({ onNavigate, currentUser, onLogout, onDeleteAccount }: SettingsProps) {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    courseUpdates: true,
    aiReminders: false,
    weeklyReport: true
  });
  
  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    showProgress: true,
    showAchievements: true
  });
  
  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'zh-CN',
    aiAssistant: true
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  return (
    <>
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">系统设置</h1>
          <p className="text-lg opacity-90">个性化您的学习体验</p>
          {currentUser && (
            <p className="text-sm opacity-80 mt-3">
              当前账号：{currentUser.name}（{currentUser.userId}，{currentUser.role === 'teacher' ? '教师' : currentUser.role === 'assistant' ? 'AI 助教' : '学生'}）
            </p>
          )}
        </div>
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div>
            <Card className="p-4">
              <nav className="space-y-1">
                {[
                  { icon: <Bell className="w-5 h-5" />, label: '通知设置', active: true },
                  { icon: <Lock className="w-5 h-5" />, label: '隐私与安全', active: false },
                  { icon: <User className="w-5 h-5" />, label: '权限管理', active: false },
                  { icon: <Globe className="w-5 h-5" />, label: '语言偏好', active: false },
                  { icon: <Moon className="w-5 h-5" />, label: '外观设置', active: false }
                ].map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      item.active
                        ? 'bg-[#EDF2FF] text-[#4C6EF5]'
                        : 'text-[#212529] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              {onLogout && (
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-[#FFF5F5] rounded-lg border border-[#FFC9C9]">
                    <p className="text-sm text-[#212529] mb-2">安全退出</p>
                    <Button variant="secondary" fullWidth onClick={onLogout}>
                      退出当前账号
                    </Button>
                  </div>
                  {onDeleteAccount && (
                    <div className="p-4 bg-[#FFF0F0] rounded-lg border border-[#FFC9C9]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[#C92A2A] font-medium">注销账号</p>
                        <Trash2 className="w-4 h-4 text-[#C92A2A]" />
                      </div>
                      <p className="text-xs text-[#C92A2A] mb-3">注销后将清除该账号的本地数据，操作不可撤销</p>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        确认注销
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
          
          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#EDF2FF] rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#4C6EF5]" />
                </div>
                <div>
                  <h4>通知设置</h4>
                  <p className="text-sm text-[#ADB5BD]">管理您的通知偏好</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">邮件通知</h5>
                    <p className="text-sm text-[#ADB5BD]">接收课程更新和重要消息</p>
                  </div>
                  <Toggle
                    checked={notifications.email}
                    onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">推送通知</h5>
                    <p className="text-sm text-[#ADB5BD]">浏览器推送提醒</p>
                  </div>
                  <Toggle
                    checked={notifications.push}
                    onChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">课程更新</h5>
                    <p className="text-sm text-[#ADB5BD]">新课程和章节发布提醒</p>
                  </div>
                  <Toggle
                    checked={notifications.courseUpdates}
                    onChange={(checked) => setNotifications({ ...notifications, courseUpdates: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">AI 学习提醒</h5>
                    <p className="text-sm text-[#ADB5BD]">智能学习计划提醒</p>
                  </div>
                  <Toggle
                    checked={notifications.aiReminders}
                    onChange={(checked) => setNotifications({ ...notifications, aiReminders: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">周报推送</h5>
                    <p className="text-sm text-[#ADB5BD]">每周学习总结报告</p>
                  </div>
                  <Toggle
                    checked={notifications.weeklyReport}
                    onChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                  />
                </div>
              </div>
            </Card>
            
            {/* Privacy & Security */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#F3F0FF] rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#845EF7]" />
                </div>
                <div>
                  <h4>隐私与安全</h4>
                  <p className="text-sm text-[#ADB5BD]">保护您的个人信息</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">公开个人资料</h5>
                    <p className="text-sm text-[#ADB5BD]">允许其他用户查看您的资料</p>
                  </div>
                  <Toggle
                    checked={privacy.profilePublic}
                    onChange={(checked) => setPrivacy({ ...privacy, profilePublic: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">显示学习进度</h5>
                    <p className="text-sm text-[#ADB5BD]">在个人主页显示学习进度</p>
                  </div>
                  <Toggle
                    checked={privacy.showProgress}
                    onChange={(checked) => setPrivacy({ ...privacy, showProgress: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg">
                  <div>
                    <h5 className="mb-1">显示成就徽章</h5>
                    <p className="text-sm text-[#ADB5BD]">展示您获得的成就</p>
                  </div>
                  <Toggle
                    checked={privacy.showAchievements}
                    onChange={(checked) => setPrivacy({ ...privacy, showAchievements: checked })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h5>修改密码</h5>
                <Input
                  label="当前密码"
                  type="password"
                  placeholder="请输入当前密码"
                />
                <Input
                  label="新密码"
                  type="password"
                  placeholder="请输入新密码"
                />
                <Input
                  label="确认新密码"
                  type="password"
                  placeholder="请再次输入新密码"
                />
                <Button variant="primary">
                  更新密码
                </Button>
              </div>
            </Card>
            
            {/* Permissions */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#E7F5FF] rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-[#51CF66]" />
                </div>
                <div>
                  <h4>权限管理</h4>
                  <p className="text-sm text-[#ADB5BD]">控制应用权限</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5>AI 助教权限</h5>
                    <Toggle
                      checked={preferences.aiAssistant}
                      onChange={(checked) => setPreferences({ ...preferences, aiAssistant: checked })}
                    />
                  </div>
                  <p className="text-sm text-[#ADB5BD]">
                    允许 AI 助教访问您的学习数据以提供个性化建议
                  </p>
                </div>
                
                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5>数据分析</h5>
                    <span className="text-xs bg-[#51CF66] text-white px-3 py-1 rounded-full">
                      已启用
                    </span>
                  </div>
                  <p className="text-sm text-[#ADB5BD]">
                    用于生成学习画像和个性化推荐
                  </p>
                </div>
                
                <div className="p-4 bg-[#FFF4E6] rounded-lg border border-[#FFD43B]/20">
                  <p className="text-sm text-[#212529]">
                    <strong>隐私承诺：</strong>我们重视您的隐私，所有数据仅用于改善学习体验，不会与第三方分享。
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Save Button */}
            <div className="flex gap-4">
              <Button variant="primary" size="lg">
                保存所有更改
              </Button>
              <Button variant="ghost" size="lg">
                重置为默认
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showDeleteConfirm && onDeleteAccount && (
      <DeleteConfirmModal
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteAccount();
        }}
      />
    )}
    </>
  );
}

/* Confirm delete modal */
function DeleteConfirmModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF0F0] flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[#C92A2A]" />
          </div>
          <div>
            <h4 className="mb-1 text-[#C92A2A]">确认注销账号？</h4>
            <p className="text-sm text-[#ADB5BD]">此操作会清除本地存储中的账号数据，无法恢复。</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button onClick={onConfirm}>确认注销</Button>
        </div>
      </div>
    </div>
  );
}
