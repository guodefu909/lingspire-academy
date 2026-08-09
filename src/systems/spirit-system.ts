/**
 * 灵石灵光系统 —— 管理灵石和灵光的获取与消耗
 * 【作用】
 * 灵石：核心货币，用于修复道路/建筑/灵塔
 * 灵光：代表学习产出的能量，反映玩家对灵界的贡献
 * 提供增减灵石/灵光的方法，并自动广播事件
 */
import { EventBus } from "@core/event-bus";
import { StateManager } from "@core/state-manager";
export class SpiritSystem {
  /**
   * 增加灵石
   * @param amount 数量
   * @param reason 原因描述（用于日志和事件数据）
   */
  static addSpiritStones(amount: number, reason: string = ""): void {
    StateManager.batchUpdate((state) => {
      state.player.spiritStones += amount;
    });
    EventBus.emit("spirit-stone-gained", { amount, reason });
  }

  /**
   * 消耗灵石
   * @param amount 数量
   * @param reason 原因描述
   * @returns 是否消耗成功（灵石不足时返回 false）
   */
  static spendSpiritStones(amount: number, reason: string = ""): boolean {
    const current = StateManager.getState().player.spiritStones;
    if (current < amount) {
      EventBus.emit("spirit-stone-insufficient", { needed: amount, current });
      return false;
    }

    StateManager.batchUpdate((state) => {
      state.player.spiritStones -= amount;
    });
    EventBus.emit("spirit-stone-spent", { amount, reason });
    return true;
  }

  /**
   * 增加灵光值
   * @param amount 数值
   * @param reason 原因描述
   */
  static addSpiritLight(amount: number, reason: string = ""): void {
    StateManager.batchUpdate((state) => {
      state.player.spiritLight += amount;
    });
    EventBus.emit("spirit-light-gained", { amount, reason });
  }

  /** 获取当前灵石数量 */
  static getSpiritStones(): number {
    return StateManager.getState().player.spiritStones;
  }

  /** 获取当前灵光值 */
  static getSpiritLight(): number {
    return StateManager.getState().player.spiritLight;
  }
}
