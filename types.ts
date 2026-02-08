
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  category?: string;
  source?: string;
  subject?: string;
  year?: string;
  examDate?: string;
}

export interface QuizAttempt {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, number>; // questionId -> selectedIndex
}

export type AppView = 'dashboard' | 'upload' | 'library' | 'quiz' | 'results' | 'analyze' | 'review';

export interface AIResponse {
  questions?: Question[];
  explanation?: string;
  analysis?: string;
}
