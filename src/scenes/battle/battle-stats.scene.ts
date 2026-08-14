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
  private maxScroll: number = 0;
  private contentHeight: number = 0;

  /** 列表可视区域（顶部标题之下 → 返回按钮之上） */
  private viewportTop: number = 90;
  private viewportBottom: number = BATTLE_CANVAS_HEIGHT - 110;
  private get visibleHeight(): number { return this.viewportBottom - this.viewportTop; }

  /** 触摸/鼠标拖动状态 */
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;

  /** 滚动条 */
  private scrollbarTrack!: Phaser.GameObjects.Rectangle;
  private scrollbarThumb!: Phaser.GameObjects.Rectangle;
  private thumbWidth: number = 10;
  private thumbTop: number = 0;
  private thumbHeight: number = 0;

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

    // 裁剪列表到可视区域，避免内容溢出到标题/返回按钮之上
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(0, this.viewportTop, BATTLE_CANVAS_WIDTH, this.visibleHeight);
    this.scrollContainer.setMask(
      maskShape.createGeometryMask(),
    );

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

  /**
   * 滚动：支持鼠标滚轮 + 触摸/鼠标拖动 + 滚动条拖拽。
   * 触摸屏不再依赖 velocity，改用 pointer 位移增量，
   * 避免触摸事件 velocity 为 0 导致无法滚动的问题。
   */
  private setupScrolling(): void {
    this.maxScroll = Math.max(0, this.contentHeight - this.visibleHeight);
    if (this.maxScroll <= 0) return;

    this.createScrollbar();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.scrollY;
      this.isDragging = true;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const delta = pointer.y - this.dragStartY;
      this.setScrollY(this.dragStartScrollY + delta);
    });

    this.input.on("pointerup", () => { this.isDragging = false; });
    this.input.on("pointerupoutside", () => { this.isDragging = false; });

    this.input.on("wheel", (
      _pointer: Phaser.Input.Pointer,
      _objects: Phaser.GameObjects.GameObject[],
      _dx: number,
      dy: number,
    ) => {
      this.setScrollY(this.scrollY - dy);
    });

    // 滚动条拖拽：拖到哪，列表滚到哪
    this.scrollbarThumb.setInteractive({ useHandCursor: true, draggable: true });
    this.scrollbarThumb.on("drag", (
      _pointer: Phaser.Input.Pointer,
      dragX: number,
      dragY: number,
    ) => {
      const trackY = this.scrollbarTrack.y - this.scrollbarTrack.displayHeight / 2;
      const ratio = Phaser.Math.Clamp(
        (dragY - trackY - this.thumbHeight / 2) / this.scrollbarTrack.displayHeight,
        0, 1,
      );
      this.setScrollY(-ratio * this.maxScroll);
    });
  }

  /** 创建滚动条轨道与滑块 */
  private createScrollbar(): void {
    const trackX = BATTLE_CANVAS_WIDTH - 24;
    const trackHeight = this.visibleHeight;

    this.scrollbarTrack = this.add
      .rectangle(trackX, this.viewportTop + trackHeight / 2, 6, trackHeight, 0x000000, 0.25)
      .setOrigin(0.5, 0);

    this.thumbHeight = Math.max(
      30, trackHeight * (this.visibleHeight / this.contentHeight),
    );
    this.thumbTop = this.viewportTop;

    this.scrollbarThumb = this.add
      .rectangle(trackX, this.thumbTop + this.thumbHeight / 2, this.thumbWidth, this.thumbHeight, 0x95a5a6, 1)
      .setOrigin(0.5, 0);
  }

  /** 更新滚动位置并同步滑块 */
  private setScrollY(y: number): void {
    this.scrollY = Phaser.Math.Clamp(y, -this.maxScroll, 0);
    this.scrollContainer.setPosition(0, this.scrollY);

    if (!this.scrollbarThumb) return;
    const ratio = -this.scrollY / this.maxScroll;
    const trackHeight = this.scrollbarTrack.displayHeight;
    this.thumbTop = this.viewportTop + ratio * (trackHeight - this.thumbHeight);
    this.scrollbarThumb.setY(this.thumbTop + this.thumbHeight / 2);
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
