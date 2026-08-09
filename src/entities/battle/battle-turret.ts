import * as Phaser from "phaser";
import { BattleBullet } from "./battle-bullet";
import { WordData } from "../../managers/battle/word-library.manager";

export class BattleTurret extends Phaser.GameObjects.Container {
  private bullets: BattleBullet[] = [];
  private maxDisplayCount: number = 10;
  private maxCapacity: number = 100;
  private bulletContainer: Phaser.GameObjects.Container;
  private isPlayer: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y);

    this.isPlayer = isPlayer;
    this.bulletContainer = scene.add.container(0, 0);
    this.add(this.bulletContainer);

    scene.add.existing(this);
  }

  addBullet(wordData: WordData): void {
    if (this.bullets.length >= this.maxCapacity) {
      return;
    }

    const bullet = new BattleBullet(this.scene, wordData.word, wordData.emoji);

    this.bullets.push(bullet);

    this.updateBulletDisplay();
  }

  removeFrontBullet(): BattleBullet | null {
    if (this.bullets.length === 0) {
      return null;
    }

    const bullet = this.bullets.shift();
    if (bullet) {
      this.updateBulletDisplay();
    }

    return bullet || null;
  }

  getFrontBullet(): BattleBullet | null {
    if (this.bullets.length === 0) {
      return null;
    }
    return this.bullets[0];
  }

  private updateBulletDisplay(): void {
    this.bulletContainer.removeAll(true);

    if (this.bullets.length === 0) {
      return;
    }

    // 只显示第一个炮弹（准备发射的炮弹）
    const bullet = this.bullets[0];

    const displayBullet = this.scene.add.container(0, 0);

    const circle = this.scene.add.graphics();
    circle.fillStyle(0x4a90e2, 1);
    circle.fillCircle(0, 0, 25);
    circle.lineStyle(3, 0xffffff, 0.9);
    circle.strokeCircle(0, 0, 25);

    const emojiText = this.scene.add
      .text(0, 0, bullet.getEmoji(), {
        fontSize: "28px",
      })
      .setOrigin(0.5);

    displayBullet.add([circle, emojiText]);
    this.bulletContainer.add(displayBullet);

    // 显示炮弹总数
    if (this.bullets.length > 0) {
      const countText = this.scene.add
        .text(0, 50, `炮弹: ${this.bullets.length}`, {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: "Arial",
          backgroundColor: "#333333",
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5);
      this.bulletContainer.add(countText);
    }
  }

  getBulletCount(): number {
    return this.bullets.length;
  }

  hasBullets(): boolean {
    return this.bullets.length > 0;
  }
}
