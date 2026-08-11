import * as Phaser from "phaser";
import { BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT } from "@config/battle-constants";
import { WordStatsManager } from "../../managers/battle/word-stats.manager";

/**
 * 单词正确率统计场景 —— 从 localStorage 读取历史答题数据并展示。
 *
 * 按正确率升序排列（最需复习的在前），支持滚动浏览。
 * 单词 / 正确率（颜色编码）/ 正确次数 / 错误次数 四列居中显示。
 */
export class BattleStatsScene extends Phaser.Scene {
  private statsManager = new WordStatsManager();
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private contentHeight: number = 0;

  constructor() { super({ key: "BattleStatsScene" }); }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createStatsList();
    this.createBackButton();
  }

  private createBackground(): void {
    this.add.rectangle(
      BATTLE_CANVAS_WIDTH / 2, BATTLE_CANVAS_HEIGHT / 2,
      BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT, 0x2c3e50,
    );
  }

  private createTitle(): void {
    this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 40, "单词正确率统计", {
        fontSize: "32px", color: "#ffffff", fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  /**
   * 从 localStorage 读取所有单词统计，按正确率升序排列，
   * 显示单词 / 正确率(颜色编码) / 正确次数 / 错误次数。
   * 支持滚轮和触摸滑动浏览。
   */
  private createStatsList(): void {
    const allStats = this.getAllStats();

    if (allStats.length === 0) {
      this.add.text(BATTLE_CANVAS_WIDTH / 2, BATTLE_CANVAS_HEIGHT / 2, "暂无学习记录", {
        fontSize: "24px", color: "#bdc3c7", fontFamily: "Arial",
      }).setOrigin(0.5);
      return;
    }

    // 按正确率升序排列（最需要复习的在前）
    const sortedStats = allStats.sort((a, b) => {
      const accA = a.correctCount / (a.correctCount + a.wrongCount) || 0;
      const accB = b.correctCount / (b.correctCount + b.wrongCount) || 0;
      return accA - accB;
    });

    this.scrollContainer = this.add.container(0, 0);

    const startY = 100;
    const lineHeight = 40;
    this.contentHeight = sortedStats.length * lineHeight;

    // 四列居中排列：单词 | 正确率 | 正确次数 | 错误次数
    sortedStats.forEach((stat, index) => {
      const y = startY + index * lineHeight;
      const accuracy = stat.correctCount + stat.wrongCount > 0
        ? Math.round((stat.correctCount / (stat.correctCount + stat.wrongCount)) * 100)
        : 0;

      this.scrollContainer.add(
        this.add.text(BATTLE_CANVAS_WIDTH / 2 - 200, y, stat.word, {
          fontSize: "18px", color: "#ffffff", fontFamily: "Arial",
        }),
      );
      this.scrollContainer.add(
        this.add.text(BATTLE_CANVAS_WIDTH / 2 - 80, y, accuracy + "%", {
          fontSize: "18px",
          color: accuracy >= 80 ? "#2ecc71" : accuracy >= 50 ? "#f39c12" : "#e74c3c",
          fontFamily: "Arial",
        }),
      );
      this.scrollContainer.add(
        this.add.text(BATTLE_CANVAS_WIDTH / 2 + 20, y, "正确: " + stat.correctCount, {
          fontSize: "18px", color: "#2ecc71", fontFamily: "Arial",
        }),
      );
      this.scrollContainer.add(
        this.add.text(BATTLE_CANVAS_WIDTH / 2 + 140, y, "错误: " + stat.wrongCount, {
          fontSize: "18px", color: "#e74c3c", fontFamily: "Arial",
        }),
      );
    });

    this.setupScrolling();
  }

  private getAllStats(): Array<{ word: string; correctCount: number; wrongCount: number }> {
    const stored = localStorage.getItem("battle_word_stats");
    if (stored) return JSON.parse(stored);
    return [];
  }

  /** 支持鼠标拖动和滚轮滚动浏览长列表 */
  private setupScrolling(): void {
    if (this.contentHeight <= BATTLE_CANVAS_HEIGHT - 150) return;

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.y < BATTLE_CANVAS_HEIGHT - 100) {
        this.scrollY = Phaser.Math.Clamp(
          this.scrollY + pointer.velocity.y * 0.05,
          -(this.contentHeight - BATTLE_CANVAS_HEIGHT + 200), 0,
        );
        this.scrollContainer.setPosition(0, this.scrollY);
      }
    });

    this.input.on("wheel", (
      pointer: Phaser.Input.Pointer,
      gameObjects: Phaser.GameObjects.GameObject[],
      deltaX: number,
      deltaY: number,
    ) => {
      this.scrollY = Phaser.Math.Clamp(
        this.scrollY - deltaY * 0.5,
        -(this.contentHeight - BATTLE_CANVAS_HEIGHT + 200), 0,
      );
      this.scrollContainer.setPosition(0, this.scrollY);
    });
  }

  private createBackButton(): void {
    const width = 220, height = 50;
    const x = BATTLE_CANVAS_WIDTH / 2, y = BATTLE_CANVAS_HEIGHT - 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x334455, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    this.add.text(x, y, "返回", {
      fontSize: "24px", color: "#ffffff", fontFamily: "Arial",
    }).setOrigin(0.5);

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
    hitArea.on("pointerdown", () => { this.scene.start("BattleMenuScene"); });
  }
}
