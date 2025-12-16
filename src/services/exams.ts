import type { ExamPaper } from '../types/exam';

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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error || '生成失败');
  }
  return data.paper as ExamPaper;
}

export function saveExamPaperLocal(paper: ExamPaper) {
  const key = localKey(paper.courseId);
  const list: ExamPaper[] = JSON.parse(localStorage.getItem(key) || '[]');
  const newList = [paper, ...list].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(newList));
}

export function listExamPapersLocal(courseId: string) {
  const key = localKey(courseId);
  const list: ExamPaper[] = JSON.parse(localStorage.getItem(key) || '[]');
  return list;
}
