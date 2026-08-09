import wordLibraryData from "../../data/battle/word-library.json";
import { WordStatsManager } from "./word-stats.manager";

export interface WordData {
  word: string;
  imageUrl: string;
  category: string;
  chinese: string;
}

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

  private loadWordLibrary(): void {
    this.words = wordLibraryData.words.map((w) => ({
      ...w,
      imageUrl: w.imageUrl.replace("{base}", this.imageBaseUrl),
    }));
    this.words.forEach((wordData) => {
      this.wordMap.set(wordData.word, wordData);
    });
  }

  getRandomWord(): WordData {
    const weights = this.words.map((w) => this.statsManager.getWeight(w.word));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < this.words.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return this.words[i];
      }
    }

    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  getWordData(word: string): WordData | undefined {
    return this.wordMap.get(word);
  }

  getImageUrl(word: string): string {
    const wordData = this.wordMap.get(word);
    return wordData ? wordData.imageUrl : "";
  }

  getImageKey(word: string): string {
    return `word_img_${word}`;
  }

  getAllImageUrls(): string[] {
    return this.words.map((w) => w.imageUrl);
  }

  getWordCount(): number {
    return this.words.length;
  }

  getStatsManager(): WordStatsManager {
    return this.statsManager;
  }
}
