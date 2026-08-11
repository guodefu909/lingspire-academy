import { VictoryResult } from "@config/battle-constants";
import { BattleCrystal } from "../../entities/battle/battle-crystal";

/**
 * 胜利判定系统 —— 检测游戏是否结束及胜负判定。
 *
 * 结束条件：
 * ① 一方水晶血量归零 → 另一方获胜
 * ② 游戏时间耗尽 → 剩余血量高者获胜（平局）
 */
export class VictorySystem {
  private playerCrystal: BattleCrystal;
  private enemyCrystal: BattleCrystal;
  private gameDuration: number;
  private elapsedTime: number = 0;

  constructor(
    playerCrystal: BattleCrystal,
    enemyCrystal: BattleCrystal,
    duration: number,
  ) {
    this.playerCrystal = playerCrystal;
    this.enemyCrystal = enemyCrystal;
    this.gameDuration = duration;
  }

  /** 检查当前游戏状态 */
  checkVictory(): VictoryResult {
    if (this.playerCrystal.isDead()) return VictoryResult.ENEMY_WIN;
    if (this.enemyCrystal.isDead()) return VictoryResult.PLAYER_WIN;

    if (this.elapsedTime >= this.gameDuration) {
      return this.determineWinnerByHealth();
    }

    return VictoryResult.ONGOING;
  }

  /** 时间耗尽后按血量判定胜负 */
  private determineWinnerByHealth(): VictoryResult {
    const playerHealth = this.playerCrystal.getHealth();
    const enemyHealth = this.enemyCrystal.getHealth();

    if (playerHealth > enemyHealth) return VictoryResult.PLAYER_WIN;
    if (enemyHealth > playerHealth) return VictoryResult.ENEMY_WIN;
    return VictoryResult.DRAW;
  }

  updateTime(delta: number): void { this.elapsedTime += delta; }
  getElapsedTime(): number { return this.elapsedTime; }
  getRemainingTime(): number { return Math.max(0, this.gameDuration - this.elapsedTime); }

  /** 格式化剩余时间为 MM:SS */
  getFormattedTime(): string {
    const remaining = Math.ceil(this.getRemainingTime() / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  isGameEnded(): boolean {
    return (
      this.elapsedTime >= this.gameDuration ||
      this.playerCrystal.isDead() ||
      this.enemyCrystal.isDead()
    );
  }

  reset(): void { this.elapsedTime = 0; }
}
