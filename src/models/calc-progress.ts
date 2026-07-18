import type { CalcOperatorOption, CalcDifficultyLevel } from '../systems/puzzle-generator';

/** 运算×难度组合键，如 "add-easy" */
export type CalcLevelKey = `${string}-${string}`;

/** 生成关卡键 */
export function calcLevelKey(op: CalcOperatorOption, diff: CalcDifficultyLevel): CalcLevelKey {
  const opKey = op === '+' ? 'add' : op === '-' ? 'sub' : op === '×' ? 'mul' : 'div';
  return `${opKey}-${diff}`;
}

/** 各运算×难度的时限（秒） */
export const CALC_TIME_LIMITS: Record<CalcLevelKey, number> = {
  'add-easy': 30,      // 3×3, 4对, 数字2-9
  'add-normal': 60,    // 4×4, 8对, 数字2-19
  'add-hard': 90,      // 4×4, 8对, 翻牌
  'sub-easy': 30,
  'sub-normal': 60,
  'sub-hard': 90,
  'mul-easy': 45,       // 乘法需要更多思考时间
  'mul-normal': 75,
  'mul-hard': 100,
  'div-easy': 45,
  'div-normal': 75,
  'div-hard': 100,
};

/** 关卡进度记录（拼图系统） */
export interface CalcLevelProgress {
  /** 关卡键，如 "add-easy" */
  levelKey: CalcLevelKey;
  /** 最高星级 1-3，0=未通关 */
  bestStars: number;
  /** 最佳用时（毫秒），null=未通关 */
  bestTimeMs: number | null;
  /** 总游玩次数 */
  playCount: number;
  /** 最近游玩时间 */
  lastPlayedAt: string;
}

/** 灵算之塔心魔记录 */
export interface CalcDemon {
  /** 主键，格式: "calc-demon-{knowledgePointId}" */
  id: string;
  /** 知识点ID，如 "+-8" 或 "÷-9" */
  knowledgePointId: string;
  /** 心魔等级：1阶、2阶、3阶... */
  demonLevel: number;
  /** 累计答错次数 */
  totalWrongCount: number;
  /** 当前连续答对次数（用于化解判定） */
  consecutiveCorrectCount: number;
  /** 化解所需连续答对次数 = demonLevel * 3 */
  requiredCorrectCount: number;
  /** 是否已化解 */
  isResolved: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 正确率里程碑突破方向 */
export type AccuracyDirection = 'up' | 'down';

/** 正确率里程碑检测结果 */
export interface AccuracyMilestoneResult {
  /** 突破到的百分位整数（5的倍数），如 30 表示突破到30% */
  percent: number;
  /** 突破方向：up=向上突破，down=向下突破 */
  direction: AccuracyDirection;
}

/** 正确率里程碑快照（用于检测5%变化） */
export interface CalcAccuracySnapshot {
  /** 知识点ID */
  knowledgePointId: string;
  /** 上次记录的百分位整数（0-100），如52表示52% */
  lastMilestonePercent: number;
  /** 更新时间 */
  updatedAt: string;
}
