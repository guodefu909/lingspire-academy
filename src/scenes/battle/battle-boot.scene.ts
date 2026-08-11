import * as Phaser from "phaser";
import { BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT } from "@config/battle-constants";
import { DEFAULT_BATTLE_CONFIG } from "../../data/battle/battle-config";
import wordLibraryData from "../../data/battle/word-library.json";

/**
 * 对战启动场景 —— 预加载所有对战资源（单词图片、地图、精灵图）。
 *
 * 资源全部加载完成后自动跳转到菜单场景。
 */
export class BattleBootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: "BattleBootScene" }); }

  /** 预加载阶段：加载进度条 UI → 加载所有图片资源 */
  preload(): void {
    this.createLoadingUI();

    this.load.on("progress", (value: number) => this.updateProgress(value));
    this.load.on("complete", () => { this.loadingText.setText("加载完成！"); });

    const imageBaseUrl = DEFAULT_BATTLE_CONFIG.word.imageBaseUrl;

    // 加载单词图片（PNG格式）
    wordLibraryData.words.forEach((w) => {
      this.load.image(`word_img_${w.word}`, w.imageUrl.replace("{base}", imageBaseUrl));
    });

    // 加载对战地图和士兵精灵图
    this.load.image("battle-map", "单词对战地图-1.png");
    this.load.spritesheet("soldier-walk", "soldier-walk.png", {
      frameWidth: 256, frameHeight: 256,
    });
  }

  private createLoadingUI(): void {
    const centerX = BATTLE_CANVAS_WIDTH / 2;
    const centerY = BATTLE_CANVAS_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, 400, 20, 0x34495e);
    this.progressBar = this.add.graphics();
    this.loadingText = this.add
      .text(centerX, centerY + 50, "加载中...", {
        fontSize: "24px", color: "#ffffff", fontFamily: "Arial",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 100, "英语单词对战游戏", {
        fontSize: "36px", color: "#ffffff", fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  private updateProgress(value: number): void {
    this.progressBar.clear();
    const width = 400, height = 20;
    const x = (BATTLE_CANVAS_WIDTH - width) / 2;
    const y = (BATTLE_CANVAS_HEIGHT - height) / 2;
    this.progressBar.fillStyle(0x3498db, 1);
    this.progressBar.fillRect(x, y, width * value, height);
    this.loadingText.setText(`加载中... ${Math.round(value * 100)}%`);
  }

  /** 资源就绪后短暂延迟再跳转菜单 */
  create(): void {
    this.time.delayedCall(300, () => { this.scene.start("BattleMenuScene"); });
  }
}
