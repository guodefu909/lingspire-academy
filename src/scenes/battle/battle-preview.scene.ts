import * as Phaser from "phaser";
import { BATTLE_CANVAS_WIDTH, BATTLE_CANVAS_HEIGHT } from "@config/battle-constants";
import wordLibraryData from "../../data/battle/word-library.json";

/**
 * 单词预习场景 —— 展示词库全部单词（图片 + 英文 + 中文 + 读音）。
 *
 * 列表样式与"需要复习的单词"一致，支持滚轮、触摸拖动和滚动条浏览。
 */
export class BattlePreviewScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private contentHeight: number = 0;

  /** 列表可视区域 */
  private viewportTop: number = 90;
  private viewportBottom: number = BATTLE_CANVAS_HEIGHT - 110;
  private get visibleHeight(): number { return this.viewportBottom - this.viewportTop; }

  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScrollY: number = 0;

  private scrollbarTrack!: Phaser.GameObjects.Rectangle;
  private scrollbarThumb!: Phaser.GameObjects.Rectangle;
  private thumbWidth: number = 10;
  private thumbTop: number = 0;
  private thumbHeight: number = 0;

  constructor() { super({ key: "BattlePreviewScene" }); }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createWordList();
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
      .text(BATTLE_CANVAS_WIDTH / 2, 40, "单词预习", {
        fontSize: "32px", color: "#ffffff", fontFamily: "Arial",
      })
      .setOrigin(0.5);
  }

  /** 展示词库全部单词：图片 + 英文 + 中文 + 读音按钮 */
  private createWordList(): void {
    const words = wordLibraryData.words;

    this.scrollContainer = this.add.container(0, 0);

    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(0, this.viewportTop, BATTLE_CANVAS_WIDTH, this.visibleHeight);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    const startY = 100;
    const lineHeight = 40;
    this.contentHeight = words.length * lineHeight;

    words.forEach((word, index) => {
      const y = startY + index * lineHeight;
      const imgKey = `word_img_${word.word}`;
      const imgX = BATTLE_CANVAS_WIDTH / 2 - 100;

      // 白色圆形背景（与炮弹一致）
      const circle = this.add.graphics();
      circle.fillStyle(0xffffff, 1);
      circle.fillCircle(imgX, y, 17);
      circle.lineStyle(2, 0xcccccc, 0.8);
      circle.strokeCircle(imgX, y, 17);
      this.scrollContainer.add(circle);

      if (this.textures.exists(imgKey)) {
        this.scrollContainer.add(
          this.add.image(imgX, y, imgKey)
            .setDisplaySize(30, 30)
            .setOrigin(0.5),
        );
      }

      this.scrollContainer.add(
        this.add.text(BATTLE_CANVAS_WIDTH / 2 - 40, y, word.word, {
          fontSize: "20px", color: "#ffffff", fontFamily: "Arial",
        }).setOrigin(0, 0.5),
      );

      this.scrollContainer.add(
        this.add.text(BATTLE_CANVAS_WIDTH / 2 + 60, y, word.chinese, {
          fontSize: "18px", color: "#bdc3c7", fontFamily: "Arial",
        }).setOrigin(0, 0.5),
      );

      this.createSpeakButton(BATTLE_CANVAS_WIDTH / 2 + 160, y, word.word);
    });

    this.setupScrolling();
  }

  /** 读音按钮：点击朗读该单词 */
  private createSpeakButton(x: number, y: number, word: string): void {
    const button = this.add
      .text(x, y, "🔊", { fontSize: "20px" })
      .setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.speakWord(word));
    this.scrollContainer.add(button);
  }

  private speakWord(word: string): void {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }

  /** 滚动：滚轮 + 触摸/鼠标拖动 + 滚动条拖拽 */
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

    this.scrollbarThumb.setInteractive({ useHandCursor: true, draggable: true });
    this.scrollbarThumb.on("drag", (
      _pointer: Phaser.Input.Pointer,
      _dragX: number,
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
