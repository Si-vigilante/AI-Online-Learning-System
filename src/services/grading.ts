import type { ExamPaper } from '../types/exam';
import type { GradingResult, StudentSubmission } from '../types/grading';

export async function parseSubmission(payload: { text?: string; paperId?: string; file?: File }) {
  if (payload.file) {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.paperId) form.append('paperId', payload.paperId);
    const res = await fetch('/api/submissions/parse', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || '解析失败');
    return data;
  }
  const res = await fetch('/api/submissions/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: payload.text, paperId: payload.paperId })
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || '解析失败');
  }
  const text = await res.text();
  if (!text) throw new Error('Empty response body');
  return JSON.parse(text);
}

export async function gradeSubmission(payload: {
  paperId: string;
  submission: Partial<StudentSubmission>;
}) {
  const res = await fetch('/api/grading/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!text) throw new Error(`Empty response body. status=${res.status}`);
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data?.error?.message || data?.error || '批改失败');
  return data.result as GradingResult;
}

const localKey = (paperId: string) => `gradingResults:${paperId || 'default'}`;

export function saveGradingLocal(result: GradingResult) {
  const key = localKey(result.paperId);
  const list: GradingResult[] = JSON.parse(localStorage.getItem(key) || '[]');
  const next = [result, ...list].slice(0, 30);
  localStorage.setItem(key, JSON.stringify(next));
}

export function listGradingLocal(paperId: string) {
  const key = localKey(paperId);
  const list: GradingResult[] = JSON.parse(localStorage.getItem(key) || '[]');
  return list;
}
