import type { WordData } from '../models/word-data';

const DIFFICULTY_THRESHOLDS = {
  novice: 0.25,
  normal: 0.5,
  hard: 0.75,
};

export type DifficultyLevel = 'novice' | 'normal' | 'hard' | 'master';

export function difficultyValueToLevel(value: number): DifficultyLevel {
  if (value < DIFFICULTY_THRESHOLDS.novice) return 'novice';
  if (value < DIFFICULTY_THRESHOLDS.normal) return 'normal';
  if (value < DIFFICULTY_THRESHOLDS.hard) return 'hard';
  return 'master';
}

export class DifficultyAdapter {
  private currentDifficultyValue: number = 0.3;

  setDifficultyValue(value: number): void {
    this.currentDifficultyValue = Math.max(0, Math.min(1, value));
  }

  getDifficultyValue(): number {
    return this.currentDifficultyValue;
  }

  getDifficultyLevel(): DifficultyLevel {
    return difficultyValueToLevel(this.currentDifficultyValue);
  }

  adjust(accuracy: number): void {
    if (accuracy > 0.85) {
      this.currentDifficultyValue = Math.min(1, this.currentDifficultyValue + 0.1);
    } else if (accuracy < 0.6) {
      this.currentDifficultyValue = Math.max(0, this.currentDifficultyValue - 0.1);
    }
  }

  selectWords(allWords: WordData[], count: number): WordData[] {
    const level = this.getDifficultyLevel();
    const filtered = allWords.filter(
      (w) => difficultyValueToLevel(w.difficulty) === level
    );

    if (filtered.length >= count) {
      return this.shuffle(filtered).slice(0, count);
    }

    const sorted = [...allWords].sort((a, b) =>
      Math.abs(a.difficulty - this.currentDifficultyValue) -
      Math.abs(b.difficulty - this.currentDifficultyValue)
    );
    return sorted.slice(0, count);
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
