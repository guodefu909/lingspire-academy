/**
 * 岛屿管理系统 —— 管理岛屿的解锁与切换
 * 【作用】
 * 管理岛屿解锁状态
 * 提供岛屿列表查询
 * 处理岛屿切换逻辑
 */
import { EventBus } from "@core/event-bus";
import { StateManager } from "@core/state-manager";
/** 岛屿信息 */
export interface IslandInfo {
  /** 岛屿 ID */
  id: string;
  /** 岛屿名称 */
  name: string;
  /** 是否已解锁 */
  unlocked: boolean;
  /** 是否已完成（灵塔已修复） */
  completed: boolean;
}

export class IslandSystem {
  /** 所有岛屿的注册信息 */
  private static islands: Map<string, IslandInfo> = new Map();

  /**
   * 注册一个岛屿
   * @param id      岛屿 ID
   * @param name    岛屿名称
   * @param unlocked 初始是否解锁
   */
  static registerIsland(
    id: string,
    name: string,
    unlocked: boolean = false,
  ): void {
    const state = StateManager.getState();
    const isUnlocked = state.player.unlockedIslands.includes(id) || unlocked;

    this.islands.set(id, {
      id,
      name,
      unlocked: isUnlocked,
      completed: false,
    });
  }

  /**
   * 解锁岛屿
   * @param islandId 岛屿 ID
   */
  static unlockIsland(islandId: string): void {
    const island = this.islands.get(islandId);
    if (!island) return;

    island.unlocked = true;

    StateManager.batchUpdate((state) => {
      if (!state.player.unlockedIslands.includes(islandId)) {
        state.player.unlockedIslands.push(islandId);
      }
    });

    EventBus.emit("island-unlocked", { islandId });
  }

  /**
   * 完成岛屿（灵塔修复后调用）
   * @param islandId 岛屿 ID
   */
  static completeIsland(islandId: string): void {
    const island = this.islands.get(islandId);
    if (!island) return;

    island.completed = true;

    // 解锁下一个岛屿
    const allIslands = Array.from(this.islands.values());
    const currentIndex = allIslands.findIndex((i) => i.id === islandId);
    if (currentIndex >= 0 && currentIndex < allIslands.length - 1) {
      this.unlockIsland(allIslands[currentIndex + 1].id);
    }

    EventBus.emit("island-completed", { islandId });
  }

  /**
   * 获取所有岛屿信息
   */
  static getAllIslands(): IslandInfo[] {
    return Array.from(this.islands.values());
  }

  /**
   * 获取岛屿信息
   * @param islandId 岛屿 ID
   */
  static getIsland(islandId: string): IslandInfo | null {
    return this.islands.get(islandId) ?? null;
  }

  /** 是否已解锁 */
  static isUnlocked(islandId: string): boolean {
    return this.islands.get(islandId)?.unlocked ?? false;
  }

  /** 重置 */
  static reset(): void {
    this.islands.clear();
  }
}
