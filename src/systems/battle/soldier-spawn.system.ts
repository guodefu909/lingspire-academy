import { PathType } from "@config/battle-constants";
import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { WordLibraryManager } from "../../managers/battle/word-library.manager";
import { PathManager } from "../../managers/battle/path.manager";
import { BattleConfig } from "../../data/battle/battle-config";

export class SoldierSpawnSystem {
  private spawnInterval: number;
  private minInterval: number;
  private maxInterval: number;
  private decreaseRate: number;
  private accumulatedTime: number = 0;
  private lastSpawnTime: number = -6000;
  private wordLibrary: WordLibraryManager;
  private pathManager: PathManager;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    wordLibrary: WordLibraryManager,
    pathManager: PathManager,
    config: BattleConfig,
  ) {
    this.scene = scene;
    this.wordLibrary = wordLibrary;
    this.pathManager = pathManager;
    this.maxInterval = config.spawn.initialInterval;
    this.minInterval = config.spawn.finalInterval;
    this.decreaseRate = config.spawn.decreaseRate;
    this.spawnInterval = this.maxInterval;
  }

  calculateSpawnInterval(elapsedMinutes: number): number {
    const interval =
      this.maxInterval - elapsedMinutes * this.decreaseRate * 1000;
    return Math.max(this.minInterval, interval);
  }

  update(time: number, delta: number, crystals: BattleCrystal[]): void {
    this.accumulatedTime += delta;

    const elapsedMinutes = this.accumulatedTime / 60000;
    this.spawnInterval = this.calculateSpawnInterval(elapsedMinutes);

    if (this.accumulatedTime - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnSoldiers(crystals);
      this.lastSpawnTime = this.accumulatedTime;
    }
  }

  private spawnSoldiers(crystals: BattleCrystal[]): void {
    const paths = [PathType.TOP, PathType.MIDDLE, PathType.BOTTOM];

    // 随机化路径顺序
    const shuffledPaths = this.shuffleArray([...paths]);

    // 先为每条路生成单词（玩家和敌方使用相同的单词）
    const pathWords: Map<PathType, any> = new Map();
    shuffledPaths.forEach((pathType) => {
      pathWords.set(pathType, this.wordLibrary.getRandomWord());
    });

    // 随机化水晶顺序
    const shuffledCrystals = this.shuffleArray([...crystals]);

    shuffledCrystals.forEach((crystal) => {
      shuffledPaths.forEach((pathType) => {
        const wordData = pathWords.get(pathType);

        const soldier = new BattleSoldier(
          this.scene,
          wordData.word,
          wordData.emoji,
          pathType,
          this.pathManager,
          undefined,
          undefined,
          crystal.getIsPlayer(),
        );

        this.scene.events.emit("soldier-spawned", {
          soldier,
          crystal,
          wordData,
        });
      });
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getSpawnInterval(): number {
    return this.spawnInterval;
  }

  reset(): void {
    this.accumulatedTime = 0;
    this.lastSpawnTime = -6000;
    this.spawnInterval = this.maxInterval;
  }
}
