import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { PathManager } from "../../managers/battle/path.manager";

export class SoldierMovementSystem {
  private pathManager: PathManager;
  private onSoldierHitCrystal:
    | ((soldier: BattleSoldier, crystal: BattleCrystal) => void)
    | null = null;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
  }

  setOnSoldierHitCrystal(
    callback: (soldier: BattleSoldier, crystal: BattleCrystal) => void,
  ): void {
    this.onSoldierHitCrystal = callback;
  }

  moveSoldier(soldier: BattleSoldier, delta: number): void {
    soldier.move(delta);
  }

  checkCrystalCollision(
    soldier: BattleSoldier,
    crystal: BattleCrystal,
  ): boolean {
    if (!soldier.hasReachedEnd()) {
      return false;
    }

    const distance = Phaser.Math.Distance.Between(
      soldier.x,
      soldier.y,
      crystal.x,
      crystal.y,
    );

    return distance < 50;
  }

  handleCrystalCollision(soldier: BattleSoldier, crystal: BattleCrystal): void {
    if (this.onSoldierHitCrystal) {
      this.onSoldierHitCrystal(soldier, crystal);
    }

    const damage = soldier.getHealth();
    crystal.takeDamage(damage);
    soldier.destroy();
  }

  update(
    soldiers: BattleSoldier[],
    playerCrystal: BattleCrystal,
    enemyCrystal: BattleCrystal,
    delta: number,
  ): void {
    soldiers.forEach((soldier) => {
      this.moveSoldier(soldier, delta);

      if (soldier.hasReachedEnd()) {
        const targetCrystal = soldier.getData("targetCrystal") as BattleCrystal;

        if (targetCrystal) {
          this.handleCrystalCollision(soldier, targetCrystal);
        }
      }
    });

    const aliveSoldiers = soldiers.filter((s) => s.active);
    soldiers.length = 0;
    soldiers.push(...aliveSoldiers);
  }
}
