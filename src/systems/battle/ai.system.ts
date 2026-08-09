import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BattleBullet } from "../../entities/battle/battle-bullet";
import { CombatSystem } from "./combat.system";

export class AISystem {
  private errorRate: number;
  private crystal: BattleCrystal;
  private combatSystem: CombatSystem;
  private lastActionTime: number = 0;
  private actionInterval: number = 2000;

  constructor(
    crystal: BattleCrystal,
    combatSystem: CombatSystem,
    errorRate: number = 0.3,
  ) {
    this.crystal = crystal;
    this.combatSystem = combatSystem;
    this.errorRate = errorRate;
  }

  selectTarget(soldiers: BattleSoldier[]): BattleSoldier | null {
    if (soldiers.length === 0) {
      return null;
    }

    const enemySoldiers = soldiers.filter((s) => s.active);

    if (enemySoldiers.length === 0) {
      return null;
    }

    const frontSoldier = enemySoldiers.reduce((closest, current) => {
      return current.getPathProgress() > closest.getPathProgress()
        ? current
        : closest;
    });

    return frontSoldier;
  }

  shouldMakeError(): boolean {
    return Math.random() < this.errorRate;
  }

  update(time: number, enemySoldiers: BattleSoldier[]): BattleBullet | null {
    if (time - this.lastActionTime < this.actionInterval) {
      return null;
    }

    if (!this.crystal.getTurret().hasBullets()) {
      return null;
    }

    const playerSoldiers = enemySoldiers.filter(
      (s) => s.active && s.getIsPlayerOwned(),
    );

    if (playerSoldiers.length === 0) {
      return null;
    }

    const target = this.selectTarget(playerSoldiers);

    if (!target) {
      return null;
    }

    const bullet = this.crystal.getFrontBullet();

    if (!bullet) {
      return null;
    }

    let launchedBullet: BattleBullet | null = null;

    if (this.shouldMakeError()) {
      const wrongTargets = playerSoldiers.filter(
        (s) => s.active && s.getWord() !== bullet.getWord(),
      );

      if (wrongTargets.length > 0) {
        const randomTarget =
          wrongTargets[Math.floor(Math.random() * wrongTargets.length)];
        launchedBullet = this.combatSystem.launchBullet(
          this.crystal,
          randomTarget,
        );
      }
    } else {
      const correctTargets = playerSoldiers.filter(
        (s) => s.active && s.getWord() === bullet.getWord(),
      );

      if (correctTargets.length > 0) {
        launchedBullet = this.combatSystem.launchBullet(
          this.crystal,
          correctTargets[0],
        );
      } else {
        launchedBullet = this.combatSystem.launchBullet(this.crystal, target);
      }
    }

    this.lastActionTime = time;
    return launchedBullet;
  }

  setActionInterval(interval: number): void {
    this.actionInterval = interval;
  }

  setErrorRate(rate: number): void {
    this.errorRate = rate;
  }
}
