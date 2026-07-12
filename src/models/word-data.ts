export interface VowelChunk {
  index: number;
  value: string;
}

export interface WordData {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  vowelChunks: VowelChunk[];
  syllableChunks: string[];
  difficulty: number;
  distractors: string[];
}

export interface GameSession {
  sessionId: string;
  difficulty: string;
  questions: string[];
  results: QuestionResult[];
}

export interface QuestionResult {
  wordId: string;
  correct: boolean;
  responseTimeMs: number;
}
