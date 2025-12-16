import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { FileText, Sparkles, Clock, Award, Plus, Play, Shield, Eye, Camera, Timer, Shuffle, BookOpenCheck, Loader2 } from 'lucide-react';
import { UserProfile } from '../../services/auth';
import { generateExamPaper, listExamPapersLocal, saveExamPaperLocal } from '../../services/exams';
import type { ExamPaper, Question } from '../../types/exam';

interface TestCenterProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function TestCenter({ onNavigate, currentUser }: TestCenterProps) {
  const resolvedRole = currentUser?.role === 'teacher' ? 'teacher' : 'student';
  const [aiConfig, setAiConfig] = useState({
    difficulty: '中等',
    questionTypes: ['单选', '多选', '判断', '简答'],
    knowledge: ['激活函数', '反向传播'],
    randomAssemble: true,
    durationMinutes: 20
  });
  const [questionPlan, setQuestionPlan] = useState({
    single: 3,
    multiple: 2,
    tf: 2,
    short: 1,
    essay: 1
  });
  const [proctorSettings, setProctorSettings] = useState({
    timer: true,
    antiCheat: true,
    camera: false
  });
  const [knowledgeInput, setKnowledgeInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPaper, setGeneratedPaper] = useState<ExamPaper | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [courseId] = useState('deep-learning');
  const [availablePapers, setAvailablePapers] = useState<ExamPaper[]>([]);

  useEffect(() => {
    setAvailablePapers(listExamPapersLocal(courseId));
  }, [courseId]);

  const addKnowledge = () => {
    const next = knowledgeInput.trim();
    if (!next) return;
    if (aiConfig.knowledge.includes(next)) {
      setKnowledgeInput('');
      return;
    }
    setAiConfig({ ...aiConfig, knowledge: [...aiConfig.knowledge, next] });
    setKnowledgeInput('');
  };

  const toggleQuestionType = (typeLabel: string) => {
    const has = aiConfig.questionTypes.includes(typeLabel);
    setAiConfig({
      ...aiConfig,
      questionTypes: has ? aiConfig.questionTypes.filter((t) => t !== typeLabel) : [...aiConfig.questionTypes, typeLabel]
    });
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const typeMap: Record<string, keyof typeof questionPlan> = {
        单选: 'single',
        多选: 'multiple',
        判断: 'tf',
        简答: 'short',
        论述: 'essay'
      };
      const planPayload: Record<string, number> = {};
      Object.entries(typeMap).forEach(([label, key]) => {
        planPayload[key] = aiConfig.questionTypes.includes(label) ? questionPlan[key] || 0 : 0;
      });
      const paper = await generateExamPaper({
        courseId,
        knowledgeScope: aiConfig.knowledge,
        difficulty: aiConfig.difficulty,
        questionPlan: planPayload,
        durationMinutes: aiConfig.durationMinutes,
        title: `${aiConfig.knowledge[0] || 'AI'} 测验`,
        createdBy: currentUser?.name || 'teacher'
      });
      setGeneratedPaper(paper);
      setShowPreview(true);
      saveExamPaperLocal(paper);
      setAvailablePapers(listExamPapersLocal(courseId));
    } catch (err: any) {
      setError(err?.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const groupedQuestions = useMemo(() => {
    if (!generatedPaper) return {};
    return generatedPaper.questions.reduce<Record<string, Question[]>>((acc, q) => {
      if (!acc[q.type]) acc[q.type] = [];
      acc[q.type].push(q);
      return acc;
    }, {});
  }, [generatedPaper]);

  const quizzes =
    availablePapers.length > 0
      ? availablePapers.map((paper) => ({
          id: paper.id,
          title: paper.title,
          questions: paper.questions.length,
          duration: paper.durationMinutes,
          attempts: 0,
          bestScore: null,
          status: 'available',
          paper
        }))
      : [
          {
            id: 1,
            title: '深度学习基础 - 第一章测验',
            questions: 15,
            duration: 20,
            attempts: 2,
            bestScore: 85,
            status: 'completed'
          }
        ];
  
  const recentAttempts = [
    {
      id: 1,
      quiz: '深度学习基础 - 第一章测验',
      score: 85,
      date: '2天前',
      duration: '18分钟'
    },
    {
      id: 2,
      quiz: 'Python 基础测验',
      score: 92,
      date: '5天前',
      duration: '15分钟'
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#51CF66] to-[#37B24D] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">AI 测验中心</h1>
          <p className="text-lg opacity-90">智能出题、自动评分、个性化反馈</p>
          <div className="flex gap-3 mt-4 text-sm opacity-80">
            当前身份：{resolvedRole === 'teacher' ? '教师端' : '学生端'}
          </div>
        </div>
      </div>
      
      <div className="container-custom py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teacher AI Generate */}
            {resolvedRole === 'teacher' && (
              <Card className="p-6 bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      <h3 className="text-white">AI 自动出题</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80 mb-1">知识点范围</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {aiConfig.knowledge.map((k) => (
                            <span key={k} className="px-3 py-1 bg-white/15 rounded-full text-xs">{k}</span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
                            placeholder="输入知识点后回车"
                            value={knowledgeInput}
                            onChange={(e) => setKnowledgeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addKnowledge();
                              }
                            }}
                          />
                          <Button variant="secondary" size="sm" onClick={addKnowledge}>添加</Button>
                        </div>
                      </div>
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80 mb-1">难度</p>
                        <select
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
                          value={aiConfig.difficulty}
                          onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })}
                        >
                          <option>简单</option>
                          <option>中等</option>
                          <option>困难</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-white/10 rounded-lg">
                      <p className="text-xs opacity-80 mb-1">题型组合（客观/主观）</p>
                      <div className="flex flex-wrap gap-2">
                        {['单选', '多选', '判断', '简答', '论述'].map((type) => (
                          <button
                            key={type}
                            className={`px-3 py-1 rounded-full text-xs border ${aiConfig.questionTypes.includes(type) ? 'bg-white text-[#4C6EF5]' : 'border-white/40'}`}
                            onClick={() => toggleQuestionType(type)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                        {[
                          { key: 'single', label: '单选' },
                          { key: 'multiple', label: '多选' },
                          { key: 'tf', label: '判断' },
                          { key: 'short', label: '简答' },
                          { key: 'essay', label: '论述' }
                        ].map((item) => (
                          <label key={item.key} className="flex flex-col bg-white/5 rounded-lg px-2 py-2 gap-1">
                            <span>{item.label}</span>
                            <input
                              type="number"
                              min={0}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1"
                              value={(questionPlan as any)[item.key]}
                              onChange={(e) =>
                                setQuestionPlan({
                                  ...questionPlan,
                                  [item.key]: Math.max(0, Math.min(20, Number(e.target.value) || 0))
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        <input
                          type="checkbox"
                          checked={aiConfig.randomAssemble}
                          onChange={(e) => setAiConfig({ ...aiConfig, randomAssemble: e.target.checked })}
                        />
                        题库随机组卷
                      </label>
                      <span className="text-white/80">自动包含客观题即时评分与主观题语义评分</span>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="secondary" size="lg" onClick={handleGenerate} disabled={generating}>
                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {generating ? '生成中...' : '生成测验'}
                      </Button>
                      <Button variant="ghost" size="lg" onClick={() => setShowPreview((v) => !v)} disabled={!generatedPaper}>
                        <BookOpenCheck className="w-5 h-5" />
                        预览题单
                      </Button>
                    </div>
                    {error && <p className="text-sm text-red-100 bg-red-500/30 px-3 py-2 rounded-lg">{error}</p>}
                  </div>
                  <div className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center ml-6">
                    <Sparkles className="w-16 h-16" />
                  </div>
                </div>
              </Card>
            )}

            {showPreview && generatedPaper && (
              <Card className="p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="mb-1">{generatedPaper.title}</h4>
                    <p className="text-sm text-[#ADB5BD]">
                      {generatedPaper.totalScore} 分 · {generatedPaper.questions.length} 题 · 时长 {generatedPaper.durationMinutes} 分钟
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => saveExamPaperLocal(generatedPaper)}>
                      保存试卷
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={generating}>
                      重新生成
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(groupedQuestions).map(([type, list]) => (
                    <div key={type}>
                      <h5 className="mb-2 capitalize">{type.toUpperCase()}</h5>
                      <div className="space-y-3">
                        {list.map((q, idx) => (
                          <div key={q.id} className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                            <div className="flex items-center justify-between mb-2 text-sm">
                              <span className="font-medium">{idx + 1}. {q.stem}</span>
                              <span className="text-[#ADB5BD]">{q.score} 分</span>
                            </div>
                            {('options' in q) && (
                              <ul className="text-sm text-[#495057] space-y-1">
                                {q.options.map((opt) => (
                                  <li key={opt.key}>{opt.key}. {opt.text}</li>
                                ))}
                              </ul>
                            )}
                            {'answer' in q && Array.isArray((q as any).answer) && (
                              <p className="text-sm text-[#37B24D] mt-2">答案：{(q as any).answer.join('，')}</p>
                            )}
                            {q.type === 'tf' && 'answer' in q && typeof (q as any).answer === 'boolean' && (
                              <p className="text-sm text-[#37B24D] mt-2">答案：{(q as any).answer ? '正确' : '错误'}</p>
                            )}
                            {'referenceAnswer' in q && (
                              <p className="text-sm text-[#37B24D] mt-2">参考答案：{(q as any).referenceAnswer}</p>
                            )}
                            <p className="text-xs text-[#ADB5BD] mt-2">知识点：{q.knowledgePoints.join('，') || '未标注'}</p>
                            {q.explanation && <p className="text-xs text-[#ADB5BD] mt-1">解析：{q.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Student anti-cheat settings */}
            {resolvedRole === 'student' && (
            <Card className="p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#37B24D]" />
                    <h4 className="mb-0">考前检查 · 防作弊</h4>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onNavigate('exam-attempt')}>开始答题</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-[#37B24D]" />
                      <span>计时</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={proctorSettings.timer} onChange={(e) => setProctorSettings({ ...proctorSettings, timer: e.target.checked })} />
                      开启倒计时
                    </label>
                  </div>
                  <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-[#37B24D]" />
                      <span>切屏警告</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={proctorSettings.antiCheat} onChange={(e) => setProctorSettings({ ...proctorSettings, antiCheat: e.target.checked })} />
                      防止切出考试页面
                    </label>
                  </div>
                  <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-[#37B24D]" />
                      <span>摄像头监考</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={proctorSettings.camera} onChange={(e) => setProctorSettings({ ...proctorSettings, camera: e.target.checked })} />
                      开启监控（需授权）
                    </label>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Available Quizzes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="mb-0">可用测验</h3>
                {resolvedRole === 'teacher' && (
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('exam-result')}>
                    智能批改复核
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4>{quiz.title}</h4>
                          {quiz.status === 'completed' && (
                            <span className="text-xs bg-[#51CF66]/20 text-[#51CF66] px-3 py-1 rounded-full">
                              已完成
                            </span>
                          )}
                          {quiz.status === 'locked' && (
                            <span className="text-xs bg-[#ADB5BD]/20 text-[#ADB5BD] px-3 py-1 rounded-full">
                              未解锁
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 mb-4 text-sm text-[#ADB5BD]">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{quiz.questions} 题</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{quiz.duration} 分钟</span>
                          </div>
                          {quiz.bestScore !== null && (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              <span>最高分：{quiz.bestScore}</span>
                            </div>
                          )}
                        </div>
                        
                        {quiz.attempts > 0 && (
                          <p className="text-sm text-[#ADB5BD] mb-4">
                            已尝试 {quiz.attempts} 次
                          </p>
                        )}
                        
                        <div className="flex gap-3">
                          {quiz.status !== 'locked' && (
                            <Button 
                              variant={quiz.status === 'completed' ? 'secondary' : 'primary'}
                              onClick={() => onNavigate('exam-attempt')}
                            >
                              <Play className="w-4 h-4" />
                              {quiz.status === 'completed' ? '再次练习' : '开始测验'}
                            </Button>
                          )}
                          {quiz.status === 'completed' && (
                            <Button variant="ghost" onClick={() => onNavigate('exam-result')}>
                              查看结果
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="p-6">
              <h5 className="mb-4">测验统计</h5>
              <div className="space-y-4">
                <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="text-3xl mb-1">12</div>
                  <p className="text-sm text-[#ADB5BD]">已完成测验</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="text-3xl mb-1">87</div>
                  <p className="text-sm text-[#ADB5BD]">平均分数</p>
                </div>
                <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                  <div className="text-3xl mb-1">5</div>
                  <p className="text-sm text-[#ADB5BD]">满分次数</p>
                </div>
              </div>
            </Card>
            
            {/* Recent Attempts */}
            <Card className="p-6">
              <h5 className="mb-4">最近测验</h5>
              <div className="space-y-3">
                {recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="p-4 bg-[#F8F9FA] rounded-lg">
                    <h5 className="mb-2 text-sm">{attempt.quiz}</h5>
                    <div className="flex items-center justify-between text-xs text-[#ADB5BD]">
                      <span>分数：{attempt.score}</span>
                      <span>{attempt.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Tips */}
            <Card className="p-6">
              <h5 className="mb-4">测验技巧</h5>
              <ul className="space-y-2 text-sm text-[#212529]">
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>认真复习课程内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>合理分配答题时间</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>仔细阅读题目要求</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>利用 AI 助教答疑</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
