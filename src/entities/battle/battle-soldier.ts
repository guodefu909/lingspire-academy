import * as Phaser from "phaser";
import { PathType } from "@config/battle-constants";
import { PathManager } from "../../managers/battle/path.manager";

export class BattleSoldier extends Phaser.GameObjects.Container {
  private word: string;
  private imageUrl: string;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private pathType: PathType;
  private pathProgress: number;
  private pathManager: PathManager;
  private sprite: Phaser.GameObjects.Sprite;
  private wordText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;
  private isPlayerOwned: boolean;
  private hasStartedMoving: boolean = false;
  private fadeInProgress: number = 0;
  private invisibleDuration: number = 700;
  private fadeInDuration: number = 300;
  private locked: boolean = false;
  private prevX: number = 0;
  private prevY: number = 0;
  private frameIndex: number = 0;
  private frameTimer: number = 0;
  private animBaseFrame: number = 32;

  constructor(
    scene: Phaser.Scene,
    word: string,
    imageUrl: string,
    pathType: PathType,
    pathManager: PathManager,
    maxHealth: number = 5,
    speed: number = 60,
    isPlayerOwned: boolean = true,
  ) {
    super(scene, 0, 0);

    this.word = word;
    this.imageUrl = imageUrl;
    this.pathType = pathType;
    this.pathManager = pathManager;
    this.maxHealth = maxHealth;
    this.health = 1;

    if (pathType === PathType.MIDDLE) {
      this.speed = speed * 0.707;
    } else {
      this.speed = speed;
    }

    this.isPlayerOwned = isPlayerOwned;
    this.hasStartedMoving = false;
    this.pathProgress = this.isPlayerOwned ? 0 : 1;

    this.setAlpha(0);
    this.setDepth(this.isPlayerOwned ? 1 : 2);

    this.sprite = scene.add.sprite(0, 0, "soldier-walk", 32);
    this.sprite.setScale(0.25);

    this.healthBar = scene.add.graphics();

    this.wordText = scene.add
      .text(0, 0, word, {
        fontSize: "13px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#33333388",
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5);

    if (this.isPlayerOwned) {
      this.sprite.setTint(0xccddff);
    } else {
      this.sprite.setTint(0xffcccc);
    }

    this.add([this.sprite, this.wordText, this.healthBar]);

    this.updateHealthBar();

    if (this.isPlayerOwned) {
      const startPos = pathManager.getPositionOnPath(pathType, 0);
      this.setPosition(startPos.x, startPos.y);
      this.prevX = startPos.x;
      this.prevY = startPos.y;
    } else {
      const startPos = pathManager.getPositionOnPath(pathType, 1);
      this.setPosition(startPos.x, startPos.y);
      this.prevX = startPos.x;
      this.prevY = startPos.y;
    }

    this.setInteractive(
      new Phaser.Geom.Rectangle(-30, -35, 60, 70),
      Phaser.Geom.Rectangle.Contains,
    );

    scene.add.existing(this);
  }

  private updateDirectionAnimation(dx: number, dy: number): void {
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    const a = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (a > 157.5 || a < -157.5) {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 16;
    } else if (a >= 112.5) {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 8;
    } else if (a > 67.5) {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 0;
    } else if (a > 22.5) {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 0;
    } else if (a >= -22.5) {
      this.sprite.setFlipX(true);
      this.animBaseFrame = 16;
    } else if (a >= -67.5) {
      this.sprite.setFlipX(true);
      this.animBaseFrame = 24;
    } else if (a >= -112.5) {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 32;
    } else if (a >= -157.5) {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 32;
    } else {
      this.sprite.setFlipX(false);
      this.animBaseFrame = 16;
    }
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const blockW = 16;
    const blockH = 5;
    const gap = 2;
    const count = this.health;
    if (count <= 0) return;

    const totalW = count * blockW + (count - 1) * gap;
    const barY = -36;

    for (let i = 0; i < count; i++) {
      const x = -totalW / 2 + i * (blockW + gap);
      this.healthBar.fillStyle(0xe74c3c, 1);
      this.healthBar.fillRect(x, barY - blockH / 2, blockW, blockH);
    }
  }

  move(delta: number): void {
    if (this.fadeInProgress < this.invisibleDuration + this.fadeInDuration) {
      this.fadeInProgress += delta;

      if (this.fadeInProgress < this.invisibleDuration) {
        this.setAlpha(0);
      } else {
        const fadeInTime = this.fadeInProgress - this.invisibleDuration;
        const alpha = Math.min(1, fadeInTime / this.fadeInDuration);
        this.setAlpha(alpha);
      }
    }

    this.frameTimer += delta;
    if (this.frameTimer >= 100) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % 8;
      this.sprite.setFrame(this.animBaseFrame + this.frameIndex);
    }

    const pathLength = this.pathManager.getPathLength(this.pathType);
    const progressDelta = (this.speed * delta) / 1000 / pathLength;

    if (!this.hasStartedMoving) {
      this.hasStartedMoving = true;
    }

    if (this.isPlayerOwned) {
      this.pathProgress = Math.min(1, this.pathProgress + progressDelta);
    } else {
      this.pathProgress = Math.max(0, this.pathProgress - progressDelta);
    }

    const newPos = this.pathManager.getPositionOnPath(
      this.pathType,
      this.pathProgress,
    );
    this.setPosition(newPos.x, newPos.y);

    const dx = newPos.x - this.prevX;
    const dy = newPos.y - this.prevY;
    this.prevX = newPos.x;
    this.prevY = newPos.y;

    if (this.fadeInProgress >= this.invisibleDuration + this.fadeInDuration) {
      this.updateDirectionAnimation(dx, dy);
    }
  }

  hasReachedEnd(): boolean {
    if (!this.hasStartedMoving) {
      return false;
    }

    if (this.isPlayerOwned) {
      return this.pathProgress >= 1;
    } else {
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

  getImageUrl(): string {
    return this.imageUrl;
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
