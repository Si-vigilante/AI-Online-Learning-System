import { safeJson } from '../utils/safeJson';
import type { ReportAssignment, ReportFeedback, ReportSubmission } from '../types/report';

export async function parseReport(input: { file?: File; text?: string; assignmentId?: string }) {
  if (input.file) {
    const form = new FormData();
    form.append('file', input.file);
    if (input.assignmentId) form.append('assignmentId', input.assignmentId);
    const res = await fetch('/api/reports/parse', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || '解析失败');
    }
    return safeJson(res);
  }
  const res = await fetch('/api/reports/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.text, assignmentId: input.assignmentId })
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || '解析失败');
  }
  return safeJson(res);
}

export async function createOrUpdateAssignment(payload: Partial<ReportAssignment>) {
  const res = await fetch('/api/reportAssignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await safeJson<{ assignment: ReportAssignment }>(res);
  if (!res.ok) throw new Error((data as any)?.error || '保存失败');
  return data.assignment;
}

export async function listAssignments(courseId?: string) {
  const res = await fetch(`/api/reportAssignments${courseId ? `?courseId=${courseId}` : ''}`);
  const data = await safeJson<{ assignments: ReportAssignment[] }>(res);
  return data.assignments;
}

export async function submitReport(payload: {
  assignmentId: string;
  rawText: string;
  format: string;
  fileMeta?: any;
  studentId: string;
  studentName?: string;
}) {
  const res = await fetch('/api/reportSubmissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await safeJson<{ submission: ReportSubmission }>(res);
  if (!res.ok) throw new Error((data as any)?.error || '提交失败');
  return data.submission;
}

export async function evaluateReport(payload: { assignmentId: string; submissionId: string; rawText: string }) {
  const res = await fetch('/api/reports/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await safeJson<{ feedback: ReportFeedback }>(res);
  if (!res.ok) throw new Error((data as any)?.error?.message || '评估失败');
  return data.feedback;
}

export async function getFeedback(submissionId: string) {
  const res = await fetch(`/api/reports/feedback?submissionId=${submissionId}`);
  const data = await safeJson<{ feedback: ReportFeedback | null }>(res);
  return data.feedback;
}

const localKey = (courseId: string) => `reportAssignments:${courseId || 'default'}`;
const fbKey = (assignmentId: string) => `reportFeedback:${assignmentId || 'default'}`;

export function saveAssignmentLocal(courseId: string, assignment: ReportAssignment) {
  const key = localKey(courseId);
  const list: ReportAssignment[] = JSON.parse(localStorage.getItem(key) || '[]');
  const next = [assignment, ...list.filter((a) => a.id !== assignment.id)].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(next));
}

export function listAssignmentLocal(courseId: string) {
  const key = localKey(courseId);
  const list: ReportAssignment[] = JSON.parse(localStorage.getItem(key) || '[]');
  return list;
}

export function saveFeedbackLocal(assignmentId: string, feedback: ReportFeedback) {
  const key = fbKey(assignmentId);
  const list: ReportFeedback[] = JSON.parse(localStorage.getItem(key) || '[]');
  const next = [feedback, ...list].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(next));
}

export function listFeedbackLocal(assignmentId: string) {
  const key = fbKey(assignmentId);
  const list: ReportFeedback[] = JSON.parse(localStorage.getItem(key) || '[]');
  return list;
}
