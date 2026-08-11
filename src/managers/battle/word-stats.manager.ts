/**
 * 单词学习统计 —— 记录每个单词的正确/错误次数。
 */
export interface WordStats {
  word: string;
  correctCount: number;
  wrongCount: number;
}

/**
 * 单词统计管理器 —— 利用 localStorage 持久化学习数据。
 *
 * 每次答题后更新统计，权重计算用于词库的加权随机（答错多的词出现频率更高）。
 */
export class WordStatsManager {
  private stats: Map<string, WordStats> = new Map();
  private storageKey: string = "battle_word_stats";

  constructor() { this.loadStats(); }

  /** 从 localStorage 加载历史数据 */
  private loadStats(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as WordStats[];
        data.forEach((stat) => this.stats.set(stat.word, stat));
      }
    } catch (e) {
      console.error("Failed to load word stats:", e);
    }
  }

  /** 保存到 localStorage */
  private saveStats(): void {
    try {
      const data = Array.from(this.stats.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save word stats:", e);
    }
  }

  recordCorrect(word: string): void {
    const stat = this.stats.get(word) || { word, correctCount: 0, wrongCount: 0 };
    stat.correctCount++;
    this.stats.set(word, stat);
    this.saveStats();
  }

  recordWrong(word: string): void {
    const stat = this.stats.get(word) || { word, correctCount: 0, wrongCount: 0 };
    stat.wrongCount++;
    this.stats.set(word, stat);
    this.saveStats();
  }

  getStats(word: string): WordStats | undefined { return this.stats.get(word); }

  /** 返回正确率 0~1，无记录时返回 0 */
  getAccuracy(word: string): number {
    const stat = this.stats.get(word);
    if (!stat || stat.correctCount + stat.wrongCount === 0) return 0;
    return stat.correctCount / (stat.correctCount + stat.wrongCount);
  }

  /**
   * 权重计算：1 - 正确率 + 0.1
   * 正确率 0% → 权重 1.1，正确率 100% → 权重 0.1
   * 答错越多的词权重越高，出现频率越大。
   */
  getWeight(word: string): number {
    const stat = this.stats.get(word);
    if (!stat) return 1;
    const totalAttempts = stat.correctCount + stat.wrongCount;
    if (totalAttempts === 0) return 1;
    const accuracy = stat.correctCount / totalAttempts;
    return 1 - accuracy + 0.1;
  }

  /** 清除所有统计数据 */
  clearStats(): void {
    this.stats.clear();
    localStorage.removeItem(this.storageKey);
  }
}
