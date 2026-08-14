import * as Phaser from "phaser";
import { BattleGameManager } from "../../managers/battle/battle-game.manager";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT, VictoryResult } from "@config/battle-constants";

/**
 * 战斗游戏主场景 —— 绘制地图、UI、管理游戏流程。
 *
 * 布局：地图背景铺满（768×768 居中），右侧竖排三个按钮。
 * 炮塔展示在各自水晶附近，由 BattleCrystal 管理。
 */
export class BattleGameScene extends Phaser.Scene {
  private battleManager!: BattleGameManager;
  private timeText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;
  private discardButton!: Phaser.GameObjects.Text;
  private fullscreenButton!: Phaser.GameObjects.Text;
  private helpButton!: Phaser.GameObjects.Text;
  private tooltip!: Phaser.GameObjects.Text;
  private helpModal!: Phaser.GameObjects.Container;
  private isPaused: boolean = false;
  private isHelpOpen: boolean = false;
  private crystalHealth: number = 20;

  constructor() { super({ key: "BattleGameScene" }); }

  init(data: any): void {
    if (data && data.crystalHealth) this.crystalHealth = data.crystalHealth;
  }

  create(): void {
    this.createMap();
    this.createUI();
    this.initBattleManager();
    this.setupInput();
    this.battleManager.startGame();
    this.autoShowHelpIfFirstTime();
  }

  /** 绘制地图背景图片（已缩放到 768×768，居中显示） */
  private createMap(): void {
    this.add.image(
      BATTLE_CANVAS_WIDTH / 2, BATTLE_CANVAS_HEIGHT / 2, "battle-map",
    ).setDepth(0);
  }

  /**
   * 创建游戏 UI：
   * 顶部居中倒计时 | 右侧竖排三按钮（全屏/暂停/换弹）|
   * 换弹按钮悬停时在左侧显示提示文字。
   */
  private createUI(): void {
    // 倒计时
    this.timeText = this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 30, "05:00", {
        fontSize: "24px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#333333", padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);

    // 换弹提示（悬停显示）
    this.tooltip = this.add
      .text(0, 0, "丢弃当前炮弹，装填下一枚炮弹", {
        fontSize: "14px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#2c3e50", padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0.5);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(100);

    // 右侧按钮群 —— 地图右边空白区居中，按钮组上下居中
    const rightX = BATTLE_CANVAS_WIDTH - 64;
    const centerY = BATTLE_CANVAS_HEIGHT / 2;
    const buttonGap = 50;

    // 玩法按钮
    this.helpButton = this.add
      .text(rightX, centerY - buttonGap * 1.5, "玩法", {
        fontSize: "16px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#9b59b6", padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0.5);
    this.helpButton.setInteractive({ useHandCursor: true });
    this.helpButton.on("pointerdown", () => this.toggleHelp());

    // 全屏按钮
    this.fullscreenButton = this.add
      .text(rightX, centerY - buttonGap * 0.5, "全屏", {
        fontSize: "16px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#3498db", padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0.5);
    this.fullscreenButton.setInteractive({ useHandCursor: true });
    this.fullscreenButton.on("pointerdown", () => this.toggleFullscreen());

    // 暂停按钮
    this.pauseButton = this.add
      .text(rightX, centerY + buttonGap * 0.5, "暂停", {
        fontSize: "16px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#e74c3c", padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0.5);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerdown", () => this.togglePause());

    // 换弹按钮
    this.discardButton = this.add
      .text(rightX, centerY + buttonGap * 1.5, "换弹", {
        fontSize: "16px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#f39c12", padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0.5);
    this.discardButton.setInteractive({ useHandCursor: true });
    this.discardButton.on("pointerdown", () => this.discardBullet());

    // 换弹按钮悬停提示（显示在按钮左侧）
    this.discardButton.on("pointerover", () => {
      this.tooltip.setPosition(
        this.discardButton.x - this.discardButton.width - 10,
        this.discardButton.y,
      );
      this.tooltip.setVisible(true);
    });
    this.discardButton.on("pointerout", () => { this.tooltip.setVisible(false); });

    this.createHelpModal();
  }

  /** 创建玩法说明弹窗（默认隐藏） */
  private createHelpModal(): void {
    const width = 720;
    const height = 460;
    const cx = BATTLE_CANVAS_WIDTH / 2;
    const cy = BATTLE_CANVAS_HEIGHT / 2;

    this.helpModal = this.add.container(cx, cy);

    // 半透明遮罩 + 弹窗背景
    const overlay = this.add.rectangle(0, 0, BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT, 0x000000, 0.6);
    const panel = this.add.rectangle(0, 0, width, height, 0x2c3e50, 1);
    panel.setStrokeStyle(2, 0xffd700, 1);

    const title = this.add
      .text(0, -height / 2 + 45, "游戏玩法", {
        fontSize: "28px", color: "#ffd700", fontFamily: "Arial", fontStyle: "bold",
      })
      .setOrigin(0.5);

    const lines = [
      "1. 敌军和己方士兵从双方水晶出发，胸前带有单词图片。",
      "2. 点击敌方士兵即可发射炮弹，单词图片匹配即可消灭。",
      "3. 点错会让该士兵血条增加，其抵达己方水晶时造成更多伤害。",
      "4. 士兵血量越高，抵达时扣己方水晶血越多，己方血条归零则失败。",
      "5. 在时限内击毁敌方水晶即获胜，答错单词会记入复习列表。",
    ];
    const content = this.add
      .text(0, -height / 2 + 90, lines.join("\n"), {
        fontSize: "18px", color: "#ffffff", fontFamily: "Arial",
        lineSpacing: 14, wordWrap: { width: width - 120 },
      })
      .setOrigin(0.5, 0);

    // 关闭按钮
    const closeBtn = this.add
      .text(0, height / 2 - 45, "我知道了", {
        fontSize: "20px", color: "#ffffff", fontFamily: "Arial",
        backgroundColor: "#3498db", padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.toggleHelp());

    this.helpModal.add([overlay, panel, title, content, closeBtn]);
    this.helpModal.setDepth(200);
    this.helpModal.setVisible(false);
  }

  /** 打开/关闭玩法说明弹窗（打开时暂停游戏，并记录已查看状态） */
  private toggleHelp(): void {
    this.isHelpOpen = !this.isHelpOpen;
    this.helpModal.setVisible(this.isHelpOpen);

    if (this.isHelpOpen) {
      this.battleManager.pauseGame();
      try { localStorage.setItem("battle_help_seen", "1"); } catch (e) {}
    } else if (!this.isPaused) {
      this.battleManager.resumeGame();
    }
  }

  /** 首次进入游戏时自动弹出玩法说明（后续仅手动点击） */
  private autoShowHelpIfFirstTime(): void {
    try {
      if (localStorage.getItem("battle_help_seen")) return;
    } catch (e) {
      return;
    }
    this.toggleHelp();
  }

  private initBattleManager(): void {
    const config = { crystal: { initialHealth: this.crystalHealth, maxHealth: this.crystalHealth } };
    this.battleManager = new BattleGameManager(this, config as any);
    this.events.once("game-ended", (result: VictoryResult) => { this.handleGameEnd(result); });
  }

  /** 点击敌军士兵 → 发射炮弹 */
  private setupInput(): void {
    this.input.on("gameobjectdown", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof BattleSoldier) this.handleSoldierClick(gameObject);
    });
  }

  private handleSoldierClick(soldier: BattleSoldier): void {
    if (this.isPaused) return;
    if (!soldier.getIsPlayerOwned()) this.battleManager.handlePlayerClick(soldier);
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

  /** 使用 Phaser 内置全屏 API（兼容移动端） */
  private toggleFullscreen(): void {
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
      this.fullscreenButton.setText("退出");
    } else {
      this.scale.stopFullscreen();
      this.fullscreenButton.setText("全屏");
    }
  }

  private handleGameEnd(result: VictoryResult): void {
    const wrongWords = this.battleManager.getWrongWords();
    this.scene.start("BattleResultScene", { result, wrongWords, crystalHealth: this.crystalHealth });
  }

  private discardBullet(): void {
    if (!this.isPaused) this.battleManager.discardBullet();
  }

  /** 每帧驱动游戏逻辑 + 刷新倒计时 */
  update(time: number, delta: number): void {
    if (!this.battleManager || this.isPaused) return;
    this.battleManager.update(time, delta);
    this.updateTimeDisplay();
  }

  private updateTimeDisplay(): void {
    this.timeText.setText(this.battleManager.getVictorySystem().getFormattedTime());
  }
}
