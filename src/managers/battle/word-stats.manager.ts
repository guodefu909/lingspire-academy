export interface WordStats {
  word: string;
  correctCount: number;
  wrongCount: number;
}

export class WordStatsManager {
  private stats: Map<string, WordStats> = new Map();
  private storageKey: string = "battle_word_stats";

  constructor() {
    this.loadStats();
  }

  private loadStats(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as WordStats[];
        data.forEach((stat) => {
          this.stats.set(stat.word, stat);
        });
      }
    } catch (e) {
      console.error("Failed to load word stats:", e);
    }
  }

  private saveStats(): void {
    try {
      const data = Array.from(this.stats.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save word stats:", e);
    }
  }

  recordCorrect(word: string): void {
    const stat = this.stats.get(word) || {
      word,
      correctCount: 0,
      wrongCount: 0,
    };
    stat.correctCount++;
    this.stats.set(word, stat);
    this.saveStats();
  }

  recordWrong(word: string): void {
    const stat = this.stats.get(word) || {
      word,
      correctCount: 0,
      wrongCount: 0,
    };
    stat.wrongCount++;
    this.stats.set(word, stat);
    this.saveStats();
  }

  getStats(word: string): WordStats | undefined {
    return this.stats.get(word);
  }

  getAccuracy(word: string): number {
    const stat = this.stats.get(word);
    if (!stat || stat.correctCount + stat.wrongCount === 0) {
      return 0;
    }
    return stat.correctCount / (stat.correctCount + stat.wrongCount);
  }

  getWeight(word: string): number {
    const stat = this.stats.get(word);
    if (!stat) {
      return 1;
    }
    const totalAttempts = stat.correctCount + stat.wrongCount;
    if (totalAttempts === 0) {
      return 1;
    }
    const accuracy = stat.correctCount / totalAttempts;
    return 1 - accuracy + 0.1;
  }

  clearStats(): void {
    this.stats.clear();
    localStorage.removeItem(this.storageKey);
  }
}
