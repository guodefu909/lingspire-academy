import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BattleBullet } from "../../entities/battle/battle-bullet";
import { CombatSystem } from "./combat.system";

/**
 * AI 系统 —— 控制敌方自动发射炮弹攻击玩家士兵。
 *
 * 每 2 秒执行一次行动：优先攻击进度最靠前的玩家士兵。
 * 有一定概率故意打错（errorRate），模拟"不太聪明"的对手。
 */
export class AISystem {
  /** 故意打错的概率 0~1 */
  private errorRate: number;
  /** 敌方水晶 */
  private crystal: BattleCrystal;
  private combatSystem: CombatSystem;
  /** 上次行动的时间戳 */
  private lastActionTime: number = 0;
  /** 行动间隔 ms */
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

  /** 选择进度最靠前的未锁定目标 */
  selectTarget(soldiers: BattleSoldier[]): BattleSoldier | null {
    if (soldiers.length === 0) return null;

    const enemySoldiers = soldiers.filter((s) => s.active);
    if (enemySoldiers.length === 0) return null;

    // 进度越大越靠近玩家水晶 → 优先攻击
    const frontSoldier = enemySoldiers.reduce((closest, current) => {
      return current.getPathProgress() > closest.getPathProgress()
        ? current : closest;
    });

    return frontSoldier;
  }

  /** 随机判定是否故意犯错 */
  shouldMakeError(): boolean {
    return Math.random() < this.errorRate;
  }

  /**
   * 每帧调用：到达行动间隔后，
   * ① 错误分支 → 随机选一个单词不同的士兵开枪
   * ② 正确分支 → 优先找单词匹配的士兵，否则攻击最靠前的
   */
  update(time: number, enemySoldiers: BattleSoldier[]): BattleBullet | null {
    // 未到行动间隔或炮塔无弹则跳过
    if (time - this.lastActionTime < this.actionInterval) return null;
    if (!this.crystal.getTurret().hasBullets()) return null;

    const playerSoldiers = enemySoldiers.filter(
      (s) => s.active && s.getIsPlayerOwned(),
    );
    if (playerSoldiers.length === 0) return null;

    const target = this.selectTarget(playerSoldiers);
    if (!target) return null;

    const bullet = this.crystal.getFrontBullet();
    if (!bullet) return null;

    let launchedBullet: BattleBullet | null = null;

    if (this.shouldMakeError()) {
      // 故意打错：随机选单词不匹配的士兵
      const wrongTargets = playerSoldiers.filter(
        (s) => s.active && s.getWord() !== bullet.getWord(),
      );
      if (wrongTargets.length > 0) {
        const randomTarget = wrongTargets[Math.floor(Math.random() * wrongTargets.length)];
        launchedBullet = this.combatSystem.launchBullet(this.crystal, randomTarget);
      }
    } else {
      // 正确选择：优先单词匹配的士兵
      const correctTargets = playerSoldiers.filter(
        (s) => s.active && s.getWord() === bullet.getWord(),
      );
      if (correctTargets.length > 0) {
        launchedBullet = this.combatSystem.launchBullet(this.crystal, correctTargets[0]);
      } else {
        launchedBullet = this.combatSystem.launchBullet(this.crystal, target);
      }
    }

    this.lastActionTime = time;
    return launchedBullet;
  }

  setActionInterval(interval: number): void { this.actionInterval = interval; }
  setErrorRate(rate: number): void { this.errorRate = rate; }
}
