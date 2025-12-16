import type { ExamPaper, Question } from './exam';

export type SubmissionSource = 'upload' | 'paste' | 'online';

export interface StudentSubmission {
  id: string;
  paperId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string;
  source: SubmissionSource;
  answers: Record<string, any>;
  rawText?: string;
  fileMeta?: { name: string; size: number; mime: string };
}

export interface ObjectiveGradeItem {
  questionId: string;
  correct: boolean;
  score: number;
  maxScore: number;
  correctAnswer: any;
  studentAnswer: any;
  explanation?: string;
}

export interface SubjectiveGradeItem {
  questionId: string;
  score: number;
  maxScore: number;
  studentAnswerText: string;
  referenceAnswer: string;
  rubric: { item: string; points: number }[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordCoverage?: { keyword: string; hit: boolean }[];
  semanticSimilarity?: number;
}

export type GradeItem = ObjectiveGradeItem | SubjectiveGradeItem;

export interface GradingResult {
  id: string;
  paperId: string;
  submissionId: string;
  gradedAt: string;
  gradedBy: string;
  totalScore: number;
  maxScore: number;
  objective: ObjectiveGradeItem[];
  subjective: SubjectiveGradeItem[];
  teacherOverride?: {
    totalScore?: number;
    perQuestionScore?: Record<string, number>;
    perQuestionComment?: Record<string, string>;
  };
  meta?: {
    model: string;
    retries?: number;
    confidence?: 'low' | 'medium' | 'high';
  };
}
