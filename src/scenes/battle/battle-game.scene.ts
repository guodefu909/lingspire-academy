import * as Phaser from "phaser";
import { BattleGameManager } from "../../managers/battle/battle-game.manager";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import {
  VictoryResult,
  BATTLE_MAP_SIZE,
  BATTLE_MAP_OFFSET_X,
  BATTLE_MAP_OFFSET_Y,
  BATTLE_CANVAS_WIDTH,
  BATTLE_CANVAS_HEIGHT,
} from "@config/battle-constants";

export class BattleGameScene extends Phaser.Scene {
  private battleManager!: BattleGameManager;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private timeText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;
  private discardButton!: Phaser.GameObjects.Text;
  private tooltip!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private crystalHealth: number = 20;

  constructor() {
    super({ key: "BattleGameScene" });
  }

  init(data: any): void {
    if (data && data.crystalHealth) {
      this.crystalHealth = data.crystalHealth;
    }
  }

  create(): void {
    this.createMap();
    this.createUI();
    this.initBattleManager();
    this.setupInput();

    this.battleManager.startGame();
  }

  private createMap(): void {
    this.mapGraphics = this.add.graphics();

    this.mapGraphics.fillStyle(0x2c3e50, 1);
    this.mapGraphics.fillRect(0, 0, BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT);

    this.mapGraphics.fillStyle(0x34495e, 1);
    this.mapGraphics.fillRect(
      BATTLE_MAP_OFFSET_X,
      BATTLE_MAP_OFFSET_Y,
      BATTLE_MAP_SIZE,
      BATTLE_MAP_SIZE,
    );

    this.mapGraphics.lineStyle(2, 0x5d6d7e, 1);
    this.mapGraphics.strokeRect(
      BATTLE_MAP_OFFSET_X,
      BATTLE_MAP_OFFSET_Y,
      BATTLE_MAP_SIZE,
      BATTLE_MAP_SIZE,
    );

    this.drawPaths();
  }

  private drawPaths(): void {
    const pathColor = 0x5d6d7e;

    this.mapGraphics.lineStyle(4, pathColor, 0.6);

    this.mapGraphics.beginPath();
    this.mapGraphics.moveTo(
      BATTLE_MAP_OFFSET_X + 80,
      BATTLE_MAP_OFFSET_Y + 720,
    );
    this.mapGraphics.lineTo(BATTLE_MAP_OFFSET_X + 80, BATTLE_MAP_OFFSET_Y + 80);
    this.mapGraphics.lineTo(
      BATTLE_MAP_OFFSET_X + 720,
      BATTLE_MAP_OFFSET_Y + 80,
    );
    this.mapGraphics.strokePath();

    this.mapGraphics.beginPath();
    this.mapGraphics.moveTo(
      BATTLE_MAP_OFFSET_X + 80,
      BATTLE_MAP_OFFSET_Y + 720,
    );
    this.mapGraphics.lineTo(
      BATTLE_MAP_OFFSET_X + 400,
      BATTLE_MAP_OFFSET_Y + 400,
    );
    this.mapGraphics.lineTo(
      BATTLE_MAP_OFFSET_X + 720,
      BATTLE_MAP_OFFSET_Y + 80,
    );
    this.mapGraphics.strokePath();

    this.mapGraphics.beginPath();
    this.mapGraphics.moveTo(
      BATTLE_MAP_OFFSET_X + 80,
      BATTLE_MAP_OFFSET_Y + 720,
    );
    this.mapGraphics.lineTo(
      BATTLE_MAP_OFFSET_X + 720,
      BATTLE_MAP_OFFSET_Y + 720,
    );
    this.mapGraphics.lineTo(
      BATTLE_MAP_OFFSET_X + 720,
      BATTLE_MAP_OFFSET_Y + 80,
    );
    this.mapGraphics.strokePath();
  }

  private createUI(): void {
    this.timeText = this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 30, "05:00", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#333333",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);

    this.tooltip = this.add
      .text(0, 0, "丢弃当前炮弹，装填下一枚炮弹", {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#2c3e50",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0, 0.5);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(100);

    this.discardButton = this.add
      .text(20, BATTLE_CANVAS_HEIGHT - 40, "换弹", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#f39c12",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0, 0.5);

    this.discardButton.setInteractive({ useHandCursor: true });
    this.discardButton.on("pointerdown", () => this.discardBullet());

    this.discardButton.on("pointerover", () => {
      this.tooltip.setPosition(
        this.discardButton.x + this.discardButton.width + 10,
        this.discardButton.y,
      );
      this.tooltip.setVisible(true);
    });

    this.discardButton.on("pointerout", () => {
      this.tooltip.setVisible(false);
    });

    this.pauseButton = this.add
      .text(BATTLE_CANVAS_WIDTH - 20, 30, "暂停", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#e74c3c",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0.5);

    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerdown", () => this.togglePause());
  }

  private initBattleManager(): void {
    const config = {
      crystal: {
        initialHealth: this.crystalHealth,
        maxHealth: this.crystalHealth,
      },
    };

    this.battleManager = new BattleGameManager(this, config as any);

    this.events.once("game-ended", (result: VictoryResult) => {
      this.handleGameEnd(result);
    });
  }

  private setupInput(): void {
    this.input.on(
      "gameobjectdown",
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        if (gameObject instanceof BattleSoldier) {
          this.handleSoldierClick(gameObject);
        }
      },
    );
  }

  private handleSoldierClick(soldier: BattleSoldier): void {
    if (this.isPaused) {
      return;
    }

    if (!soldier.getIsPlayerOwned()) {
      this.battleManager.handlePlayerClick(soldier);
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.battleManager.pauseGame();
      this.pauseButton.setText("继续");
    } else {
      this.battleManager.resumeGame();
      this.pauseButton.setText("暂停");
    }
  }

  private handleGameEnd(result: VictoryResult): void {
    const wrongWords = this.battleManager.getWrongWords();
    this.scene.start("BattleResultScene", {
      result,
      wrongWords,
      crystalHealth: this.crystalHealth,
    });
  }

  private discardBullet(): void {
    if (!this.isPaused) {
      this.battleManager.discardBullet();
    }
  }

  update(time: number, delta: number): void {
    if (!this.battleManager || this.isPaused) {
      return;
    }

    this.battleManager.update(time, delta);

    this.updateTimeDisplay();
  }

  private updateTimeDisplay(): void {
    const victorySystem = this.battleManager.getVictorySystem();
    this.timeText.setText(victorySystem.getFormattedTime());
  }
}
