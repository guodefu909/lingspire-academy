/**
 * 游戏全局类型定义
 * 【作用】
 * 集中定义游戏中使用的 TypeScript 类型、接口、枚举
 * 供所有模块引用，保证类型安全
 */
/** 场景 key 类型 */
export type { SceneKey } from "@core/scene-manager";

/** 学习线路枚举 */
export enum LearningLine {
  /** 运算线 */
  MATH = "math",
  /** 文言文线 */
  CLASSICAL_CHINESE = "classical_chinese",
  /** 识字线 */
  LITERACY = "literacy",
  /** 英语日常用语线 */
  ENGLISH = "english",
}

/** 游戏阶段 */
export enum GamePhase {
  /** 主菜单 */
  MENU = "menu",
  /** 岛屿探索 */
  EXPLORING = "exploring",
  /** 解谜中 */
  PUZZLING = "puzzling",
  /** 修复中 */
  REPAIRING = "repairing",
  /** 结算 */
  SETTLING = "settling",
}

/** 通用键值对类型 */
export type StringMap<T> = { [key: string]: T };
