import { VictoryResult } from "@config/battle-constants";
import { BattleCrystal } from "../../entities/battle/battle-crystal";

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

  checkVictory(): VictoryResult {
    if (this.playerCrystal.isDead()) {
      return VictoryResult.ENEMY_WIN;
    }

    if (this.enemyCrystal.isDead()) {
      return VictoryResult.PLAYER_WIN;
    }

    if (this.elapsedTime >= this.gameDuration) {
      return this.determineWinnerByHealth();
    }

    return VictoryResult.ONGOING;
  }

  private determineWinnerByHealth(): VictoryResult {
    const playerHealth = this.playerCrystal.getHealth();
    const enemyHealth = this.enemyCrystal.getHealth();

    if (playerHealth > enemyHealth) {
      return VictoryResult.PLAYER_WIN;
    } else if (enemyHealth > playerHealth) {
      return VictoryResult.ENEMY_WIN;
    } else {
      return VictoryResult.DRAW;
    }
  }

  updateTime(delta: number): void {
    this.elapsedTime += delta;
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  getRemainingTime(): number {
    return Math.max(0, this.gameDuration - this.elapsedTime);
  }

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

  reset(): void {
    this.elapsedTime = 0;
  }
}
