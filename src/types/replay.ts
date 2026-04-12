/**
 * Replay and Practice Mode Types
 */

export interface TestResult {
  testCase: number;
  passed: boolean;
  expected: string;
  actual: string;
  executionTime: number;
  error?: string;
}

export interface TestExecutionResponse {
  passed: number;
  total: number;
  results: TestResult[];
  executionTime: number;
}

export interface UserSubmission {
  code: string;
  language: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'PENDING';
  executionTime?: number;
  output?: string;
}

export interface ReplayQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  args: string[];
  returnType: string;
  constraints: string[];
  examples?: any[];
  sampleTests?: any[];
  testCases?: any[];
  hiddenTestCases?: number;
}

export interface ReplayMatchContext {
  id: string;
  roomId?: string;
  player1: {
    id: string;
    name: string | null;
    image: string | null;
    eloRating: number;
  };
  player2: {
    id: string;
    name: string | null;
    image: string | null;
    eloRating: number;
  };
  outcome: 'win' | 'loss' | 'draw';
  elo: {
    before: number | undefined;
    after: number | undefined;
    delta: number | undefined;
  };
  endTime: Date | null;
  startTime: Date | null;
  duration?: number; // in minutes
}

export interface ReplayContextResponse {
  match: ReplayMatchContext;
  question: ReplayQuestion;
  userSubmission: UserSubmission;
}
