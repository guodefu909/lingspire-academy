import { db } from './db';
import type { CalcLevelProgress, CalcDemon, AccuracyMilestoneResult } from '../models/calc-progress';
import type { CalcLevelKey } from '../models/calc-progress';

export class CalcProgressStore {

  // ========== 关卡进度（拼图系统） ==========

  /** 获取指定关卡的进度 */
  async getLevelProgress(levelKey: CalcLevelKey): Promise<CalcLevelProgress | undefined> {
    return db.calcLevelProgressStore.get(levelKey) as Promise<CalcLevelProgress | undefined>;
  }

  /** 获取所有关卡进度 */
  async getAllLevelProgress(): Promise<CalcLevelProgress[]> {
    return db.calcLevelProgressStore.toArray() as Promise<CalcLevelProgress[]>;
  }

  /** 更新关卡进度（通关后调用） */
  async updateLevelProgress(
    levelKey: CalcLevelKey,
    stars: number,
    timeMs: number
  ): Promise<CalcLevelProgress> {
    const existing = await db.calcLevelProgressStore.get(levelKey);
    const now = new Date().toISOString();

    if (existing) {
      const updated = {
        ...existing,
        bestStars: Math.max(existing.bestStars, stars),
        bestTimeMs: existing.bestTimeMs !== null ? Math.min(existing.bestTimeMs, timeMs) : timeMs,
        playCount: existing.playCount + 1,
        lastPlayedAt: now,
      };
      await db.calcLevelProgressStore.put(updated);
      return updated as CalcLevelProgress;
    }

    const record = {
      levelKey,
      bestStars: stars,
      bestTimeMs: timeMs,
      playCount: 1,
      lastPlayedAt: now,
    };
    await db.calcLevelProgressStore.put(record);
    return record as CalcLevelProgress;
  }

  /** 获取已获得的拼图数（2星及以上） */
  async getEarnedPuzzleCount(): Promise<number> {
    const all = await db.calcLevelProgressStore.toArray();
    return all.filter(p => p.bestStars >= 2).length;
  }

  /** 获取金色拼图数（3星） */
  async getGoldPuzzleCount(): Promise<number> {
    const all = await db.calcLevelProgressStore.toArray();
    return all.filter(p => p.bestStars >= 3).length;
  }

  // ========== 心魔系统 ==========

  /** 获取心魔 */
  async getCalcDemon(knowledgePointId: string): Promise<CalcDemon | undefined> {
    const id = `calc-demon-${knowledgePointId}`;
    return db.calcDemonStore.get(id) as Promise<CalcDemon | undefined>;
  }

  /** 获取所有活跃心魔 */
  async getActiveCalcDemons(): Promise<CalcDemon[]> {
    return db.calcDemonStore
      .filter(d => !d.isResolved)
      .toArray() as Promise<CalcDemon[]>;
  }

  /** 获取所有可见心魔（totalWrongCount >= 3 且未化解） */
  async getVisibleCalcDemons(): Promise<CalcDemon[]> {
    return db.calcDemonStore
      .filter(d => d.totalWrongCount >= 3 && !d.isResolved)
      .toArray() as Promise<CalcDemon[]>;
  }

  /** 记录答错 — 可能创建或升级心魔 */
  async recordWrong(knowledgePointId: string): Promise<CalcDemon> {
    const id = `calc-demon-${knowledgePointId}`;
    const existing = await db.calcDemonStore.get(id);
    const now = new Date().toISOString();

    if (existing && !existing.isResolved) {
      // 已有心魔：重置连续答对计数，增加错误次数
      const newWrongCount = existing.totalWrongCount + 1;

      // 检查是否需要升级心魔
      // 升级条件：答错次数达到 demonLevel * 3 的2倍
      // 1阶心魔：3次错误创建，6次错误升级2阶，12次错误升级3阶...
      let newLevel = existing.demonLevel;
      const upgradeThreshold = existing.demonLevel * 3 * 2; // 1阶→6, 2阶→12, 3阶→24
      if (newWrongCount >= upgradeThreshold) {
        newLevel = existing.demonLevel + 1;
      }

      const updated = {
        ...existing,
        demonLevel: newLevel,
        totalWrongCount: newWrongCount,
        consecutiveCorrectCount: 0,
        requiredCorrectCount: newLevel * 3,
        updatedAt: now,
      };
      await db.calcDemonStore.put(updated);
      return updated as CalcDemon;
    }

    if (existing && existing.isResolved) {
      // 已化解的心魔，答错后重新激活为1阶
      const reactivated = {
        ...existing,
        demonLevel: 1,
        totalWrongCount: existing.totalWrongCount + 1,
        consecutiveCorrectCount: 0,
        requiredCorrectCount: 3,
        isResolved: false,
        updatedAt: now,
      };
      await db.calcDemonStore.put(reactivated);
      return reactivated as CalcDemon;
    }

    // 新建心魔（首次答错就创建记录，totalWrongCount=1）
    // 心魔创建条件：totalWrongCount >= 3 时才算"加入心魔系统"
    // 在UI展示时，只展示 totalWrongCount >= 3 的心魔
    const demon = {
      id,
      knowledgePointId,
      demonLevel: 1,
      totalWrongCount: 1,
      consecutiveCorrectCount: 0,
      requiredCorrectCount: 3,
      isResolved: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.calcDemonStore.put(demon);
    return demon as CalcDemon;
  }

  /** 记录答对 — 可能化解心魔 */
  async recordCorrect(knowledgePointId: string): Promise<CalcDemon | undefined> {
    const id = `calc-demon-${knowledgePointId}`;
    const existing = await db.calcDemonStore.get(id);
    if (!existing || existing.isResolved) return undefined;

    const now = new Date().toISOString();
    const newConsecutive = existing.consecutiveCorrectCount + 1;

    // 检查是否化解：连续答对次数 >= 化解所需次数
    if (newConsecutive >= existing.requiredCorrectCount && existing.totalWrongCount >= 3) {
      const resolved = {
        ...existing,
        consecutiveCorrectCount: newConsecutive,
        isResolved: true,
        updatedAt: now,
      };
      await db.calcDemonStore.put(resolved);
      return resolved as CalcDemon;
    }

    // 未化解，更新连续答对次数
    const updated = {
      ...existing,
      consecutiveCorrectCount: newConsecutive,
      updatedAt: now,
    };
    await db.calcDemonStore.put(updated);
    return updated as CalcDemon;
  }

  /** 判断心魔是否"可见"（totalWrongCount >= 3 且未化解） */
  isDemonVisible(demon: CalcDemon): boolean {
    return demon.totalWrongCount >= 3 && !demon.isResolved;
  }

  // ========== 正确率里程碑 ==========

  /** 检查并更新正确率里程碑，返回5%一档的突破结果（如果跨越了5%边界），否则返回null */
  async checkAccuracyMilestone(
    knowledgePointId: string,
    currentAccuracy: number // 0-1之间
  ): Promise<AccuracyMilestoneResult | null> {
    const currentPercent = Math.floor(currentAccuracy * 100);
    const currentBucket = Math.floor(currentPercent / 5);
    const milestonePercent = currentBucket * 5; // 5%档位值（5的倍数）
    const existing = await db.calcAccuracySnapshotStore.get(knowledgePointId);

    if (existing) {
      // lastMilestonePercent 是5的倍数，直接除以5得到档位索引
      const existingBucket = existing.lastMilestonePercent / 5;

      if (currentBucket > existingBucket) {
        // 向上突破5%边界
        await db.calcAccuracySnapshotStore.put({
          knowledgePointId,
          lastMilestonePercent: milestonePercent,
          updatedAt: new Date().toISOString(),
        });
        return { percent: milestonePercent, direction: 'up' };
      }

      if (currentBucket < existingBucket) {
        // 向下突破5%边界
        await db.calcAccuracySnapshotStore.put({
          knowledgePointId,
          lastMilestonePercent: milestonePercent,
          updatedAt: new Date().toISOString(),
        });
        return { percent: milestonePercent, direction: 'down' };
      }

      // 没有跨越5%边界，不更新快照
      return null;
    }

    // 首次记录：存储当前5%档位，但不触发里程碑
    await db.calcAccuracySnapshotStore.put({
      knowledgePointId,
      lastMilestonePercent: milestonePercent,
      updatedAt: new Date().toISOString(),
    });
    return null;
  }
}