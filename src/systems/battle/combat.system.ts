import { BattleBullet } from "../../entities/battle/battle-bullet";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BattleCrystal } from "../../entities/battle/battle-crystal";

export class CombatSystem {
  private onCorrectMatch:
    | ((bullet: BattleBullet, soldier: BattleSoldier) => void)
    | null = null;
  private onWrongMatch:
    | ((bullet: BattleBullet, soldier: BattleSoldier) => void)
    | null = null;

  setOnCorrectMatch(
    callback: (bullet: BattleBullet, soldier: BattleSoldier) => void,
  ): void {
    this.onCorrectMatch = callback;
  }

  setOnWrongMatch(
    callback: (bullet: BattleBullet, soldier: BattleSoldier) => void,
  ): void {
    this.onWrongMatch = callback;
  }

  handleCombat(bullet: BattleBullet, soldier: BattleSoldier): void {
    const isMatch = this.checkMatch(bullet, soldier);

    if (isMatch && this.onCorrectMatch) {
      this.onCorrectMatch(bullet, soldier);
    } else if (!isMatch && this.onWrongMatch) {
      this.onWrongMatch(bullet, soldier);
    }

    this.applyDamage(soldier, isMatch);
  }

  checkMatch(bullet: BattleBullet, soldier: BattleSoldier): boolean {
    return bullet.checkMatch();
  }

  applyDamage(soldier: BattleSoldier, isMatch: boolean): void {
    if (isMatch) {
      soldier.takeDamage();
    } else {
      soldier.heal();
    }
  }

  update(
    bullets: BattleBullet[],
    soldiers: BattleSoldier[],
    delta: number,
  ): void {
    bullets.forEach((bullet) => {
      const hasHit = bullet.move(delta);

      if (hasHit) {
        const target = bullet.getTarget();
        if (target && target.active) {
          this.handleCombat(bullet, target);
        }
        bullet.destroy();
      }
    });

    const activeBullets = bullets.filter((b) => b.active);
    bullets.length = 0;
    bullets.push(...activeBullets);
  }

  launchBullet(
    crystal: BattleCrystal,
    target: BattleSoldier,
  ): BattleBullet | null {
    const bullet = crystal.getFrontBullet();

    if (!bullet) {
      return null;
    }

    crystal.removeFrontBullet();

    bullet.setPosition(crystal.x, crystal.y);
    bullet.launch(target);

    return bullet;
  }
}
