import { VictoryResult } from "@config/battle-constants";

/** 单局结果：胜 / 负 / 平 */
type GameOutcome = "win" | "loss" | "draw";

/**
 * AI 难度动态调整管理器 —— 根据最近对局胜负动态调整 AI 失败率。
 *
 * 规则：
 * - 最近 5 局全胜 → AI 失败率调低 1 个百分点（AI 变强）
 * - 最近 3 局全负 → AI 失败率调高 1 个百分点（AI 变弱）
 *
 * 通过 localStorage 持久化历史战绩与当前失败率。
 */
export class AIDifficultyManager {
  private static readonly HISTORY_KEY = "battle_ai_history";
  private static readonly RATE_KEY = "battle_ai_error_rate";

  /** 连续获胜判定阈值 */
  private readonly winThreshold = 5;
  /** 连续失败判定阈值 */
  private readonly loseThreshold = 3;
  /** 每次调整幅度（1 个百分点） */
  private readonly step = 0.01;
  /** 失败率下限（避免 AI 永不犯错） */
  private readonly minRate = 0.05;
  /** 失败率上限 */
  private readonly maxRate = 0.9;

  /** 最近对局结果（最多保留 winThreshold 条） */
  private history: GameOutcome[] = [];
  private baseRate: number;
  private currentRate: number = 0;

  constructor(baseRate: number) {
    this.baseRate = baseRate;
    this.load();
  }

  /** 当前生效的 AI 失败率 */
  getEffectiveRate(): number {
    return this.currentRate;
  }

  /** 记录一局结果并据此动态调整失败率 */
  recordResult(result: VictoryResult): void {
    this.history.push(this.toOutcome(result));
    if (this.history.length > this.winThreshold) {
      this.history = this.history.slice(-this.winThreshold);
    }

    this.adjust();
    this.save();
  }

  private toOutcome(result: VictoryResult): GameOutcome {
    if (result === VictoryResult.PLAYER_WIN) return "win";
    if (result === VictoryResult.ENEMY_WIN) return "loss";
    return "draw";
  }

  private adjust(): void {
    if (
      this.history.length >= this.winThreshold &&
      this.history.every((o) => o === "win")
    ) {
      this.currentRate = Math.max(this.minRate, this.currentRate - this.step);
    } else if (
      this.history.length >= this.loseThreshold &&
      this.history.every((o) => o === "loss")
    ) {
      this.currentRate = Math.min(this.maxRate, this.currentRate + this.step);
    }
  }

  private load(): void {
    try {
      const storedHistory = localStorage.getItem(AIDifficultyManager.HISTORY_KEY);
      if (storedHistory) {
        this.history = JSON.parse(storedHistory) as GameOutcome[];
      }
      const storedRate = localStorage.getItem(AIDifficultyManager.RATE_KEY);
      this.currentRate =
        storedRate !== null ? parseFloat(storedRate) : this.baseRate;
    } catch (e) {
      console.error("Failed to load AI difficulty:", e);
      this.currentRate = this.baseRate;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(
        AIDifficultyManager.HISTORY_KEY,
        JSON.stringify(this.history),
      );
      localStorage.setItem(AIDifficultyManager.RATE_KEY, String(this.currentRate));
    } catch (e) {
      console.error("Failed to save AI difficulty:", e);
    }
  }

  /** 重置历史与失败率 */
  reset(): void {
    this.history = [];
    this.currentRate = this.baseRate;
    localStorage.removeItem(AIDifficultyManager.HISTORY_KEY);
    localStorage.removeItem(AIDifficultyManager.RATE_KEY);
  }
}
