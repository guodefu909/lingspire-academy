import * as Phaser from "phaser";
import { BattleBullet } from "./battle-bullet";
import { WordData } from "../../managers/battle/word-library.manager";

/**
 * 战斗炮塔 —— 管理水晶的炮弹队列，显示下一个待发射炮弹的单词图片。
 *
 * 炮弹按队列（FIFO）管理，点击敌方士兵时发射队首炮弹。
 * 炮塔界面展示队首炮弹的图片 + 队列总数。
 */
export class BattleTurret extends Phaser.GameObjects.Container {
  /** 炮弹队列 */
  private bullets: BattleBullet[] = [];
  /** 最大展示数量（未使用） */
  private maxDisplayCount: number = 10;
  /** 炮弹容量上限 */
  private maxCapacity: number = 100;
  /** 炮弹展示子容器 */
  private bulletContainer: Phaser.GameObjects.Container;
  private isPlayer: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y);

    this.isPlayer = isPlayer;
    this.bulletContainer = scene.add.container(0, 0);
    this.add(this.bulletContainer);

    scene.add.existing(this);
  }

  /** 往队列尾部添加炮弹 */
  addBullet(wordData: WordData): void {
    if (this.bullets.length >= this.maxCapacity) return;

    const bullet = new BattleBullet(
      this.scene, wordData.word, wordData.imageUrl,
    );

    this.bullets.push(bullet);
    this.updateBulletDisplay();
  }

  /** 弹出并返回队首炮弹 */
  removeFrontBullet(): BattleBullet | null {
    if (this.bullets.length === 0) return null;

    const bullet = this.bullets.shift();
    if (bullet) this.updateBulletDisplay();
    return bullet || null;
  }

  /** 查看队首炮弹（不移除） */
  getFrontBullet(): BattleBullet | null {
    if (this.bullets.length === 0) return null;
    return this.bullets[0];
  }

  /**
   * 更新炮塔界面：展示队首炮弹的单词图片（或彩色首字母头像），
   * 以及当前炮弹总数。
   */
  private updateBulletDisplay(): void {
    this.bulletContainer.removeAll(true);
    if (this.bullets.length === 0) return;

    const bullet = this.bullets[0];
    const displayBullet = this.scene.add.container(0, 0);

    // 蓝色圆形底
    const circle = this.scene.add.graphics();
    circle.fillStyle(0x4a90e2, 1);
    circle.fillCircle(0, 0, 25);
    circle.lineStyle(3, 0xffffff, 0.9);
    circle.strokeCircle(0, 0, 25);

    // 单词图片（已预加载为纹理），未加载时显示彩色首字母头像
    const key = `word_img_${bullet.getWord()}`;
    let imageObj: Phaser.GameObjects.Image | Phaser.GameObjects.Container;

    if (this.scene.textures.exists(key)) {
      imageObj = this.scene.add.image(0, 0, key).setDisplaySize(44, 44);
    } else {
      imageObj = this.createFallbackAvatar(this.scene, bullet.getWord(), 22);
    }

    displayBullet.add([circle, imageObj]);
    this.bulletContainer.add(displayBullet);

    // 炮弹数量标签
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

  /**
   * 图片缺失时的兜底展示：彩色圆形 + 单词首字母。
   */
  private createFallbackAvatar(
    scene: Phaser.Scene, word: string, radius: number,
  ): Phaser.GameObjects.Container {
    const colors = [
      0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12,
      0x9b59b6, 0x1abc9c, 0xe67e22, 0x2980b9,
    ];
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

  getBulletCount(): number { return this.bullets.length; }
  hasBullets(): boolean { return this.bullets.length > 0; }
}
