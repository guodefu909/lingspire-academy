/**
 * 进度管理系统 —— 跟踪玩家的游戏进度
 * 【作用】
 * 记录已完成的关卡节点
 * 计算岛屿修复进度百分比
 * 管理学习线路的选择与切换
 */
import { StateManager } from "@core/state-manager";
import { EventBus } from "@core/event-bus";
export class ProgressSystem {
  /**
   * 标记一个关卡节点为已完成
   * @param nodeId 节点 ID
   */
  static completeNode(nodeId: string): void {
    const state = StateManager.getState();
    if (state.player.completedNodes.includes(nodeId)) return;

    StateManager.batchUpdate((s) => {
      s.player.completedNodes.push(nodeId);
    });

    EventBus.emit("node-completed", { nodeId });
  }

  /**
   * 检查节点是否已完成
   * @param nodeId 节点 ID
   */
  static isNodeCompleted(nodeId: string): boolean {
    return StateManager.getState().player.completedNodes.includes(nodeId);
  }

  /**
   * 获取已完成节点数
   */
  static getCompletedNodeCount(): number {
    return StateManager.getState().player.completedNodes.length;
  }

  /**
   * 切换学习线路
   * @param line 线路标识（'math' / 'chinese' / 'literacy' / 'english'）
   */
  static switchLine(line: string): void {
    StateManager.setState("player.currentLine", line);
    EventBus.emit("line-switched", { line });
  }

  /**
   * 获取当前学习线路
   */
  static getCurrentLine(): string {
    return StateManager.getState().player.currentLine;
  }
}
