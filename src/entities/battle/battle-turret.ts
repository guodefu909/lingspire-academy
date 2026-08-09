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

    const bullet = new BattleBullet(
      this.scene,
      wordData.word,
      wordData.imageUrl,
    );

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

    const bullet = this.bullets[0];

    const displayBullet = this.scene.add.container(0, 0);

    const circle = this.scene.add.graphics();
    circle.fillStyle(0x4a90e2, 1);
    circle.fillCircle(0, 0, 25);
    circle.lineStyle(3, 0xffffff, 0.9);
    circle.strokeCircle(0, 0, 25);

    const key = `word_img_${bullet.getWord()}`;
    let imageObj: Phaser.GameObjects.Image | Phaser.GameObjects.Container;

    if (this.scene.textures.exists(key)) {
      imageObj = this.scene.add.image(0, 0, key).setDisplaySize(44, 44);
    } else {
      imageObj = this.createFallbackAvatar(this.scene, bullet.getWord(), 22);
    }

    displayBullet.add([circle, imageObj]);
    this.bulletContainer.add(displayBullet);

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

  private createFallbackAvatar(
    scene: Phaser.Scene,
    word: string,
    radius: number,
  ): Phaser.GameObjects.Container {
    const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x2980b9];
    const colorIndex = word.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    const container = scene.add.container(0, 0);
    const gfx = scene.add.graphics();
    gfx.fillStyle(bgColor, 1);
    gfx.fillCircle(0, 0, radius);
    gfx.lineStyle(2, 0xffffff, 0.6);
    gfx.strokeCircle(0, 0, radius);

    const letter = scene.add
      .text(0, 0, word.charAt(0).toUpperCase(), {
        fontSize: `${radius}px`,
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([gfx, letter]);
    return container;
  }
}
