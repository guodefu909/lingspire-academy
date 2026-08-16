import { PathType } from "@config/battle-constants";
import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { WordLibraryManager } from "../../managers/battle/word-library.manager";
import { PathManager } from "../../managers/battle/path.manager";
import { BattleConfig } from "../../data/battle/battle-config";

/**
 * 士兵生成系统 —— 控制出兵间隔和出兵逻辑。
 *
 * 出兵间隔按游戏时间进度线性递减：initialInterval → finalInterval。
 * 每次出兵在三路各生成一个士兵（携带随机单词），玩家方和敌方共用同一单词。
 */
export class SoldierSpawnSystem {
  /** 当前出兵间隔 ms */
  private spawnInterval: number;
  /** 最快间隔（游戏末段） */
  private minInterval: number;
  /** 最慢间隔（游戏开局） */
  private maxInterval: number;
  /** 游戏总时长 */
  private gameDuration: number;
  /** 游戏已过时间 */
  private accumulatedTime: number = 0;
  /** 上次出兵时间戳 */
  private lastSpawnTime: number = -6000;
  private wordLibrary: WordLibraryManager;
  private pathManager: PathManager;
  private scene: Phaser.Scene;
  private soldierSpeed: number;
  /** 出兵批次计数（每次出兵 +1） */
  private batchCounter: number = 0;

  constructor(
    scene: Phaser.Scene,
    wordLibrary: WordLibraryManager,
    pathManager: PathManager,
    config: BattleConfig,
    gameDuration: number,
  ) {
    this.scene = scene;
    this.wordLibrary = wordLibrary;
    this.pathManager = pathManager;
    this.maxInterval = config.spawn.initialInterval;
    this.minInterval = config.spawn.finalInterval;
    this.gameDuration = gameDuration;
    this.spawnInterval = this.maxInterval;
    this.soldierSpeed = config.soldier.speed;
  }

  /**
   * 根据游戏进度（0~1）线性插值计算当前出兵间隔。
   * progress=0 → maxInterval，progress=1 → minInterval。
   */
  calculateSpawnInterval(progress: number): number {
    return this.maxInterval - progress * (this.maxInterval - this.minInterval);
  }

  /** 每帧调用：累计时间，达到间隔时出兵 */
  update(time: number, delta: number, crystals: BattleCrystal[]): void {
    this.accumulatedTime += delta;

    const progress = Math.min(this.accumulatedTime / this.gameDuration, 1);
    this.spawnInterval = this.calculateSpawnInterval(progress);

    if (this.accumulatedTime - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnSoldiers(crystals);
      this.lastSpawnTime = this.accumulatedTime;
    }
  }

  /**
   * 执行一波出兵：三路（上中下）各生成一个单词，
   * 玩家方和敌方共用同一单词（双方需要打同一个词），
   * 相同路双方单词一致（上对上、中对中、下对下），
   * 同一批次双方共享相同 batch 编号。
   */
  private spawnSoldiers(crystals: BattleCrystal[]): void {
    const paths = [PathType.TOP, PathType.MIDDLE, PathType.BOTTOM];

    // 为每条路分配互不相同的随机单词（玩家和敌方共用，固定按路上/中/下映射）
    const distinctWords = this.wordLibrary.getRandomWords(paths.length);
    const pathWords: Map<PathType, any> = new Map();
    paths.forEach((pathType, i) => {
      pathWords.set(pathType, distinctWords[i]);
    });

    // 同一批次所有士兵共享同一 batch 编号
    this.batchCounter++;

    crystals.forEach((crystal) => {
      // 每个水晶的三路出兵顺序随机打乱，使该批次对应三枚炮弹乱序追加到队尾
      const shuffledPaths = this.shuffleArray([...paths]);
      shuffledPaths.forEach((pathType) => {
        const wordData = pathWords.get(pathType);

        const soldier = new BattleSoldier(
          this.scene,
          wordData.word,
          wordData.imageUrl,
          pathType,
          this.pathManager,
          undefined,
          this.soldierSpeed,
          crystal.getIsPlayer(),
          this.batchCounter,
        );

        this.scene.events.emit("soldier-spawned", {
          soldier,
          crystal,
          wordData,
        });
      });
    });
  }

  /** Fisher-Yates 洗牌 */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getSpawnInterval(): number { return this.spawnInterval; }

  reset(): void {
    this.accumulatedTime = 0;
    this.lastSpawnTime = -6000;
    this.spawnInterval = this.maxInterval;
  }
}
