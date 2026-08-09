import * as Phaser from "phaser";
import {
  BATTLE_CANVAS_WIDTH,
  BATTLE_CANVAS_HEIGHT,
} from "@config/battle-constants";

export class BattleMenuScene extends Phaser.Scene {
  private healthSlider!: Phaser.GameObjects.Rectangle;
  private healthValue: number = 20;
  private healthLabel!: Phaser.GameObjects.Text;
  private storageKey: string = "battle_crystal_health";

  constructor() {
    super({ key: "BattleMenuScene" });
  }

  init(data: any): void {
    this.loadHealthFromStorage();
    if (data && data.crystalHealth) {
      this.healthValue = data.crystalHealth;
    }
  }

  private loadHealthFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.healthValue = parseInt(stored, 10);
      }
    } catch (e) {
      console.error("Failed to load crystal health:", e);
    }
  }

  private saveHealthToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, this.healthValue.toString());
    } catch (e) {
      console.error("Failed to save crystal health:", e);
    }
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createHealthSlider();
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x2c3e50, 1);
    bg.fillRect(0, 0, BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT);
  }

  private createTitle(): void {
    this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 120, "单词对战", {
        fontSize: "48px",
        color: "#ffd700",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 180, "English Word Battle Game", {
        fontSize: "24px",
        color: "#aaccff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  private createButtons(): void {
    const buttons = [
      { text: "开始游戏", y: 300, callback: () => this.startGame() },
      {
        text: "正确率统计",
        y: 360,
        callback: () => this.scene.start("BattleStatsScene"),
      },
      {
        text: "返回主页面",
        y: 420,
        callback: () => {
          window.location.href = "./";
        },
      },
    ];

    buttons.forEach((btn) =>
      this.createButton(btn.text, BATTLE_CANVAS_WIDTH / 2, btn.y, btn.callback),
    );
  }

  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void,
  ): void {
    const width = 220;
    const height = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x334455, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    const label = this.add
      .text(x, y, text, {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x445566, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    });

    hitArea.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x334455, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    });

    hitArea.on("pointerdown", callback);
  }

  private createHealthSlider(): void {
    this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 500, "水晶血量", {
        fontSize: "20px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const sliderBg = this.add.rectangle(
      BATTLE_CANVAS_WIDTH / 2,
      540,
      300,
      20,
      0x34495e,
    );
    sliderBg.setInteractive({ useHandCursor: true });

    const minX = BATTLE_CANVAS_WIDTH / 2 - 150;
    const maxX = BATTLE_CANVAS_WIDTH / 2 + 150;
    const initialX = minX + ((this.healthValue - 5) / 15) * (maxX - minX);

    this.healthSlider = this.add.rectangle(initialX, 540, 30, 30, 0x3498db);
    this.healthSlider.setInteractive({ useHandCursor: true, draggable: true });

    this.healthLabel = this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 580, "当前血量: " + this.healthValue, {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    this.input.setDraggable(this.healthSlider);

    this.input.on(
      "drag",
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
      ) => {
        if (gameObject === this.healthSlider) {
          const x = Phaser.Math.Clamp(dragX, minX, maxX);
          this.healthSlider.setPosition(x, 540);
          this.healthValue = Math.round(5 + ((x - minX) / (maxX - minX)) * 15);
          this.healthLabel.setText("当前血量: " + this.healthValue);
          this.saveHealthToStorage();
        }
      },
    );
  }

  private startGame(): void {
    this.saveHealthToStorage();
    this.scene.start("BattleGameScene", { crystalHealth: this.healthValue });
  }
}
