import * as Phaser from "phaser";
import { PathType } from "@config/battle-constants";
import { PathManager } from "../../managers/battle/path.manager";

export class BattleSoldier extends Phaser.GameObjects.Container {
  private word: string;
  private emoji: string;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private pathType: PathType;
  private pathProgress: number;
  private pathManager: PathManager;
  private wordText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;
  private background: Phaser.GameObjects.Graphics;
  private isPlayerOwned: boolean;
  private hasStartedMoving: boolean = false;
  private fadeInProgress: number = 0;
  private invisibleDuration: number = 700;
  private fadeInDuration: number = 300;
  private locked: boolean = false;

  constructor(
    scene: Phaser.Scene,
    word: string,
    emoji: string,
    pathType: PathType,
    pathManager: PathManager,
    maxHealth: number = 5,
    speed: number = 60,
    isPlayerOwned: boolean = true,
  ) {
    super(scene, 0, 0);

    this.word = word;
    this.emoji = emoji;
    this.pathType = pathType;
    this.pathManager = pathManager;
    this.maxHealth = maxHealth;
    this.health = 1;

    // 根据路径类型调整速度，使各路到达时间相同
    // 上路和下路长度：640 + 640 = 1280
    // 中路长度：sqrt(320^2 + 320^2) * 2 ≈ 905
    // 中路速度 = 基础速度 * 905 / 1280 ≈ 0.707
    if (pathType === PathType.MIDDLE) {
      this.speed = speed * 0.707;
    } else {
      this.speed = speed;
    }

    this.isPlayerOwned = isPlayerOwned;
    this.hasStartedMoving = false;

    this.pathProgress = this.isPlayerOwned ? 0 : 1;

    this.setAlpha(0);

    // 敌方士兵在上层，玩家士兵在下层
    this.setDepth(this.isPlayerOwned ? 1 : 2);

    this.background = scene.add.graphics();
    this.wordText = scene.add
      .text(0, 0, word, {
        fontSize: "18px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#333333",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);

    this.healthBar = scene.add.graphics();

    this.add([this.background, this.wordText, this.healthBar]);

    this.drawBackground();
    this.updateHealthBar();

    // 根据所属方设置初始位置
    if (this.isPlayerOwned) {
      const startPos = pathManager.getPositionOnPath(pathType, 0);
      this.setPosition(startPos.x, startPos.y);
    } else {
      const startPos = pathManager.getPositionOnPath(pathType, 1);
      this.setPosition(startPos.x, startPos.y);
    }

    this.setInteractive(
      new Phaser.Geom.Rectangle(-30, -30, 60, 60),
      Phaser.Geom.Rectangle.Contains,
    );

    scene.add.existing(this);
  }

  private drawBackground(): void {
    this.background.clear();

    // 根据所属方使用不同颜色
    const bgColor = this.isPlayerOwned ? 0x4a90e2 : 0xe24a4a;

    this.background.fillStyle(bgColor, 0.8);
    this.background.fillRoundedRect(-30, -25, 60, 50, 8);
    this.background.lineStyle(2, 0xffffff, 0.6);
    this.background.strokeRoundedRect(-30, -25, 60, 50, 8);
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const barWidth = 50;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;

    this.healthBar.fillStyle(0x333333, 1);
    this.healthBar.fillRect(-barWidth / 2, 20, barWidth, barHeight);

    const healthColor =
      healthPercent > 0.5
        ? 0x4caf50
        : healthPercent > 0.25
          ? 0xffc107
          : 0xf44336;
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(
      -barWidth / 2,
      20,
      barWidth * healthPercent,
      barHeight,
    );
  }

  move(delta: number): void {
    // 淡入效果
    if (this.fadeInProgress < this.invisibleDuration + this.fadeInDuration) {
      this.fadeInProgress += delta;

      if (this.fadeInProgress < this.invisibleDuration) {
        // 完全不显示阶段
        this.setAlpha(0);
      } else {
        // 淡入阶段
        const fadeInTime = this.fadeInProgress - this.invisibleDuration;
        const alpha = Math.min(1, fadeInTime / this.fadeInDuration);
        this.setAlpha(alpha);
      }
    }

    const pathLength = this.pathManager.getPathLength(this.pathType);
    const progressDelta = (this.speed * delta) / 1000 / pathLength;

    // 标记已经开始移动
    if (!this.hasStartedMoving) {
      this.hasStartedMoving = true;
    }

    // 根据所属方决定移动方向
    if (this.isPlayerOwned) {
      // 玩家士兵向终点移动（从左下到右上）
      this.pathProgress = Math.min(1, this.pathProgress + progressDelta);
    } else {
      // 敌方士兵向起点移动（从右上到左下，反向）
      this.pathProgress = Math.max(0, this.pathProgress - progressDelta);
    }

    const newPos = this.pathManager.getPositionOnPath(
      this.pathType,
      this.pathProgress,
    );
    this.setPosition(newPos.x, newPos.y);
  }

  hasReachedEnd(): boolean {
    // 只有开始移动后才检测碰撞
    if (!this.hasStartedMoving) {
      return false;
    }

    if (this.isPlayerOwned) {
      // 玩家士兵到达右上角
      return this.pathProgress >= 1;
    } else {
      // 敌方士兵到达左下角
      return this.pathProgress <= 0;
    }
  }

  takeDamage(): void {
    this.health = Math.max(0, this.health - 1);
    this.updateHealthBar();

    if (this.health <= 0) {
      this.onDeath();
    }
  }

  heal(): void {
    if (this.health < this.maxHealth) {
      this.health++;
      this.updateHealthBar();
    }
  }

  private onDeath(): void {
    this.scene.events.emit("soldier-died", this);
    this.destroy();
  }

  getHealth(): number {
    return this.health;
  }

  getWord(): string {
    return this.word;
  }

  getEmoji(): string {
    return this.emoji;
  }

  getPathProgress(): number {
    return this.pathProgress;
  }

  getIsPlayerOwned(): boolean {
    return this.isPlayerOwned;
  }

  lock(): void {
    this.locked = true;
  }

  isLocked(): boolean {
    return this.locked;
  }
}
