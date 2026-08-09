/**
 * 配置表类型定义
 */
/** 关卡配置 */
export interface ILevelConfig {
  id: string;
  name: string;
  grid: string[][];
  puzzles?: IPuzzleConfig[];
}

/** 解谜配置 */
export interface IPuzzleConfig {
  id: string;
  name: string;
  type: string;
  difficulty: number;
  knowledgePoint: string;
  config: any;
}

/** 角色属性配置 */
export interface ICharacterStatsConfig {
  hp: number;
  maxHp: number;
  speed: number;
}

/** 道具配置 */
export interface IItemConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: number;
}
