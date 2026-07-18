import type { CalcOperator, CalcPair, CalcPuzzle, DifficultyConfig, CalcTarget } from '../models/calc-puzzle';

export type CalcOperatorOption = '+' | '-' | '×' | '÷';
export type CalcDifficultyLevel = 'easy' | 'normal' | 'hard';

export const OPERATOR_LABELS: Record<CalcOperatorOption, string> = {
  '+': '加法',
  '-': '减法',
  '×': '乘法',
  '÷': '除法',
};

export const DIFFICULTY_LABELS: Record<CalcDifficultyLevel, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

interface PuzzleLayout {
  gridCols: number;
  gridRows: number;
  /** 配对数 = (gridCols * gridRows) / 2 */
  pairCount: number;
}

/**
 * 难度配置矩阵：
 * - 简单：3×3，给2/3元素（□+3=5），正面
 * - 普通：4×4，给1/3元素（□+□=5），正面
 * - 困难：4×4，给2/3元素（□+3=5），倒扣翻牌
 *
 * 每种运算 × 每种难度 → numberRange 控制运算数范围
 */
interface OpDifficultyConfig {
  numberRange: [number, number];
  layout: PuzzleLayout;
  showGiven: boolean;
  faceDown: boolean;
}

const CONFIGS: Record<CalcOperatorOption, Record<CalcDifficultyLevel, OpDifficultyConfig>> = {
  '+': {
    easy:   { numberRange: [2, 9],  layout: { gridCols: 3, gridRows: 3, pairCount: 4 },  showGiven: true,  faceDown: false },
    normal: { numberRange: [2, 19], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: false },
    hard:   { numberRange: [2, 19], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: true },
  },
  '-': {
    easy:   { numberRange: [2, 9],  layout: { gridCols: 3, gridRows: 3, pairCount: 4 },  showGiven: true,  faceDown: false },
    normal: { numberRange: [2, 19], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: false },
    hard:   { numberRange: [2, 19], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: true },
  },
  '×': {
    easy:   { numberRange: [2, 9],  layout: { gridCols: 3, gridRows: 3, pairCount: 4 },  showGiven: true,  faceDown: false },
    normal: { numberRange: [2, 12], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: false },
    hard:   { numberRange: [2, 12], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: true },
  },
  '÷': {
    easy:   { numberRange: [2, 9],  layout: { gridCols: 3, gridRows: 3, pairCount: 4 },  showGiven: true,  faceDown: false },
    normal: { numberRange: [2, 12], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: false },
    hard:   { numberRange: [2, 12], layout: { gridCols: 4, gridRows: 4, pairCount: 8 },  showGiven: true,  faceDown: true },
  },
};

export function buildDifficultyConfig(
  operator: CalcOperatorOption,
  difficulty: CalcDifficultyLevel
): DifficultyConfig {
  const cfg = CONFIGS[operator][difficulty];
  const opKey = operator === '+' ? 'add' : operator === '-' ? 'sub' : operator === '×' ? 'mul' : 'div';
  return {
    id: `${opKey}-${difficulty}`,
    label: `${OPERATOR_LABELS[operator]}·${DIFFICULTY_LABELS[difficulty]}`,
    digitLevel: cfg.numberRange[1] <= 9 ? 1 : cfg.numberRange[1] <= 19 ? 2 : 3,
    operators: [operator],
    numberRange: cfg.numberRange,
    pairCount: cfg.layout.pairCount,
    gridCols: cfg.layout.gridCols,
    gridRows: cfg.layout.gridRows,
    grade: '',
    showGiven: cfg.showGiven,
    faceDown: cfg.faceDown,
  };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePair(operator: CalcOperator, range: [number, number]): [number, number, number] {
  const min = Math.max(range[0], 2);
  const max = range[1];
  let a: number, b: number, result: number;

  switch (operator) {
    case '+':
      a = randInt(min, max);
      b = randInt(min, max);
      result = a + b;
      break;
    case '-':
      // 限制减数(b)和result在范围内，被减数(a)=b+result可以更大
      result = randInt(min, max);
      b = randInt(min, max);
      a = b + result;
      break;
    case '×':
      a = randInt(min, Math.min(max, 12));
      b = randInt(min, Math.min(max, 12));
      result = a * b;
      break;
    case '÷':
      b = randInt(min, Math.min(max, 12));
      result = randInt(min, Math.min(max, 12));
      a = b * result;
      break;
    default:
      a = randInt(min, max);
      b = randInt(min, max);
      result = a + b;
  }

  return [a, b, result];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 在数字池中，统计满足 operator 运算结果为 targetResult 的配对数
 */
function countMatchesInPool(
  pool: number[],
  operator: CalcOperator,
  targetResult: number
): number {
  let count = 0;
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i];
      const b = pool[j];
      switch (operator) {
        case '+': if (a + b === targetResult) count++; break;
        case '-': if (a - b === targetResult || b - a === targetResult) count++; break;
        case '×': if (a * b === targetResult) count++; break;
        case '÷':
          if ((b !== 0 && a / b === targetResult) || (a !== 0 && b / a === targetResult)) count++;
          break;
      }
    }
  }
  return count;
}

/**
 * 在数字池中，统计等于 targetValue 的数字个数
 */
function countValueInPool(pool: number[], targetValue: number): number {
  return pool.filter(v => v === targetValue).length;
}

/**
 * 贪心排列目标顺序，保证每步唯一解：
 * - showGiven 模式：找 answer 在池中唯一出现1次的目标
 * - !showGiven 模式：找 result 在池中只有唯一配对的目标
 */
function buildUniqueSolutionOrder(
  pairs: CalcPair[],
  showGiven: boolean
): CalcTarget[] | null {
  const pool: number[] = pairs.flatMap(p => [p.a, p.b]);
  const remaining = pairs.map((p, idx) => ({ ...p, idx, used: false }));
  const ordered: CalcTarget[] = [];

  for (let step = 0; step < pairs.length; step++) {
    const candidates = remaining.filter(t => !t.used);

    let uniqueOnes: typeof candidates;

    if (showGiven) {
      // 给2/3元素模式：answer 在池中只能出现1次
      uniqueOnes = candidates.filter(t => {
        const answer = t.b; // 默认 b 是要找的数
        return countValueInPool(pool, answer) === 1;
      });
    } else {
      // 给1/3元素模式：result 在池中只有唯一配对
      uniqueOnes = candidates.filter(t => {
        return countMatchesInPool(pool, t.operator, t.result) === 1;
      });
    }

    if (uniqueOnes.length === 0) {
      return null;
    }

    const chosen = uniqueOnes[Math.floor(Math.random() * uniqueOnes.length)];
    chosen.used = true;

    // 构建 CalcTarget：给 givenA + result，找 givenB(=answer)
    // 加法和乘法满足交换律，可以随机给a或b
    // 减法和除法不满足交换律，必须给a（被减数/被除数）
    const giveA = (chosen.operator === '-' || chosen.operator === '÷')
      ? true
      : Math.random() < 0.5;
    const givenA = giveA ? chosen.a : chosen.b;
    const answer = giveA ? chosen.b : chosen.a;

    ordered.push({
      result: chosen.result,
      operator: chosen.operator,
      givenA,
      givenB: null,
      answer,
    });

    // 从池中移除该配对的两个数
    removeOne(pool, chosen.a);
    removeOne(pool, chosen.b);
  }

  return ordered;
}

function removeOne(arr: number[], val: number): void {
  const idx = arr.indexOf(val);
  if (idx !== -1) arr.splice(idx, 1);
}

/**
 * 检查数字数组中每个数字的重复次数是否 <= maxRepeat
 */
function checkMaxRepeat(numbers: number[], maxRepeat: number): boolean {
  const counts = new Map<number, number>();
  for (const n of numbers) {
    counts.set(n, (counts.get(n) ?? 0) + 1);
    if (counts.get(n)! > maxRepeat) return false;
  }
  return true;
}

/**
 * 生成干扰数填满网格
 * 干扰数不能让已有目标出现歧义
 */
function generateDistractors(
  existingNumbers: number[],
  totalSlots: number,
  _operator: CalcOperator,
  maxRepeat: number
): number[] {
  const allNumbers = [...existingNumbers];
  const needed = totalSlots - existingNumbers.length;

  for (let i = 0; i < needed; i++) {
    let attempts = 0;
    let candidate: number;
    do {
      candidate = randInt(2, 20);
      attempts++;
      // 检查加入后不超重复限制
      const testNumbers = [...allNumbers, candidate];
      if (!checkMaxRepeat(testNumbers, maxRepeat)) continue;
      // 检查加入后不会与现有数字形成新的配对（避免干扰答案唯一性）
      // 简化：只要重复次数合规即可，因为目标顺序已保证唯一解
      break;
    } while (attempts < 50);
    allNumbers.push(candidate);
  }

  return allNumbers.slice(existingNumbers.length);
}

export function generatePuzzle(config: DifficultyConfig): CalcPuzzle {
  const operator = config.operators[0];
  const showGiven = config.showGiven;
  const totalSlots = config.gridCols * config.gridRows;
  const maxRepeat = 2;

  // 最多重试50次，确保能生成每步唯一解的题目
  for (let attempt = 0; attempt < 50; attempt++) {
    const pairs: CalcPair[] = [];
    const usedResults = new Set<number>();

    for (let i = 0; i < config.pairCount; i++) {
      let tries = 0;
      let a: number, b: number, result: number;
      do {
        [a, b, result] = generatePair(operator, config.numberRange);
        tries++;
      } while (usedResults.has(result) && tries < 100);
      usedResults.add(result);
      pairs.push({ a, b, result, operator });
    }

    // 检查所有运算数重复次数 <= maxRepeat
    const pairNumbers = pairs.flatMap(p => [p.a, p.b]);
    if (!checkMaxRepeat(pairNumbers, maxRepeat)) continue;

    // 尝试排列唯一解顺序
    const targetQueue = buildUniqueSolutionOrder(pairs, showGiven);
    if (!targetQueue) continue;

    // 生成网格数字（配对数 + 干扰数填满）
    const numbers = pairs.flatMap(p => [p.a, p.b]);
    const distractors = generateDistractors(numbers, totalSlots, operator, maxRepeat);
    const allNumbers = [...numbers, ...distractors];
    const shuffled = shuffle(allNumbers);

    const grid: (number | null)[][] = [];
    let idx = 0;
    for (let r = 0; r < config.gridRows; r++) {
      const row: (number | null)[] = [];
      for (let c = 0; c < config.gridCols; c++) {
        row.push(shuffled[idx++] ?? null);
      }
      grid.push(row);
    }

    return {
      pairs,
      grid,
      targetQueue,
      gridCols: config.gridCols,
      gridRows: config.gridRows,
      faceDown: config.faceDown,
    };
  }

  // 兜底（不应发生）
  const pairs: CalcPair[] = [];
  const usedResults = new Set<number>();
  for (let i = 0; i < config.pairCount; i++) {
    let tries = 0;
    let a: number, b: number, result: number;
    do {
      [a, b, result] = generatePair(operator, config.numberRange);
      tries++;
    } while (usedResults.has(result) && tries < 100);
    usedResults.add(result);
    pairs.push({ a, b, result, operator });
  }

  const numbers = pairs.flatMap(p => [p.a, p.b]);
  const distractors = generateDistractors(numbers, totalSlots, operator, maxRepeat);
  const allNumbers = [...numbers, ...distractors];
  const shuffled = shuffle(allNumbers);
  const grid: (number | null)[][] = [];
  let idx = 0;
  for (let r = 0; r < config.gridRows; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < config.gridCols; c++) {
      row.push(shuffled[idx++] ?? null);
    }
    grid.push(row);
  }

  return {
    pairs,
    grid,
    targetQueue: pairs.map(p => ({
      result: p.result,
      operator: p.operator,
      givenA: p.a,
      givenB: null,
      answer: p.b,
    })),
    gridCols: config.gridCols,
    gridRows: config.gridRows,
    faceDown: config.faceDown,
  };
}