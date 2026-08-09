/**
 * 场景管理器 —— 统一管理所有场景的注册与切换
 * 【作用】Phaser 自带场景管理，但我们在外面包一层，目的是：
 * 集中定义所有场景的 key，避免字符串硬编码写错
 * 提供带过渡动画的场景切换（淡入淡出等）
 * 场景切换时自动处理暂停/恢复逻辑
 * 【类比】类似后端的路由管理器，管理页面之间的跳转
 */
import * as Phaser from "phaser";

/** 场景 key 常量 —— 所有场景名集中管理，避免拼写错误 */
export enum SceneKey {
  /** 启动场景 */
  BOOT = "BootScene",
  /** 资源加载场景 */
  PRELOAD = "PreloadScene",
  /** 主菜单场景 */
  MAIN_MENU = "MainMenuScene",
  /** 游戏主场景（岛屿探索） */
  GAME = "GameScene",
  /** 暂停场景（覆盖层） */
  PAUSE = "PauseScene",
  /** 结算场景 */
  GAME_OVER = "GameOverScene",
  /** 设置场景 */
  SETTINGS = "SettingsScene",
}

export class SceneManager {
  /** Phaser.Game 实例引用 */
  private static game: Phaser.Game;

  /**
   * 初始化场景管理器，传入 Phaser.Game 实例
   * 在游戏启动时调用一次即可
   */
  static init(game: Phaser.Game): void {
    this.game = game;
  }

  /**
   * 获取当前活跃场景
   * Phaser 没有 getActiveScene 方法，我们遍历场景列表找到当前活跃的
   */
  static getActiveScene(): Phaser.Scene | null {
    const scenes = this.game.scene.getScenes(true);
    for (const scene of scenes) {
      if (scene.scene.isActive()) {
        return scene;
      }
    }
    return null;
  }

  /**
   * 切换到指定场景（带淡出淡入过渡效果）
   * @param targetScene  目标场景的 key
   * @param duration     过渡动画时长（毫秒）
   * @param data         传递给目标场景的数据
   */
  static switchTo(
    targetScene: SceneKey,
    duration: number = 500,
    data?: any,
  ): void {
    const currentScene = this.getActiveScene();
    if (!currentScene) {
      this.game.scene.start(targetScene, data);
      return;
    }

    // 先淡出当前场景
    currentScene.cameras.main.fadeOut(duration / 2, 0, 0, 0);

    currentScene.cameras.main.once("camerafadeoutcomplete", () => {
      // 淡出完成后，切换到目标场景
      this.game.scene.start(targetScene, data);
    });
  }

  /**
   * 在当前场景上方叠加一个场景（用于暂停弹窗等）
   * @param overlayScene 要叠加的场景 key
   * @param data         传递的数据
   */
  static launchOverlay(overlayScene: SceneKey, data?: any): void {
    const currentScene = this.getActiveScene();
    if (!currentScene) return;

    // 暂停当前场景
    this.game.scene.pause(currentScene);
    // 在上方启动叠加场景
    (this.game.scene as any).launch(overlayScene, data);
  }

  /**
   * 关闭叠加场景，恢复下方场景
   * @param overlayScene 要关闭的叠加场景 key
   */
  static closeOverlay(overlayScene: SceneKey): void {
    const overlay = this.game.scene.getScene(overlayScene);
    if (!overlay) return;

    // 停止叠加场景
    this.game.scene.stop(overlayScene);

    // 恢复下方场景
    const scenes = this.game.scene.getScenes(true);
    for (const scene of scenes) {
      if (scene.scene.key !== overlayScene && scene.scene.isPaused()) {
        this.game.scene.resume(scene);
        break;
      }
    }
  }
}
