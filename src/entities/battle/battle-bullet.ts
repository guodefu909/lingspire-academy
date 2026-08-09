import * as Phaser from "phaser";
import { BattleSoldier } from "./battle-soldier";

export class BattleBullet extends Phaser.GameObjects.Container {
  private word: string;
  private imageUrl: string;
  private target: BattleSoldier | null = null;
  private speed: number;
  private isFlying: boolean = false;
  private glow: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    word: string,
    imageUrl: string,
    speed: number = 300,
  ) {
    super(scene, 0, 0);

    this.word = word;
    this.imageUrl = imageUrl;
    this.speed = speed;

    this.glow = scene.add.graphics();
    this.drawGlow();
    this.add(this.glow);

    this.setVisible(false);
    scene.add.existing(this);
  }

  private drawGlow(): void {
    this.glow.clear();

    const color = this.getBulletColor();

    this.glow.fillStyle(color, 0.1);
    this.glow.fillCircle(0, 0, 18);

    this.glow.fillStyle(color, 0.25);
    this.glow.fillCircle(0, 0, 13);

    this.glow.fillStyle(color, 0.5);
    this.glow.fillCircle(0, 0, 8);

    this.glow.fillStyle(0xffffff, 1);
    this.glow.fillCircle(0, 0, 4);
  }

  private getBulletColor(): number {
    const hash = this.word.charCodeAt(0);
    const colors = [
      0x4a90e2, 0xe24a4a, 0x2ecc71, 0xf39c12,
      0x9b59b6, 0x1abc9c, 0xe67e22, 0xe74c3c,
    ];
    return colors[hash % colors.length];
  }

  launch(target: BattleSoldier): void {
    this.target = target;
    this.isFlying = true;
    this.setVisible(true);
  }

  move(delta: number): boolean {
    if (!this.isFlying || !this.target) {
      return false;
    }

    const targetPos = new Phaser.Math.Vector2(this.target.x, this.target.y);
    const currentPos = new Phaser.Math.Vector2(this.x, this.y);
    const distance = Phaser.Math.Distance.Between(
      currentPos.x,
      currentPos.y,
      targetPos.x,
      targetPos.y,
    );

    if (distance < 20) {
      this.isFlying = false;
      return true;
    }

    const step = (this.speed * delta) / 1000;
    const dir = targetPos.subtract(currentPos).normalize();
    this.setPosition(
      this.x + dir.x * step,
      this.y + dir.y * step,
    );

    return false;
  }

  hasHitTarget(): boolean {
    return !this.isFlying && this.target !== null;
  }

  checkMatch(): boolean {
    if (!this.target) {
      return false;
    }
    return this.word === this.target.getWord();
  }

  getWord(): string {
    return this.word;
  }

  getImageUrl(): string {
    return this.imageUrl;
  }

  getTarget(): BattleSoldier | null {
    return this.target;
  }
}
