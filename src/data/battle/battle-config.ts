/**
 * 对战游戏配置接口和默认值。
 *
 * 可通过 BattleGameManager 构造函数传入 Partial<BattleConfig> 覆盖默认值。
 */
export interface BattleConfig {
  crystal: { initialHealth: number; maxHealth: number };
  soldier: { initialHealth: number; maxHealth: number; speed: number };
  /** 出兵：初始间隔 → 最终间隔，按游戏进度线性递减 */
  spawn: { initialInterval: number; finalInterval: number };
  /** 单词图片 CDN 基础路径（模板 {base} 替换为实际值） */
  word: { imageBaseUrl: string };
  bullet: { speed: number; maxDisplayCount: number; maxCapacity: number };
  game: { duration: number };
  ai: { errorRate: number };
}

export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  crystal: { initialHealth: 5, maxHealth: 5 },
  soldier: { initialHealth: 1, maxHealth: 5, speed: 40 },
  spawn: { initialInterval: 10000, finalInterval: 3000 },
  word: { imageBaseUrl: "words/" },
  bullet: { speed: 300, maxDisplayCount: 10, maxCapacity: 100 },
  game: { duration: 5 * 60 * 1000 },
  ai: { errorRate: 0.05 },
};
