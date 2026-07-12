export interface SentenceData {
  id: string;
  sentence: string;
  translation: string;
  chunks: string[];
  chunkTranslations: string[];
  difficulty: number;
  distractors: string[];
}
