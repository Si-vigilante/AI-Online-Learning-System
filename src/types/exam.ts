export type Difficulty = '简单' | '中等' | '困难';
export type QuestionType = 'single' | 'multiple' | 'tf' | 'short' | 'essay';

export interface QuestionBase {
  id: string;
  type: QuestionType;
  stem: string;
  knowledgePoints: string[];
  difficulty: Difficulty;
  score: number;
  explanation?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  type: 'single' | 'multiple';
  options: { key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; text: string }[];
  answer: ('A' | 'B' | 'C' | 'D' | 'E' | 'F')[];
}

export interface TFQuestion extends QuestionBase {
  type: 'tf';
  answer: boolean;
}

export interface SubjectiveQuestion extends QuestionBase {
  type: 'short' | 'essay';
  referenceAnswer: string;
  gradingRubric: { item: string; points: number }[];
  keywords?: string[];
}

export type Question = ChoiceQuestion | TFQuestion | SubjectiveQuestion;

export interface ExamPaper {
  id: string;
  title: string;
  courseId: string;
  createdBy: string;
  createdAt: string;
  difficulty: Difficulty;
  knowledgeScope: string[];
  durationMinutes: number;
  totalScore: number;
  questions: Question[];
  meta?: {
    model: string;
    tokens?: number;
    retries?: number;
    source: 'bank_only' | 'mixed' | 'llm_only';
  };
}
