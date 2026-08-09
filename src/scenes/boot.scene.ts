/**
 * 启动场景 —— 游戏的第一个场景
 * 【作用】
 * 初始化 Phaser 引擎的全局配置
 * 检测设备能力（如是否支持 WebGL）
 * 设置游戏的全局默认值
 * 完成后自动跳转到资源加载场景
 * 【类比】类似后端应用的 Bootstrap 阶段，做最基础的初始化
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
export class BootScene extends Phaser.Scene {
  constructor() {
    // 场景的 key，必须与 SceneKey 枚举一致
    super({ key: SceneKey.BOOT });
  }

  /**
   * preload —— 场景的生命周期方法
   * 在场景创建前自动调用，用于加载本场景需要的资源
   * Boot 场景通常不需要加载资源，但可以加载加载界面的资源
   */
  preload(): void {
    // 暂无需要预加载的资源
  }

  /**
   * create —— 场景的生命周期方法
   * 在 preload 完成后调用，用于创建游戏对象和初始化逻辑
   */
  create(): void {
    // 检测渲染器类型
    const rendererType =
      this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer
        ? "WebGL"
        : "Canvas";
    console.log(`[BootScene] 渲染器: ${rendererType}`);

    // 阻止方向键和空格键的默认浏览器行为（如页面滚动）
    this.input.keyboard!.addCapture([32, 37, 38, 39, 40]);

    // 启动资源加载场景
    this.scene.start(SceneKey.PRELOAD);
  }
}
