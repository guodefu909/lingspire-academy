import wordLibraryData from "../../data/battle/word-library.json";
import { WordStatsManager } from "./word-stats.manager";

/** 单词数据：英文单词、图片URL、分类、中文释义 */
export interface WordData {
  word: string;
  imageUrl: string;
  category: string;
  chinese: string;
}

/**
 * 词库管理器 —— 加载单词库，提供随机抽取和加权随机功能。
 *
 * 加权随机：答错越多的单词权重越高，出现的概率越大，
 * 已掌握的单词权重降低，减少出现频率。
 */
export class WordLibraryManager {
  private words: WordData[] = [];
  private wordMap: Map<string, WordData> = new Map();
  private statsManager: WordStatsManager;
  private imageBaseUrl: string;

  constructor(imageBaseUrl: string = "") {
    this.statsManager = new WordStatsManager();
    this.imageBaseUrl = imageBaseUrl;
    this.loadWordLibrary();
  }

  /** 加载 JSON 词库并替换 {base} 模板 */
  private loadWordLibrary(): void {
    this.words = wordLibraryData.words.map((w) => ({
      ...w,
      imageUrl: w.imageUrl.replace("{base}", this.imageBaseUrl),
    }));
    this.words.forEach((wordData) => {
      this.wordMap.set(wordData.word, wordData);
    });
  }

  /**
   * 加权随机抽取一个单词。
   * 权重 = 1 - 正确率 + 0.1，正确率越低权重越大。
   */
  getRandomWord(): WordData {
    const weights = this.words.map((w) => this.statsManager.getWeight(w.word));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < this.words.length; i++) {
      random -= weights[i];
      if (random <= 0) return this.words[i];
    }

    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  /**
   * 加权随机抽取 count 个互不相同的单词。
   * 使用"不放回"抽取：每抽一个后将其从候选池移除。
   * 若 count 超过词库总数，返回全部去重后的单词。
   */
  getRandomWords(count: number): WordData[] {
    const pool = [...this.words];
    const result: WordData[] = [];

    while (result.length < count && pool.length > 0) {
      const weights = pool.map((w) => this.statsManager.getWeight(w.word));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      let random = Math.random() * totalWeight;
      let index = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          index = i;
          break;
        }
      }

      result.push(pool[index]);
      pool.splice(index, 1);
    }

    return result;
  }

  getWordData(word: string): WordData | undefined { return this.wordMap.get(word); }
  getImageUrl(word: string): string { return this.wordMap.get(word)?.imageUrl || ""; }
  getImageKey(word: string): string { return `word_img_${word}`; }
  getAllImageUrls(): string[] { return this.words.map((w) => w.imageUrl); }
  getWordCount(): number { return this.words.length; }
  getStatsManager(): WordStatsManager { return this.statsManager; }
}
