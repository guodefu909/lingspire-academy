export type CalcOperator = '+' | '-' | '×' | '÷';

export interface CalcPair {
  a: number;
  b: number;
  result: number;
  operator: CalcOperator;
}

/**
 * 目标展示：
 * - 简单/困难：givenA + □ = result（给一个运算数+结果，找另一个运算数）
 * - 普通：□ + □ = result（给结果，找两个运算数）
 */
export interface CalcTarget {
  result: number;
  operator: CalcOperator;
  /** 已给出的运算数A（简单/困难模式有值，普通模式为null） */
  givenA: number | null;
  /** 已给出的运算数B（简单/困难模式有值，普通模式为null） */
  givenB: number | null;
  /** 用户需要找的答案数（简单/困难模式下是单个数，普通模式为null） */
  answer: number | null;
}

export interface CalcPuzzle {
  pairs: CalcPair[];
  grid: (number | null)[][];
  targetQueue: CalcTarget[];
  gridCols: number;
  gridRows: number;
  /** 困难模式下格子初始倒扣 */
  faceDown: boolean;
}

export interface DifficultyConfig {
  id: string;
  label: string;
  digitLevel: 1 | 2 | 3;
  operators: CalcOperator[];
  numberRange: [number, number];
  pairCount: number;
  gridCols: number;
  gridRows: number;
  grade: string;
  /** 简单/普通：给2/3元素；普通：给1/3元素 */
  showGiven: boolean;
  /** 困难：格子倒扣，点击翻转2秒后翻回 */
  faceDown: boolean;
}

