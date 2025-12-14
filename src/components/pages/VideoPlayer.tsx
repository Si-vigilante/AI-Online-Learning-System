import React, { useEffect, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Tabs } from '../design-system/Tabs';
import { Play, Pause, Volume2, Settings, Maximize, BookOpen, MessageSquare, Lightbulb, ChevronRight, Languages, Sparkles, Cloud, Save, RefreshCw, User, Mic, PlayCircle } from 'lucide-react';
import { QuestionCard } from '../design-system/QuestionCard';

interface VideoPlayerProps {
  onNavigate: (page: string) => void;
}

const duration = 25 * 60 + 40; // 25:40
const subtitleLines = {
  zh: '神经网络通过多层非线性变换来近似复杂函数，本节课讲解了核心直觉。',
  en: 'Neural networks approximate complex functions via stacked nonlinear layers; this lesson explains the intuition.',
  es: 'Las redes neuronales aproximan funciones complejas con capas no lineales apiladas; la clase explica la intuición.'
};

const knowledgePoints = [
  { id: 1, time: 45, title: '深度学习简介', description: '什么是深度学习及其发展历程' },
  { id: 2, time: 200, title: '应用场景', description: '计算机视觉、NLP、语音识别' },
  { id: 3, time: 370, title: '神经网络基础', description: '感知机模型与多层网络' }
];

const initialNotes = [
  { id: 1, time: 135, content: '深度学习的定义：机器学习的一个分支' },
  { id: 2, time: 342, content: '神经网络的三个核心组成部分' }
];

const storageKey = 'immersive-course-player-state';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export function VideoPlayer({ onNavigate }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [showPopupQuiz, setShowPopupQuiz] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subtitleLang, setSubtitleLang] = useState<'zh' | 'en' | 'es'>('zh');
  const [aiTranslate, setAiTranslate] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [syncStatus, setSyncStatus] = useState('等待同步...');
  const [activeKnowledge, setActiveKnowledge] = useState<number | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [noteDraft, setNoteDraft] = useState('');
  const [aiNoteSummary, setAiNoteSummary] = useState('');
  const [avatarPersona, setAvatarPersona] = useState<'导师' | '助教'>('导师');
  const [avatarVoice, setAvatarVoice] = useState<'温和' | '正式' | '活泼'>('温和');
  const [avatarScript, setAvatarScript] = useState('我是数字人讲师，将为你概述本节重点：1）深度学习定义；2）常见应用；3）本节测验建议。');
  const [avatarPlaying, setAvatarPlaying] = useState(false);

  const tabs = [
    { key: 'notes', label: '笔记', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'discussion', label: '讨论', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'keypoints', label: '知识点', icon: <Lightbulb className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentTime(parsed.currentTime ?? 0);
        setPlaybackRate(parsed.playbackRate ?? 1);
        setSubtitleLang(parsed.subtitleLang ?? 'zh');
        setSyncStatus(`已同步 · ${new Date(parsed.updatedAt).toLocaleTimeString()}`);
      } catch (err) {
        console.error('Failed to load player state', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const ticker = setInterval(() => {
      setCurrentTime((prev) => {
        const next = Math.min(prev + playbackRate, duration);
        if (next >= duration) setIsPlaying(false);
        return next;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [isPlaying, playbackRate]);

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      const payload = {
        currentTime,
        playbackRate,
        subtitleLang,
        updatedAt: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSyncStatus(`已同步 · ${new Date(payload.updatedAt).toLocaleTimeString()}`);
    }, 400);
    return () => clearTimeout(syncTimer);
  }, [currentTime, playbackRate, subtitleLang]);

  useEffect(() => {
    const matched = knowledgePoints.find((kp) => Math.abs(kp.time - currentTime) < 1);
    if (matched) setActiveKnowledge(matched.id);
  }, [currentTime]);

  const handleSeek = (value: number) => {
    setCurrentTime(value);
  };

  const handleAddNote = () => {
    if (!noteDraft.trim()) return;
    const newNote = {
      id: Date.now(),
      time: Math.round(currentTime),
      content: noteDraft.trim()
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteDraft('');
  };

  const handleAutoOrganizeNotes = () => {
    if (!notes.length) {
      setAiNoteSummary('AI 整理：暂无可整理的笔记');
      return;
    }
    const sorted = [...notes].sort((a, b) => a.time - b.time).slice(0, 4);
    const stitched = sorted.map((n, idx) => `${idx + 1}. ${formatTime(n.time)} - ${n.content}`).join(' ');
    setAiNoteSummary(`AI 整理：${stitched}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-[#212529] to-[#495057] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    size="lg"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                </div>

                {activeKnowledge && (
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 max-w-md border border-[#E9ECEF]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-[#4C6EF5]">
                        <Lightbulb className="w-4 h-4" />
                        <span>知识点 · {formatTime(knowledgePoints.find((k) => k.id === activeKnowledge)?.time || 0)}</span>
                      </div>
                      <button onClick={() => setActiveKnowledge(null)} className="text-[#ADB5BD] text-xs hover:text-[#4C6EF5]">关闭</button>
                    </div>
                    <h5 className="mb-1">{knowledgePoints.find((k) => k.id === activeKnowledge)?.title}</h5>
                    <p className="text-sm text-[#495057] mb-3">
                      {knowledgePoints.find((k) => k.id === activeKnowledge)?.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setNoteDraft((knowledgePoints.find((k) => k.id === activeKnowledge)?.title || '') + ' · ' + (knowledgePoints.find((k) => k.id === activeKnowledge)?.description || ''))}>
                        记入笔记
                      </Button>
                      <Button size="sm" onClick={() => setShowPopupQuiz(true)}>
                        随堂小测
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 space-y-3">
                  <div className="relative w-full h-3 bg-white/30 rounded-full overflow-hidden">
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute left-0 top-0 h-full bg-[#4C6EF5] rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    {knowledgePoints.map((point) => (
                      <button
                        key={point.id}
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-[#FFD43B] rounded-full border border-white/60"
                        style={{ left: `${(point.time / duration) * 100}%` }}
                        title={`跳转到 ${formatTime(point.time)}`}
                        onClick={() => handleSeek(point.time)}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <Volume2 className="w-5 h-5" />
                      <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                        <Languages className="w-4 h-4" />
                        <select
                          className="bg-transparent text-white text-xs outline-none"
                          value={subtitleLang}
                          onChange={(e) => setSubtitleLang(e.target.value as 'zh' | 'en' | 'es')}
                        >
                          <option value="zh">中</option>
                          <option value="en">EN</option>
                          <option value="es">ES</option>
                        </select>
                        <button
                          className={`text-xs px-2 py-1 rounded-full border ${aiTranslate ? 'bg-white/20 border-white/30' : 'border-white/20'}`}
                          onClick={() => setAiTranslate(!aiTranslate)}
                        >
                          AI 翻译
                        </button>
                      </div>
                      <select
                        className="bg-transparent text-sm"
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(Number(e.target.value))}
                      >
                        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                          <option key={rate} value={rate}>{rate.toFixed(2).replace(/\.00$/, '')}x</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                        <Cloud className="w-4 h-4" />
                        <span>{syncStatus}</span>
                      </div>
                      <Settings className="w-5 h-5" />
                      <Maximize className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-black/60 rounded-lg px-4 py-2 text-sm flex items-center justify-between">
                    <div className="text-white">
                      <div>{aiTranslate ? `${subtitleLines[subtitleLang]} · AI: ${subtitleLines.en}` : subtitleLines[subtitleLang]}</div>
                      <div className="text-xs text-[#C1C2C5] mt-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>多语言字幕已开启，AI 实时翻译</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#C1C2C5]">
                      <Save className="w-4 h-4" />
                      <span>进度记忆：{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Popup Quiz */}
                {showPopupQuiz && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                      <h4 className="mb-4">弹题测验</h4>
                      <QuestionCard
                        type="single"
                        question="深度学习是机器学习的哪个分支？"
                        options={[
                          '监督学习',
                          '无监督学习',
                          '强化学习',
                          '以上都不是'
                        ]}
                        selectedAnswers={[]}
                        onAnswerChange={() => {}}
                      />
                      <Button fullWidth className="mt-4" onClick={() => setShowPopupQuiz(false)}>
                        提交答案
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="mb-2">第一章：深度学习简介</h3>
                <p className="text-[#ADB5BD]">讲师：张教授 · 第 1 课 / 共 20 课</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4>课堂互动</h4>
                <div className="flex items-center gap-2 text-xs text-[#4C6EF5]">
                  <RefreshCw className="w-4 h-4" />
                  <span>进度实时同步</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#ADB5BD]">知识点弹窗</span>
                    <span className="text-xs bg-[#EDF2FF] text-[#4C6EF5] px-2 py-1 rounded-full">点击查看</span>
                  </div>
                  <div className="space-y-2">
                    {knowledgePoints.map((point) => (
                      <button
                        key={point.id}
                        className={`w-full text-left p-3 rounded-lg border ${activeKnowledge === point.id ? 'border-[#4C6EF5] bg-[#F0F4FF]' : 'border-[#E9ECEF] hover:border-[#4C6EF5]'}`}
                        onClick={() => {
                          setActiveKnowledge(point.id);
                          handleSeek(point.time);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{point.title}</span>
                          <span className="text-xs text-[#ADB5BD]">{formatTime(point.time)}</span>
                        </div>
                        <p className="text-xs text-[#ADB5BD] mt-1">{point.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#ADB5BD]">随堂小测</span>
                    <Button size="sm" onClick={() => setShowPopupQuiz(true)}>点击触发</Button>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-[#EDF2FF] flex items-center justify-center text-[#4C6EF5]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">AI 出题</p>
                      <p className="text-xs text-[#ADB5BD]">根据当前知识点动态生成测验</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Course Navigation */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost">
                  上一课
                </Button>
                <span className="text-sm text-[#ADB5BD]">课程列表</span>
                <Button variant="primary" onClick={() => setShowPopupQuiz(true)}>
                  下一课
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#4C6EF5]" />
                  <h4 className="mb-0">AI 教学数字人</h4>
                </div>
                <div className="text-xs text-[#ADB5BD]">实时语音 + 肢体动作</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                  <p className="text-xs text-[#ADB5BD] mb-1">角色</p>
                  <select
                    className="w-full text-sm border rounded-lg px-2 py-2"
                    value={avatarPersona}
                    onChange={(e) => setAvatarPersona(e.target.value as '导师' | '助教')}
                  >
                    <option value="导师">导师（稳重）</option>
                    <option value="助教">助教（亲和）</option>
                  </select>
                </div>
                <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                  <p className="text-xs text-[#ADB5BD] mb-1">语音风格</p>
                  <select
                    className="w-full text-sm border rounded-lg px-2 py-2"
                    value={avatarVoice}
                    onChange={(e) => setAvatarVoice(e.target.value as '温和' | '正式' | '活泼')}
                  >
                    <option value="温和">温和</option>
                    <option value="正式">正式</option>
                    <option value="活泼">活泼</option>
                  </select>
                </div>
                <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                  <p className="text-xs text-[#ADB5BD] mb-1">动作匹配</p>
                  <span className="text-sm text-[#4C6EF5]">强调手势 · 点头 · 摇头</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-[#ADB5BD] mb-1">开场/总结脚本（自动驱动口型与动作）</p>
                <textarea
                  className="w-full border-2 border-[#E9ECEF] rounded-lg px-3 py-2 focus:border-[#4C6EF5] outline-none resize-none"
                  rows={3}
                  value={avatarScript}
                  onChange={(e) => setAvatarScript(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-[#ADB5BD]">
                  状态：{avatarPlaying ? '播报中 · 同步语音与动作' : '待机'}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAvatarScript('我是数字人讲师，将为你概述本节重点：1）深度学习定义；2）常见应用；3）本节测验建议。');
                    }}
                  >
                    生成概述
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAvatarPlaying(true);
                      setTimeout(() => setAvatarPlaying(false), 3500);
                    }}
                  >
                    <PlayCircle className="w-4 h-4" />
                    播放
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAvatarPlaying(false)}
                    disabled={!avatarPlaying}
                  >
                    <Mic className="w-4 h-4" />
                    停止
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Sidebar */}
          <div>
            <Card className="p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              
              <div className="mt-6">
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] outline-none"
                        placeholder="实时记录所思所感..."
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                      />
                      <Button variant="secondary" size="sm" onClick={handleAddNote}>
                        + 添加笔记
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#ADB5BD]">
                      <span>自动关联时间码：{formatTime(currentTime)}</span>
                      <button className="text-[#4C6EF5]" onClick={handleAutoOrganizeNotes}>
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        AI 自动整理
                      </button>
                    </div>

                    {aiNoteSummary && (
                      <div className="p-3 bg-[#F8F9FA] border border-dashed border-[#E9ECEF] rounded-lg text-sm text-[#495057]">
                        {aiNoteSummary}
                      </div>
                    )}
                    
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 bg-[#F8F9FA] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-[#4C6EF5] bg-[#EDF2FF] px-2 py-1 rounded">
                            {formatTime(note.time)}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'keypoints' && (
                  <div className="space-y-4">
                    {knowledgePoints.map((point) => (
                      <div key={point.id} className="p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors cursor-pointer" onClick={() => handleSeek(point.time)}>
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-[#FFD43B] flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#4C6EF5]">{formatTime(point.time)}</span>
                              <h5>{point.title}</h5>
                            </div>
                            <p className="text-sm text-[#ADB5BD]">{point.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'discussion' && (
                  <div className="space-y-4">
                    <textarea
                      className="w-full px-4 py-3 border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5] outline-none resize-none"
                      rows={3}
                      placeholder="发表您的看法..."
                    />
                    <Button fullWidth size="sm">发送</Button>
                    
                    <div className="space-y-3 mt-6">
                      {[
                        { id: 1, user: '学生A', time: '2小时前', content: '请问激活函数为什么这么重要？' },
                        { id: 2, user: '学生B', time: '5小时前', content: '这节课讲得很清楚，受益匪浅！' }
                      ].map((item) => (
                        <div key={item.id} className="p-4 bg-[#F8F9FA] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#4C6EF5] rounded-full flex items-center justify-center text-white text-xs">
                              {item.user[2]}
                            </div>
                            <span className="text-sm">{item.user}</span>
                            <span className="text-xs text-[#ADB5BD]">{item.time}</span>
                          </div>
                          <p className="text-sm">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="p-6 mt-6">
              <h5 className="mb-3">AI 助教</h5>
              <p className="text-sm text-[#ADB5BD] mb-4">
                对这节课有疑问？让 AI 助教帮您解答
              </p>
              <Button variant="primary" fullWidth onClick={() => onNavigate('ai-chat')}>
                <MessageSquare className="w-4 h-4" />
                开始咨询
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
