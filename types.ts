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