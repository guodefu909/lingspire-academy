import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { PathManager } from "../../managers/battle/path.manager";

/**
 * 士兵移动系统 —— 更新所有士兵沿路径移动并检测抵达终点。
 *
 * 抵达敌方水晶时扣血 + 士兵死亡，同时记录错误单词（玩家方漏掉的敌军）。
 */
export class SoldierMovementSystem {
  private pathManager: PathManager;
  private onSoldierHitCrystal:
    | ((soldier: BattleSoldier, crystal: BattleCrystal) => void)
    | null = null;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
  }

  setOnSoldierHitCrystal(cb: (soldier: BattleSoldier, crystal: BattleCrystal) => void): void {
    this.onSoldierHitCrystal = cb;
  }

  /**
   * 每帧更新所有士兵位置，抵达终点时扣血并销毁。
   * @param soldiers 士兵数组（玩家或敌方）
   * @param ownCrystal 己方水晶（不会判定扣血）
   * @param targetCrystal 目标水晶（抵达时扣血）
   */
  update(
    soldiers: BattleSoldier[],
    ownCrystal: BattleCrystal,
    targetCrystal: BattleCrystal,
    delta: number,
  ): void {
    for (let i = soldiers.length - 1; i >= 0; i--) {
      const soldier = soldiers[i];

      if (!soldier.active) {
        soldiers.splice(i, 1);
        continue;
      }

      soldier.move(delta);

      if (soldier.hasReachedEnd()) {
        // 攻击目标水晶：按士兵当前血量造成伤害（血量越高伤害越大）
        targetCrystal.takeDamage(soldier.getHealth());

        if (this.onSoldierHitCrystal) {
          this.onSoldierHitCrystal(soldier, targetCrystal);
        }

        soldier.destroy();
        soldiers.splice(i, 1);
      }
    }
  }
}
