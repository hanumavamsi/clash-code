/**
 * Dashboard and Match History API Types
 */

export interface User {
    id: string;
    name: string | null;
    image: string | null;
    eloRating: number;
}

export interface MatchListItem {
    id: string;
    opponent: User;
    outcome: 'win' | 'loss' | 'draw';
    userEloAfter: number | undefined;
    eloDelta: number | undefined;
    questionCount: number;
    endTime: Date | null;
    duration: number | null; // in minutes
}

export interface MatchListResponse {
    matches: MatchListItem[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}

export interface QuestionBase {
    id: string;
    title: string;
    difficulty: string;
    description: string;
    args: string[];
    returnType: string;
    sampleTests: unknown;
    constraints: string[];
}

export interface Submission {
    id: string;
    questionId: string;
    code: string;
    status: 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'ERROR';
    executionTime: number | null;
    createdAt: Date;
}

export interface QuestionWithSubmission extends QuestionBase {
    submission?: Submission | null;
}

export interface MatchDetail {
    id: string;
    roomId: string | undefined;
    outcome: 'win' | 'loss' | 'draw';
    startTime: Date | null;
    endTime: Date | null;
    duration: number | null; // in minutes
    player1: User;
    player2: User;
    winnerId: string | null;
    elo: {
        before: number | undefined;
        after: number | undefined;
        delta: number | undefined;
    };
}

export interface MatchDetailResponse {
    match: MatchDetail;
    questions: QuestionWithSubmission[];
}

export interface SolutionResponse {
    questionId: string;
    title: string;
    solution: string;
    language: string;
}

export interface UserStats {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number; // as percentage (0-100)
}

export interface UserStatsResponse {
    user: User & { createdAt: Date };
    stats: UserStats;
}
