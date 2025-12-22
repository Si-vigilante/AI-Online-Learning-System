import type { ExamPaper } from '../types/exam';
import { safeJson } from '../utils/safeJson';

const localKey = (courseId: string) => `examPapers:${courseId || 'default'}`;

export async function generateExamPaper(payload: {
  courseId: string;
  knowledgeScope: string[];
  difficulty: string;
  questionPlan: Record<string, number>;
  durationMinutes: number;
  title?: string;
  createdBy?: string;
}) {
  const res = await fetch('/api/exams/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Generate failed: ${res.status} ${errText}`);
  }
  const data = await safeJson<{ paper: ExamPaper }>(res);
  return data.paper;
}

export async function saveExamPaperRemote(paper: ExamPaper) {
  const res = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paper })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Save failed: ${res.status} ${errText}`);
  }
  const data = await safeJson<{ ok: boolean; existing?: boolean; paper?: ExamPaper }>(res);
  return data;
}

export function saveExamPaperLocal(paper: ExamPaper) {
  const key = localKey(paper.courseId);
  const list: ExamPaper[] = JSON.parse(localStorage.getItem(key) || '[]');
  const merged = [paper, ...list];
  const seen = new Set<string>();
  const deduped: ExamPaper[] = [];
  merged.forEach((p) => {
    const dedupeKey = (p as any).hash || p.id;
    if (dedupeKey && !seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      deduped.push(p);
    }
  });
  localStorage.setItem(key, JSON.stringify(deduped.slice(0, 20)));
}

export function listExamPapersLocal(courseId: string) {
  const key = localKey(courseId);
  const list: ExamPaper[] = JSON.parse(localStorage.getItem(key) || '[]');
  const seen = new Set<string>();
  return list.filter((p) => {
    const dedupeKey = (p as any).hash || p.id;
    if (!dedupeKey) return true;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}
