/**
 * 资源加载场景 —— 加载所有游戏资源并显示进度条
 * 【作用】
 * 批量加载所有场景需要的图片、音频、数据文件
 * 显示加载进度条，让玩家知道加载进度
 * 加载完成后跳转到主菜单
 * 【注意】
 * 首版使用占位图形（代码生成），所以这个场景目前加载量很小
 * 后续替换正式美术资源时，这里会加载大量图片和音频
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@config/constants";
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.PRELOAD });
  }

  preload(): void {
    this.createProgressBar();
    this.loadAssets();
  }

  /**
   * 创建加载进度条
   * 在屏幕中央显示一个进度条，实时反映加载进度
   */
  private createProgressBar(): void {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const barWidth = 400;
    const barHeight = 30;

    // 进度条背景（深灰色边框）
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRect(
      centerX - barWidth / 2 - 2,
      centerY - barHeight / 2 - 2,
      barWidth + 4,
      barHeight + 4,
    );

    // 进度条填充（金色）
    const bar = this.add.graphics();

    // 加载文字
    const loadingText = this.add
      .text(centerX, centerY - 40, "灵界加载中...", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 百分比文字
    const percentText = this.add
      .text(centerX, centerY + 30, "0%", {
        fontSize: "18px",
        color: "#aaaaaa",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 监听加载进度事件
    this.load.on("progress", (value: number) => {
      // 清除旧的填充，画新的
      bar.clear();
      bar.fillStyle(0xffd700, 1);
      bar.fillRect(
        centerX - barWidth / 2,
        centerY - barHeight / 2,
        barWidth * value,
        barHeight,
      );
      percentText.setText(Math.round(value * 100) + "%");
    });

    // 监听加载完成事件
    this.load.on("complete", () => {
      bar.destroy();
      bg.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  /**
   * 加载所有游戏资源
   * 这里统一加载所有场景需要的资源，避免场景切换时卡顿
   */
  private loadAssets(): void {
    // ====== 加载关卡数据 ======
    this.load.json("island-01", "data/levels/level-01.json");
    this.load.json("island-02", "data/levels/level-02.json");

    // ====== 加载配置数据 ======
    this.load.json("player-stats", "data/characters/player-stats.json");

    // ====== 角色精灵图 ======
    // idle: 5行1列(下/左下/左/左上/上)，每帧256x256
    this.load.spritesheet(
      "player-idle",
      "characters/player-idle2.png",
      {
        frameWidth: 256,
        frameHeight: 256,
      },
    );
    // walk: 5行8列(下/左下/左/左上/上)，每帧256x256
    this.load.spritesheet(
      "player-walk",
      "characters/player-walk2.png",
      {
        frameWidth: 256,
        frameHeight: 256,
      },
    );

    // ====== 地图背景 ======
    this.load.image("map-bg", "map1.jpg");
  }

  create(): void {
    // 加载完成，跳转到主菜单
    this.scene.start(SceneKey.MAIN_MENU);
  }
}
