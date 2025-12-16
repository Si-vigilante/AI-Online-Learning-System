export type ReportFormat = 'pdf' | 'docx' | 'md' | 'txt' | 'paste';

export interface ReportAssignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  knowledgePoints: string[];
  dueAt?: string;
  rubric: {
    relevance: number;
    structure: number;
    coverage: number;
    language: number;
    originality?: number;
  };
  exemplar?: {
    title: string;
    rawText: string;
    outline?: string[];
  };
  createdBy: string;
  createdAt: string;
}

export interface ReportSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string;
  format: ReportFormat;
  fileMeta?: { name: string; size: number; mime: string };
  rawText: string;
  wordCount?: number;
}

export interface ReportScoreBreakdown {
  relevance: { score: number; maxScore: number; reasons: string[] };
  structure: { score: number; maxScore: number; reasons: string[] };
  coverage: {
    score: number;
    maxScore: number;
    reasons: string[];
    missingKnowledgePoints: string[];
    hitKnowledgePoints: string[];
  };
  language: {
    score: number;
    maxScore: number;
    reasons: string[];
    issues: { type: string; example: string; suggestion: string }[];
  };
}

export interface ReportFeedback {
  id: string;
  assignmentId: string;
  submissionId: string;
  gradedAt: string;
  model: string;
  totalScore: number;
  maxScore: number;
  breakdown: ReportScoreBreakdown;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedOutline?: string[];
  paragraphLevelAdvice?: { paragraphIndex: number; issue: string; suggestion: string }[];
  comparison?: {
    overallGapSummary: string;
    missingSections: string[];
    structureDiff: { studentOutline: string[]; exemplarOutline: string[]; suggestions: string[] };
    keyPointDiff: { missing: string[]; covered: string[]; exemplarHighlights: string[] };
    styleDiff: string[];
  };
  teacherOverride?: {
    totalScore?: number;
    comment?: string;
  };
  meta?: { retries?: number; confidence?: 'low' | 'medium' | 'high' };
}
