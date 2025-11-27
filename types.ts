export interface Problem {
  id: string;
  title: string;
  description: string;
}

export interface SubmissionResult {
  score: number;
  isCorrect: boolean;
  feedback: string;
  suggestedSolution?: string;
}

export enum ParsingStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum GradingStatus {
  IDLE = 'IDLE',
  GRADING = 'GRADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// 新增結構定義
export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  description?: string;
}

export interface QuestionBank {
  id: string;
  folderId: string;
  title: string;
  problems: Problem[];
  createdAt: number;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}