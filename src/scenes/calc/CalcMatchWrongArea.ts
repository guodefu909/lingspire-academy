import * as Phaser from 'phaser';
import { CELL_SIZE, CELL_GAP } from './CalcMatchTypes';

/** 错题区域模块 */
export class CalcMatchWrongArea {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private wrongList: string[] = [];
  private wrongTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 创建错题区域 */
  create(width: number, gridOffsetY: number, gridRows: number): void {
    const areaY = gridOffsetY + gridRows * (CELL_SIZE + CELL_GAP) + 40;
    this.container = this.scene.add.container(width / 2, areaY);

    // 半透明深色背景框
    const bgHeight = 90;
    const bg = this.scene.add.rectangle(0, bgHeight / 2, 440, bgHeight, 0x0d1b2a, 0.7)
      .setStrokeStyle(1, 0x3a2a2a);
    this.container.add(bg);

    // 标题
    const title = this.scene.add.text(0, 8, '错题记录', {
      fontSize: '14px',
      color: '#6a5a5a',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(title);
  }

  /** 添加一条错题 */
  add(text: string): void {
    const wrongText = `✕ ${text}`;

    // 最多3条，超出的移除最旧的
    if (this.wrongList.length >= 3) {
      this.wrongList.shift();
      const oldest = this.wrongTexts.shift();
      if (oldest) oldest.destroy();
    }

    this.wrongList.push(wrongText);
    this.refreshDisplay();
  }

  /** 刷新错题区域的文本显示 */
  private refreshDisplay(): void {
    // 移除旧文本
    for (const t of this.wrongTexts) {
      t.destroy();
    }
    this.wrongTexts = [];

    // 重新创建文本
    const startY = 26;
    const lineGap = 20;
    for (let i = 0; i < this.wrongList.length; i++) {
      const textObj = this.scene.add.text(0, startY + i * lineGap, this.wrongList[i], {
        fontSize: '16px',
        color: '#ff8888',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.container.add(textObj);
      this.wrongTexts.push(textObj);
    }
  }
}