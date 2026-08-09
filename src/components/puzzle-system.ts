/**
 * 解谜系统 —— 管理解谜关卡的状态与交互
 * 【核心概念】
 * 损坏物（道路/建筑/标志/灵塔）= 关卡载体
 * 玩家走到损坏物旁边 → 触发解谜交互
 * 解谜完成 = 修复完成 → 格子变为可通行 + 奖励灵石
 * 关卡提供解谜所需灵石，不消耗玩家的灵石
 * 【职责】
 * 管理解谜状态（可挑战/进行中/已完成）
 * 创建/销毁解谜交互界面
 * 验证解谜结果，通知 RepairSystem 修复格子
 */
import { EventBus } from "@core/event-bus";
import { PuzzleConfig } from "@components/grid-map.component";
/** 解谜状态 */
export enum PuzzleState {
  /** 可挑战 */
  AVAILABLE = "available",
  /** 进行中 */
  IN_PROGRESS = "in_progress",
  /** 已完成 */
  COMPLETED = "completed",
}

export class PuzzleSystem {
  private static puzzleStates: Map<string, PuzzleState> = new Map();

  /**
   * 获取关卡状态
   * @param puzzleId 关卡 ID
   */
  static getPuzzleState(puzzleId: string): PuzzleState {
    return this.puzzleStates.get(puzzleId) ?? PuzzleState.AVAILABLE;
  }

  /**
   * 开始一个关卡
   * @param puzzle 关卡配置
   * @returns 是否成功开始
   */
  static startPuzzle(puzzle: PuzzleConfig): boolean {
    const state = this.puzzleStates.get(puzzle.id);
    if (state === PuzzleState.COMPLETED) {
      console.log(`[PuzzleSystem] 关卡已完成: ${puzzle.id}`);
      return false;
    }

    this.puzzleStates.set(puzzle.id, PuzzleState.IN_PROGRESS);
    EventBus.emit("puzzle-started", { puzzleId: puzzle.id, puzzle });

    return true;
  }

  /**
   * 完成一个关卡（由具体解谜交互逻辑调用）
   * @param puzzleId 关卡 ID
   * @param passed   是否通过
   */
  static completePuzzle(puzzleId: string, passed: boolean): void {
    if (passed) {
      this.puzzleStates.set(puzzleId, PuzzleState.COMPLETED);
    } else {
      this.puzzleStates.set(puzzleId, PuzzleState.AVAILABLE);
    }

    EventBus.emit("puzzle-completed", { puzzleId, passed });
  }

  /** 重置所有关卡状态 */
  static reset(): void {
    this.puzzleStates.clear();
  }
}
