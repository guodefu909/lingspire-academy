/**
 * 游戏总管理器 —— 整个游戏的中枢
 * 【作用】
 * 创建 Phaser.Game 实例，启动游戏引擎
 * 持有各子管理器的引用，统筹全局
 * 管理游戏的生命周期：初始化、暂停、恢复、销毁
 * 【类比】类似后端 Spring 的 ApplicationContext，是整个应用的容器
 */
import * as Phaser from "phaser";
import { GAME_CONFIG } from "@config/game-config";
import { SceneManager, SceneKey } from "./scene-manager";
import { StateManager } from "./state-manager";
import { EventBus } from "./event-bus";
export class GameManager {
  /** Phaser.Game 实例，整个游戏引擎的核心 */
  private static game: Phaser.Game | null = null;

  /**
   * 启动游戏
   * 创建 Phaser.Game 实例，初始化各管理器
   */
  static start(): void {
    // 尝试读取存档
    StateManager.load();

    // 创建 Phaser 游戏实例
    this.game = new Phaser.Game(GAME_CONFIG);

    // 初始化场景管理器
    SceneManager.init(this.game);

    // 监听游戏获得/失去焦点（切换标签页时自动暂停/恢复）
    this.setupVisibilityHandler();

    console.log("[GameManager] 游戏已启动");
  }

  /** 处理页面可见性变化（切换标签页时暂停/恢复游戏） */
  private static setupVisibilityHandler(): void {
    document.addEventListener("visibilitychange", () => {
      if (!this.game) return;

      if (document.hidden) {
        // 页面不可见时，如果正在游戏中，触发暂停
        const activeScene = this.game.scene
          .getScenes(true)
          .find((s) => s.scene.isActive());
        if (activeScene && activeScene.scene.key === SceneKey.GAME) {
          EventBus.emit("game-auto-pause");
        }
      }
    });
  }

  /** 获取 Phaser.Game 实例 */
  static getGame(): Phaser.Game | null {
    return this.game;
  }

  /** 暂停游戏 */
  static pause(): void {
    if (this.game) {
      this.game.scene.pause(SceneKey.GAME);
    }
  }

  /** 恢复游戏 */
  static resume(): void {
    if (this.game) {
      this.game.scene.resume(SceneKey.GAME);
    }
  }

  /** 销毁游戏实例（彻底关闭） */
  static destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    EventBus.clear();
  }
}
