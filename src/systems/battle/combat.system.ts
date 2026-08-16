import { BattleBullet } from "../../entities/battle/battle-bullet";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BattleCrystal } from "../../entities/battle/battle-crystal";

/**
 * 战斗系统 —— 处理炮弹飞行、命中判定和伤害结算。
 *
 * 每帧更新所有飞行炮弹的位置，命中时进行单词匹配判定：
 * 匹配正确 → 士兵受伤，匹配错误 → 士兵回血。
 */
export class CombatSystem {
  private onCorrectMatch:
    | ((bullet: BattleBullet, soldier: BattleSoldier) => void)
    | null = null;
  private onWrongMatch:
    | ((bullet: BattleBullet, soldier: BattleSoldier) => void)
    | null = null;

  setOnCorrectMatch(cb: (bullet: BattleBullet, soldier: BattleSoldier) => void): void {
    this.onCorrectMatch = cb;
  }

  setOnWrongMatch(cb: (bullet: BattleBullet, soldier: BattleSoldier) => void): void {
    this.onWrongMatch = cb;
  }

  /** 处理炮弹命中：触发回调 + 结算伤害 */
  handleCombat(bullet: BattleBullet, soldier: BattleSoldier): void {
    const isMatch = this.checkMatch(bullet, soldier);

    if (isMatch && this.onCorrectMatch) {
      this.onCorrectMatch(bullet, soldier);
    } else if (!isMatch && this.onWrongMatch) {
      this.onWrongMatch(bullet, soldier);
    }

    this.applyDamage(soldier, isMatch);
  }

  /** 检查炮弹单词与目标士兵是否匹配 */
  checkMatch(bullet: BattleBullet, soldier: BattleSoldier): boolean {
    return bullet.checkMatch();
  }

  /** 结算伤害：匹配正确扣血，错误回血 */
  applyDamage(soldier: BattleSoldier, isMatch: boolean): void {
    if (isMatch) {
      soldier.takeDamage(1, "bullet");
    } else {
      soldier.heal();
    }
  }

  /**
   * 每帧更新所有飞行炮弹，命中后销毁并移除。
   */
  update(bullets: BattleBullet[], soldiers: BattleSoldier[], delta: number): void {
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

    // 清理已销毁炮弹
    const activeBullets = bullets.filter((b) => b.active);
    bullets.length = 0;
    bullets.push(...activeBullets);
  }

  /**
   * 从水晶炮塔发射队首炮弹，瞄准目标士兵。
   * @returns 发射的炮弹，如果炮塔无弹则返回 null
   */
  launchBullet(crystal: BattleCrystal, target: BattleSoldier): BattleBullet | null {
    const bullet = crystal.getFrontBullet();
    if (!bullet) return null;

    crystal.removeFrontBullet();
    bullet.setPosition(crystal.x, crystal.y);
    bullet.launch(target);
    return bullet;
  }
}
