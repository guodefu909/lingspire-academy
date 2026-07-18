import * as Phaser from 'phaser';
import type { CellSprite } from './CalcMatchTypes';
import { FLIP_ANIM_MS, FLIP_SHOW_MS } from './CalcMatchTypes';

/** 动画效果模块 */
export class CalcMatchAnimator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 3D翻牌动画：翻开格子 */
  flipCard3D(
    cell: CellSprite,
    flippedCell: CellSprite | null,
    flipTimer: Phaser.Time.TimerEvent | null,
    grid: (number | null)[][],
    onFlipComplete: (cell: CellSprite, flipTimer: Phaser.Time.TimerEvent | null) => void,
    onAutoUnflip: (cell: CellSprite) => void
  ): { flippedCell: CellSprite; flipTimer: Phaser.Time.TimerEvent | null } {
    // 如果有其他翻开的牌，先翻回去
    if (flippedCell && flippedCell !== cell) {
      this.unflipCard3D(flippedCell, grid);
    }

    // 清除之前的计时器
    if (flipTimer) {
      flipTimer.remove();
    }

    const newFlippedCell = cell;

    // 阶段1：遮罩从 scaleX=1 缩到 0（侧面视角）
    this.scene.tweens.add({
      targets: cell.cover,
      scaleX: 0,
      duration: FLIP_ANIM_MS / 2,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // 到侧面时切换显示
        cell.cover.setVisible(false);
        cell.coverText.setVisible(false);
        cell.text.setVisible(true);
        cell.isFlipped = true;

        // 阶段2：内容从 scaleX=0 展到 1
        cell.container.setScale(0, 1);
        this.scene.tweens.add({
          targets: cell.container,
          scaleX: 1,
          duration: FLIP_ANIM_MS / 2,
          ease: 'Quad.easeOut',
          onComplete: () => {
            // 显示1秒后翻回
            const newTimer = this.scene.time.delayedCall(FLIP_SHOW_MS, () => {
              onAutoUnflip(cell);
            });
            onFlipComplete(cell, newTimer);
          },
        });
      },
    });

    return { flippedCell: newFlippedCell, flipTimer: null };
  }

  /** 3D翻牌动画：翻回格子 */
  unflipCard3D(cell: CellSprite, grid: (number | null)[][]): void {
    if (grid[cell.row][cell.col] === null) return;

    // 阶段1：内容从 scaleX=1 缩到 0
    this.scene.tweens.add({
      targets: cell.container,
      scaleX: 0,
      duration: FLIP_ANIM_MS / 2,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // 到侧面时切换显示
        cell.text.setVisible(false);
        cell.cover.setVisible(true);
        cell.coverText.setVisible(true);
        cell.isFlipped = false;

        // 重置 cover 的 scaleX
        cell.cover.scaleX = 1;

        // 阶段2：遮罩从 scaleX=0 展到 1
        cell.container.setScale(0, 1);
        this.scene.tweens.add({
          targets: cell.container,
          scaleX: 1,
          duration: FLIP_ANIM_MS / 2,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  /** 消除格子动画 */
  eliminateCell(cell: CellSprite): void {
    this.scene.tweens.add({
      targets: cell.container,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        cell.bg.setFillStyle(0x0d1b2a, 0.3);
        cell.bg.setStrokeStyle(0);
        cell.text.setVisible(false);
        cell.cover.setVisible(false);
        cell.coverText.setVisible(false);
        cell.container.setAlpha(1);
        cell.container.setScale(1);
        cell.container.removeInteractive();
      },
    });
  }

  /** 闪烁格子 */
  flashCell(cell: CellSprite, color: number): void {
    const originalColor = 0x1a3050;
    cell.bg.setFillStyle(color, 0.7);
    this.scene.time.delayedCall(300, () => {
      cell.bg.setFillStyle(originalColor, 0.95);
      cell.bg.setStrokeStyle(2, 0x3a5a7a);
    });
  }

  /** 选中格子动画 */
  selectCell(cell: CellSprite): void {
    cell.bg.setFillStyle(0xd4a017, 1);
    cell.bg.setStrokeStyle(3, 0xffd700);
    cell.text.setColor('#1a1a00');
    // 同时改变cover颜色，使倒扣状态下选中效果也可见
    cell.cover.setFillStyle(0xd4a017, 0.9);
    cell.cover.setStrokeStyle(3, 0xffd700);
    cell.coverText.setColor('#1a1a00');
    this.scene.tweens.add({
      targets: cell.container,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 100,
      ease: 'Back.easeOut',
    });
  }

  /** 取消选中格子动画 */
  deselectCell(cell: CellSprite): void {
    cell.bg.setFillStyle(0x1a3050, 0.95);
    cell.bg.setStrokeStyle(2, 0x3a5a7a);
    cell.text.setColor('#d0e0f0');
    // 恢复cover原始颜色
    cell.cover.setFillStyle(0x2a1a3a, 0.95);
    cell.cover.setStrokeStyle(2, 0x6a4a8a);
    cell.coverText.setColor('#a080c0');
    this.scene.tweens.add({
      targets: cell.container,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
    });
  }
}
