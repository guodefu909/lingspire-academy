import * as Phaser from 'phaser';
import { CELL_SIZE, CELL_GAP } from './CalcMatchTypes';

/** 计时器与燃尽条模块 */
export class CalcMatchTimer {
  private scene: Phaser.Scene;
  private timerBar: Phaser.GameObjects.Rectangle;
  private timeLimit: number;
  private gridCols: number;

  /** 剩余时间（秒） */
  remainingTime: number;
  /** 是否超时 */
  isTimeUp: boolean = false;
  /** 超时提示文字 */
  timeUpText: Phaser.GameObjects.Text | null = null;
  /** 每秒计时器事件 */
  gameTimer!: Phaser.Time.TimerEvent;
  /** 方格偏移Y（用于定位超时提示） */
  private gridOffsetY: number;

  private onTimeUpCallback: () => void;

  constructor(
    scene: Phaser.Scene,
    timerBar: Phaser.GameObjects.Rectangle,
    gridCols: number,
    gridOffsetY: number,
    timeLimit: number,
    onTimeUpCallback: () => void
  ) {
    this.scene = scene;
    this.timerBar = timerBar;
    this.gridCols = gridCols;
    this.gridOffsetY = gridOffsetY;
    this.timeLimit = timeLimit;
    this.remainingTime = timeLimit;
    this.onTimeUpCallback = onTimeUpCallback;
  }

  /** 启动每秒计时器 */
  start(): void {
    this.gameTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => this.onTick(),
      loop: true,
    });
  }

  /** 每秒回调 */
  onTick(): void {
    this.remainingTime--;
    this.updateTimerBar();

    if (this.remainingTime <= 0) {
      this.isTimeUp = true;
      this.gameTimer.remove();
      // 确保燃尽条宽度为0且为红色
      this.timerBar.width = 0;
      this.timerBar.setFillStyle(0xff4444);
      this.onTimeUpCallback();
    }
  }

  /** 更新燃尽条宽度和颜色 */
  updateTimerBar(): void {
    const barWidth = this.gridCols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const ratio = Math.max(0, this.remainingTime / this.timeLimit);
    this.timerBar.width = barWidth * ratio;

    // 颜色变化：>50% 金色，25-50% 橙色，<25% 红色
    if (ratio > 0.5) {
      this.timerBar.setFillStyle(0xd4a017);  // 金色
    } else if (ratio > 0.25) {
      this.timerBar.setFillStyle(0xff8c00);  // 橙色
    } else {
      this.timerBar.setFillStyle(0xff4444);  // 红色
    }
  }

  /** 超时处理：显示超时提示 */
  onTimeUp(): void {
    if (!this.timeUpText) {
      const width = this.scene.cameras.main.width;
      const barY = this.gridOffsetY - CELL_SIZE / 2 - 50;
      this.timeUpText = this.scene.add.text(width / 2, barY - 20, '超时!', {
        fontSize: '18px',
        color: '#ff6b6b',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(50);
    }
  }

  /** 停止计时器 */
  stop(): void {
    if (this.gameTimer) this.gameTimer.remove();
  }
}
