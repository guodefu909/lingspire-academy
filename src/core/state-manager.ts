/**
 * 全局状态管理器 —— 集中管理游戏运行时的所有数据
 * 【作用】就像后端的 Session / 全局数据库，存储：
 * 玩家数据（灵石数量、已解锁岛屿等）
 * 游戏进度（当前岛屿、已完成关卡等）
 * 设置数据（音量、画质等）
 * 【设计原则】
 * 所有状态集中管理，任何模块通过 getState 读取，通过 setState 修改
 * 修改状态时自动通过 EventBus 广播通知，方便 UI 等模块响应更新
 * 支持持久化到 localStorage，下次打开游戏自动恢复
 */
import { EventBus } from "./event-bus";
import { SAVE_KEY } from "@config/constants";

/** 玩家数据结构 */
export interface PlayerState {
  /** 玩家显示名称 */
  name: string;
  /** 灵石数量（核心货币/资源） */
  spiritStones: number;
  /** 灵光值（代表学习产出的能量） */
  spiritLight: number;
  /** 已解锁的岛屿ID列表 */
  unlockedIslands: string[];
  /** 已完成的关卡节点ID列表 */
  completedNodes: string[];
  /** 当前选择的学习线路 */
  currentLine: string;
}

/** 游戏设置数据结构 */
export interface GameSettings {
  /** 背景音乐音量 0~1 */
  bgmVolume: number;
  /** 音效音量 0~1 */
  sfxVolume: number;
  /** 是否显示网格辅助线（调试用） */
  showGrid: boolean;
}

/** 全局状态总结构 */
export interface GameState {
  /** 玩家数据 */
  player: PlayerState;
  /** 游戏设置 */
  settings: GameSettings;
  /** 当前所在岛屿ID */
  currentIslandId: string | null;
  /** 游戏是否正在进行中 */
  isPlaying: boolean;
}

/**
 * 状态管理器 —— 单例模式
 *
 * 【用法示例】
 * // 读取玩家灵石数量
 * const stones = StateManager.getState().player.spiritStones;
 *
 * // 修改灵石数量（会自动广播事件 + 自动存档）
 * StateManager.setState('player.spiritStones', 10);
 */
export class StateManager {
  /** 全局状态对象 */
  private static state: GameState = StateManager.createDefaultState();
  /** 创建默认初始状态 */
  private static createDefaultState(): GameState {
    return {
      player: {
        name: "灵界旅者",
        spiritStones: 0,
        spiritLight: 0,
        unlockedIslands: ["island-01"],
        completedNodes: [],
        currentLine: "math",
      },
      settings: {
        bgmVolume: 0.7,
        sfxVolume: 1.0,
        showGrid: false,
      },
      currentIslandId: null,
      isPlaying: false,
    };
  }

  /**
   * 获取完整状态对象的只读副本
   * 【注意】返回的是深拷贝，修改它不会影响真实状态
   */
  static getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * 通过路径设置状态值
   * @param path  状态路径，如 'player.spiritStones'
   * @param value 新值
   *
   * 【用法】
   *   StateManager.setState('player.spiritStones', 10);
   *   StateManager.setState('settings.bgmVolume', 0.5);
   */
  static setState(path: string, value: any): void {
    const keys = path.split(".");
    let current: any = this.state;

    // 沿路径逐层深入，直到倒数第二层
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) {
        console.warn(`[StateManager] 路径不存在: ${path}`);
        return;
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // 广播状态变更事件，方便 UI 等模块响应
    EventBus.emit("state-changed", {
      path,
      oldValue,
      newValue: value,
    });

    // 同时广播路径专属事件，如 'state-changed:player.spiritStones'
    EventBus.emit(`state-changed:${path}`, {
      oldValue,
      newValue: value,
    });
  }

  /**
   * 批量更新状态（减少多次 setState 的广播开销）
   * @param updater 接收当前状态，直接修改它，修改完后统一广播
   *
   * 【用法】
   *   StateManager.batchUpdate(state => {
   *     state.player.spiritStones += 5;
   *     state.player.spiritLight += 10;
   *   });
   */
  static batchUpdate(updater: (state: GameState) => void): void {
    updater(this.state);
    EventBus.emit("state-batch-updated", this.getState());
  }

  /** 将当前状态保存到 localStorage */
  static save(): void {
    try {
      const json = JSON.stringify(this.state);
      localStorage.setItem(SAVE_KEY, json);
      EventBus.emit("game-saved");
    } catch (e) {
      console.error("[StateManager] 存档失败:", e);
    }
  }

  /** 从 localStorage 读取存档 */
  static load(): boolean {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return false;
      this.state = JSON.parse(json);
      EventBus.emit("game-loaded");
      return true;
    } catch (e) {
      console.error("[StateManager] 读档失败:", e);
      return false;
    }
  }

  /** 重置为初始状态（新游戏） */
  static reset(): void {
    this.state = this.createDefaultState();
    localStorage.removeItem(SAVE_KEY);
    EventBus.emit("game-reset");
  }
}
