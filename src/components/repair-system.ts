/**
 * 修复系统 —— 解谜完成即修复，奖励灵石
 * 【核心逻辑】
 * 损坏物 = 关卡，走到旁边触发解谜
 * 解谜完成 = 修复完成，格子变为可通行
 * 关卡提供解谜所需灵石，不消耗玩家的灵石
 * 通过后奖励灵石给玩家
 * 【灵石流向】
 * 玩家灵石只增不减：
 * 初始灵石（进入岛屿时获得）
 * 关卡奖励灵石（通过关卡后获得）
 */
import { EventBus } from "@core/event-bus";
import { StateManager } from "@core/state-manager";
import { GridCellType, PuzzleConfig } from "@components/grid-map.component";
/** 修复结果 */
export interface RepairResult {
  /** 是否成功 */
  success: boolean;
  /** 奖励的灵石数 */
  rewardStones: number;
  /** 奖励的灵光值 */
  rewardLight: number;
}

export class RepairSystem {
  /**
   * 完成解谜并修复格子
   *
   * 【调用时机】解谜交互完成（玩家正确完成操作）后调用
   *
   * @param col 格子列
   * @param row 格子行
   * @param puzzle 该格子的关卡配置
   */
  static completeRepair(
    col: number,
    row: number,
    puzzle: PuzzleConfig,
  ): RepairResult {
    // 发放奖励灵石和灵光
    StateManager.batchUpdate((state) => {
      state.player.spiritStones += puzzle.rewardStones;
      state.player.spiritLight += puzzle.rewardLight;
      state.player.completedNodes.push(puzzle.id);
    });

    const result: RepairResult = {
      success: true,
      rewardStones: puzzle.rewardStones,
      rewardLight: puzzle.rewardLight,
    };

    // 广播修复完成事件
    EventBus.emit("repair-completed", {
      col,
      row,
      puzzleId: puzzle.id,
      result,
    });

    // 自动存档
    StateManager.save();

    return result;
  }
}
