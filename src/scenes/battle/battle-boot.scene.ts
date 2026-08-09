import * as Phaser from "phaser";
import {
  BATTLE_CANVAS_WIDTH,
  BATTLE_CANVAS_HEIGHT,
} from "@config/battle-constants";

export class BattleBootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "BattleBootScene" });
  }

  preload(): void {
    this.createLoadingUI();

    this.load.on("progress", (value: number) => {
      this.updateProgress(value);
    });

    this.load.on("complete", () => {
      this.loadingText.setText("加载完成！");
    });
  }

  private createLoadingUI(): void {
    const centerX = BATTLE_CANVAS_WIDTH / 2;
    const centerY = BATTLE_CANVAS_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, 400, 20, 0x34495e);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add
      .text(centerX, centerY + 50, "加载中...", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(centerX, centerY - 100, "英语单词对战游戏", {
        fontSize: "36px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  private updateProgress(value: number): void {
    this.progressBar.clear();

    const width = 400;
    const height = 20;
    const x = (BATTLE_CANVAS_WIDTH - width) / 2;
    const y = (BATTLE_CANVAS_HEIGHT - height) / 2;

    this.progressBar.fillStyle(0x3498db, 1);
    this.progressBar.fillRect(x, y, width * value, height);

    this.loadingText.setText(`加载中... ${Math.round(value * 100)}%`);
  }

  create(): void {
    this.time.delayedCall(500, () => {
      this.scene.start("BattleMenuScene");
    });
  }
}
