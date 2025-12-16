import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Loader2, Plus, FileText, Upload, Sparkles, Shield, BookOpen } from 'lucide-react';
import type { ReportAssignment, ReportFeedback } from '../../types/report';
import {
  createOrUpdateAssignment,
  evaluateReport,
  listAssignments,
  parseReport,
  submitReport
} from '../../services/reports';
import { UserProfile } from '../../services/auth';

interface ReportCenterProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function ReportCenter({ onNavigate, currentUser }: ReportCenterProps) {
  const role = currentUser?.role === 'teacher' ? 'teacher' : 'student';
  const [assignments, setAssignments] = useState<ReportAssignment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [feedback, setFeedback] = useState<ReportFeedback | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<Partial<ReportAssignment>>({
    title: '课程报告',
    description: '',
    knowledgePoints: ['反向传播', '梯度消失'],
    rubric: { relevance: 25, structure: 25, coverage: 25, language: 25 }
  });
  const [kpInput, setKpInput] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const list = await listAssignments('deep-learning');
      setAssignments(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } catch (err: any) {
      setError(err?.message || '加载作业失败');
    }
  };

  const addKnowledgePoint = () => {
    const next = kpInput.trim();
    if (!next) return;
    const points = assignmentForm.knowledgePoints || [];
    if (points.includes(next)) {
      setKpInput('');
      return;
    }
    setAssignmentForm({ ...assignmentForm, knowledgePoints: [...points, next] });
    setKpInput('');
  };

  const removeKnowledgePoint = (kp: string) => {
    setAssignmentForm({
      ...assignmentForm,
      knowledgePoints: (assignmentForm.knowledgePoints || []).filter((k) => k !== kp)
    });
  };

  const handleSaveAssignment = async () => {
    setError(null);
    setLoading(true);
    try {
      const assignment = await createOrUpdateAssignment({
        ...assignmentForm,
        courseId: 'deep-learning',
        createdBy: currentUser?.name || 'teacher'
      });
      await loadAssignments();
      setSelectedId(assignment.id);
    } catch (err: any) {
      setError(err?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePick = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const parsed = await parseReport({ file, assignmentId: selectedId || undefined });
      setRawText(parsed.rawText || '');
    } catch (err: any) {
      setError(err?.message || '解析失败');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmitAndEvaluate = async () => {
    if (!selectedId) {
      setError('请选择作业');
      return;
    }
    if (!rawText.trim()) {
      setError('请上传或粘贴报告内容');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const submission = await submitReport({
        assignmentId: selectedId,
        rawText,
        format: 'paste',
        studentId: currentUser?.userId || 'student',
        studentName: currentUser?.name || '学生'
      });
      const fb = await evaluateReport({
        assignmentId: selectedId,
        submissionId: submission.id,
        rawText
      });
      setFeedback(fb);
    } catch (err: any) {
      setError(err?.message || '提交或评估失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedAssignment = assignments.find((a) => a.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-10 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6" /> AI 报告模块
          </h1>
          <p className="text-lg opacity-90">上传报告 · AI 评估 · 范例对比</p>
        </div>
      </div>

      <div className="container-custom py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {role === 'teacher' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#4C6EF5]" />
                <h3 className="mb-0">教师配置作业</h3>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full border-2 border-[#E9ECEF] rounded-lg px-3 py-2"
                  placeholder="作业标题"
                  value={assignmentForm.title || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                />
                <textarea
                  className="w-full border-2 border-[#E9ECEF] rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="作业要求/描述"
                  value={assignmentForm.description || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                />
                <div>
                  <p className="text-sm text-[#495057] mb-2">知识点范围（可增减）</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(assignmentForm.knowledgePoints || []).map((kp) => (
                      <span
                        key={kp}
                        className="px-3 py-1 bg-[#EDF2FF] text-[#4C6EF5] rounded-full text-xs inline-flex items-center gap-2"
                      >
                        {kp}
                        <button className="text-[#4C6EF5]/70" onClick={() => removeKnowledgePoint(kp)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border-2 border-[#E9ECEF] rounded-lg px-3 py-2"
                      placeholder="输入知识点后回车"
                      value={kpInput}
                      onChange={(e) => setKpInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKnowledgePoint();
                        }
                      }}
                    />
                    <Button size="sm" onClick={addKnowledgePoint}>
                      添加
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['relevance', 'structure', 'coverage', 'language', 'originality'].map((key) => (
                    <label key={key} className="text-sm text-[#495057] space-y-1">
                      <span className="capitalize">{key}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full border-2 border-[#E9ECEF] rounded-lg px-2 py-2"
                        value={(assignmentForm.rubric as any)?.[key] ?? 0}
                        onChange={(e) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            rubric: { ...(assignmentForm.rubric || {}), [key]: Number(e.target.value) || 0 }
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <textarea
                  className="w-full border-2 border-[#E9ECEF] rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="优秀范例（可选，粘贴文本）"
                  value={assignmentForm.exemplar?.rawText || ''}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      exemplar: { title: '范例', rawText: e.target.value }
                    })
                  }
                />
                <Button onClick={handleSaveAssignment} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  保存作业
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4C6EF5]" />
                <h4 className="mb-0">学生提交与评估</h4>
              </div>
              <select
                className="border-2 border-[#E9ECEF] rounded-lg px-3 py-2 text-sm"
                value={selectedId || ''}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedAssignment && (
              <div className="space-y-3">
                <p className="text-sm text-[#ADB5BD]">{selectedAssignment.description}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAssignment.knowledgePoints.map((kp) => (
                    <span key={kp} className="px-3 py-1 bg-[#F1F3F5] text-[#495057] rounded-full text-xs">
                      {kp}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#4C6EF5]" />
                <span className="text-sm text-[#495057]">上传报告文件（支持 txt/md）或粘贴文本</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleFilePick} disabled={loading}>
                  选择文件
                </Button>
                <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileChange} />
              </div>
              <textarea
                className="w-full border-2 border-[#E9ECEF] rounded-lg px-3 py-2"
                rows={8}
                placeholder="粘贴报告正文..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <Button onClick={handleSubmitAndEvaluate} disabled={loading || !selectedId}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                提交并评估
              </Button>
              {error && <p className="text-sm text-[#C92A2A] bg-[#FFF5F5] p-2 rounded">{error}</p>}
            </div>
            {feedback && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="mb-0">AI 反馈</h5>
                  <span className="text-[#37B24D] font-medium">
                    {feedback.totalScore}/{feedback.maxScore}
                  </span>
                </div>
                <p className="text-sm text-[#495057]">{feedback.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['relevance', 'structure', 'coverage', 'language'] as const).map((k) => {
                    const item = (feedback.breakdown as any)[k] || {};
                    return (
                      <div key={k} className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] text-sm">
                        <p className="text-[#495057] capitalize">{k}</p>
                        <p className="text-lg font-semibold">
                          {item.score}/{item.maxScore || 25}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <h6 className="font-medium mb-1">改进建议</h6>
                  <ul className="list-disc pl-5 text-sm text-[#495057] space-y-1">
                    {feedback.improvements?.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
                {feedback.comparison && (
                  <div className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] text-sm space-y-2">
                    <h6 className="font-medium">与范例对比</h6>
                    <p className="text-[#495057]">{feedback.comparison.overallGapSummary}</p>
                    <p className="text-xs text-[#ADB5BD]">
                      缺失章节：{feedback.comparison.missingSections?.join('，') || '无'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h5 className="mb-3">作业列表</h5>
            <div className="space-y-2">
              {assignments.map((a) => (
                <button
                  key={a.id}
                  className={`w-full text-left p-3 border rounded-lg ${
                    selectedId === a.id ? 'border-[#4C6EF5] bg-[#EDF2FF]' : 'border-[#E9ECEF]'
                  }`}
                  onClick={() => {
                    setSelectedId(a.id);
                    setFeedback(null);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4C6EF5]" />
                    <span className="font-medium">{a.title}</span>
                  </div>
                  <p className="text-xs text-[#ADB5BD] line-clamp-2">{a.description}</p>
                </button>
              ))}
              {!assignments.length && <p className="text-sm text-[#ADB5BD]">暂无作业</p>}
            </div>
          </Card>

          {feedback && (
            <Card className="p-6">
              <h5 className="mb-3">优点</h5>
              <ul className="list-disc pl-5 text-sm text-[#495057] space-y-1">
                {feedback.strengths?.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
