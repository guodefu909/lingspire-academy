import * as Phaser from 'phaser';
import type { AccuracyMilestoneResult } from '../../models/calc-progress';

/** Toast队列系统模块 */
export class CalcMatchToast {
  private scene: Phaser.Scene;
  private toastAreaY: number;
  private queue: { text: string; color: string; fontSize: string }[] = [];
  private isShowing: boolean = false;

  constructor(scene: Phaser.Scene, toastAreaY: number) {
    this.scene = scene;
    this.toastAreaY = toastAreaY;
  }

  /** 将Toast加入队列，依次错开显示 */
  enqueue(text: string, color: string, fontSize: string = '28px'): void {
    this.queue.push({ text, color, fontSize });
    if (!this.isShowing) {
      this.processQueue();
    }
  }

  /** 处理Toast队列，逐条显示 */
  private processQueue(): void {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const item = this.queue.shift()!;
    this.showToast(item.text, item.color, item.fontSize);
  }

  /** 显示单条Toast：弹跳→停留→飘走淡出，完成后处理下一条 */
  private showToast(text: string, color: string, fontSize: string): void {
    const width = this.scene.cameras.main.width;
    const startY = this.toastAreaY;

    const toast = this.scene.add.text(width / 2, startY, text, {
      fontSize,
      color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(120);

    // 弹跳放大
    this.scene.tweens.add({
      targets: toast,
      scale: { from: 0.5, to: 1.2 },
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: toast,
          scale: 1,
          duration: 100,
        });
      },
    });

    // 停留后飘走淡出
    this.scene.tweens.add({
      targets: toast,
      alpha: 0,
      y: startY - 60,
      duration: 800,
      delay: 600,
      ease: 'Quad.easeIn',
      onComplete: () => {
        toast.destroy();
        // 300ms后显示下一条
        this.scene.time.delayedCall(300, () => this.processQueue());
      },
    });
  }

  /** 连击 Toast */
  showCombo(combo: number): void {
    this.enqueue(`${combo} 连击!`, '#ffd700');
  }

  /** 正确率突破Toast */
  showAccuracy(result: AccuracyMilestoneResult): void {
    const isUp = result.direction === 'up';
    const icon = isUp ? '▲' : '▼';
    const color = isUp ? '#44ff88' : '#ff6b6b';
    const label = isUp ? '正确率突破' : '正确率降至';
    const text = `${label} ${result.percent}% ${icon}`;
    this.enqueue(text, color, '22px');
  }
}
