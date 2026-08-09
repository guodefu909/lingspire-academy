import * as Phaser from "phaser";
import { BattleSoldier } from "./battle-soldier";

export class BattleBullet extends Phaser.GameObjects.Container {
  private word: string;
  private emoji: string;
  private target: BattleSoldier | null = null;
  private speed: number;
  private isFlying: boolean = false;
  private circle: Phaser.GameObjects.Graphics;
  private emojiText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    word: string,
    emoji: string,
    speed: number = 300,
  ) {
    super(scene, 0, 0);

    this.word = word;
    this.emoji = emoji;
    this.speed = speed;

    this.circle = scene.add.graphics();
    this.emojiText = scene.add
      .text(0, 0, emoji, {
        fontSize: "24px",
      })
      .setOrigin(0.5);

    this.add([this.circle, this.emojiText]);

    this.drawBullet();

    this.setVisible(false);

    scene.add.existing(this);
  }

  private drawBullet(): void {
    this.circle.clear();
    this.circle.fillStyle(0x4a90e2, 1);
    this.circle.fillCircle(0, 0, 20);
    this.circle.lineStyle(2, 0xffffff, 0.8);
    this.circle.strokeCircle(0, 0, 20);
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

    if (distance < 10) {
      this.isFlying = false;
      return true;
    }

    const velocity = targetPos
      .subtract(currentPos)
      .normalize()
      .scale((this.speed * delta) / 1000);
    this.setPosition(this.x + velocity.x, this.y + velocity.y);

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

  getEmoji(): string {
    return this.emoji;
  }

  getTarget(): BattleSoldier | null {
    return this.target;
  }
}
