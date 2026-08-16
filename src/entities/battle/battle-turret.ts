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
  /** 队首炮弹展示容器（用于翻转） */
  private displayBullet!: Phaser.GameObjects.Container;
  /** 队首炮弹图片与中文（用于翻转切换） */
  private frontImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
  private frontChinese!: Phaser.GameObjects.Text;
  /** 翻转状态：false=显示图片，true=显示中文 */
  private isFlipped: boolean = false;
  /** 翻转复位定时器 */
  private flipTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) {
    super(scene, x, y);

    this.isPlayer = isPlayer;
    this.bulletContainer = scene.add.container(0, 0);
    this.add(this.bulletContainer);

    scene.add.existing(this);
  }

  /** 往队列尾部添加炮弹 */
  addBullet(wordData: WordData, batch: number = -1): void {
    if (this.bullets.length >= this.maxCapacity) return;

    const bullet = new BattleBullet(
      this.scene, wordData.word, wordData.imageUrl, 300, wordData.chinese, batch,
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

  /**
   * 按单词 + 批次移除一枚炮弹（士兵非炮弹死亡时，移除其对应炮弹）。
   * @returns 是否移除成功
   */
  removeBulletByWord(word: string, batch: number): boolean {
    const index = this.bullets.findIndex(
      (b) => b.getWord() === word && b.getBatch() === batch,
    );
    if (index === -1) return false;

    this.bullets.splice(index, 1);
    this.updateBulletDisplay();
    return true;
  }

  /** 查看队首炮弹（不移除） */
  getFrontBullet(): BattleBullet | null {
    if (this.bullets.length === 0) return null;
    return this.bullets[0];
  }

  /**
   * 更新炮塔界面：
   * 敌方：不显示炮弹。
   * 我方：显示队首前 3 个炮弹——第 1 个（100%）、第 2 个在上方（75%）、第 3 个最上方（50%）。
   * 点击队首炮弹可翻转查看中文释义。
   */
  private updateBulletDisplay(): void {
    this.bulletContainer.removeAll(true);
    if (this.isFlipped) this.isFlipped = false;
    if (this.flipTimer) { this.flipTimer.remove(); this.flipTimer = null; }
    if (this.bullets.length === 0) return;

    if (this.isPlayer) {
      this.updatePlayerDisplay();
    } else {
      return;
    }

    // 炮弹数量标签
    const countText = this.scene.add
      .text(0, 66, `炮弹: ${this.bullets.length}`, {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "Arial",
        backgroundColor: "#333333",
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5);
    this.bulletContainer.add(countText);
  }

  /**
   * 我方炮塔：显示前 3 个炮弹，第 1 个在原点（100%），
   * 第 2 个在其上方（75%），第 3 个在最上方（50%）。
   * 点击队首翻转中文；点击非队首炮弹将其移到队首。
   */
  private updatePlayerDisplay(): void {
    const positions = [
      { y: 0, scale: 1 },
      { y: -71, scale: 0.75 },
      { y: -123, scale: 0.5 },
    ];

    for (let i = 0; i < Math.min(3, this.bullets.length); i++) {
      const { y, scale } = positions[i];
      const display = this.createBulletDisplay(this.bullets[i], y, scale, i === 0);
      this.bulletContainer.add(display);
      if (i === 0) {
        this.displayBullet = display;
      }
    }

    // 队首炮弹：点击翻转中文
    this.makeFrontInteractive();
    // 非队首炮弹：点击移到队首
    this.makeOtherBulletsInteractive();
  }

  /** 给非队首炮弹添加点击交互（点击后移到队首） */
  private makeOtherBulletsInteractive(): void {
    const sizes = [74, 55.5, 37];
    const children = this.bulletContainer.list;
    // children[0..2] 为三个炮弹展示容器（若不足3个则对应减少）
    for (let i = 1; i < Math.min(3, this.bullets.length); i++) {
      const display = children[i] as Phaser.GameObjects.Container;
      display.setSize(sizes[i], sizes[i]);
      display.setInteractive({ useHandCursor: true });
      display.on("pointerdown", () => this.moveBulletToFront(i));
    }
  }

  /** 将指定下标的炮弹移到队首 */
  private moveBulletToFront(index: number): void {
    if (index <= 0 || index >= this.bullets.length) return;

    const [bullet] = this.bullets.splice(index, 1);
    this.bullets.unshift(bullet);
    this.updateBulletDisplay();
  }

  /** 创建单个炮弹展示容器：白色圆底 + 单词图片 + 中文（翻转用） */
  private createBulletDisplay(
    bullet: BattleBullet,
    y: number,
    scale: number,
    isFront: boolean,
  ): Phaser.GameObjects.Container {
    const display = this.scene.add.container(0, y);
    const radius = 37 * scale;
    const imageSize = 66 * scale;

    // 白色圆形底
    const circle = this.scene.add.graphics();
    circle.fillStyle(0xffffff, 1);
    circle.fillCircle(0, 0, radius);
    circle.lineStyle(2, 0xcccccc, 0.8);
    circle.strokeCircle(0, 0, radius);

    // 单词图片（已预加载为纹理），未加载时显示彩色首字母头像
    const key = `word_img_${bullet.getWord()}`;
    const imageObj = this.scene.textures.exists(key)
      ? this.scene.add.image(0, 0, key).setDisplaySize(imageSize, imageSize)
      : this.createFallbackAvatar(this.scene, bullet.getWord(), 33 * scale);

    // 中文释义（翻转后显示）
    const chineseText = this.scene.add
      .text(0, 0, bullet.getChinese(), {
        fontSize: `${Math.round(20 * scale)}px`,
        color: "#2c3e50",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    display.add([circle, imageObj, chineseText]);

    if (isFront) {
      this.frontImage = imageObj;
      this.frontChinese = chineseText;
    }

    return display;
  }

  /** 给队首炮弹添加点击翻转交互 */
  private makeFrontInteractive(): void {
    this.displayBullet.setSize(74, 74);
    this.displayBullet.setInteractive({ useHandCursor: true });
    this.displayBullet.on("pointerdown", () => this.flipBullet());
  }

  /**
   * 翻转队首炮弹：图片 ↔ 中文释义，1 秒后自动翻回。
   */
  private flipBullet(): void {
    if (!this.displayBullet || this.bullets.length === 0) return;

    const display = this.displayBullet;
    const imageObj = this.frontImage;
    const chineseText = this.frontChinese;

    this.isFlipped = !this.isFlipped;

    // 水平缩放至 0 模拟翻转，中点切换内容
    this.scene.tweens.add({
      targets: display,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        imageObj.setVisible(!this.isFlipped);
        chineseText.setVisible(this.isFlipped);
        this.scene.tweens.add({
          targets: display,
          scaleX: 1,
          duration: 150,
        });
      },
    });

    // 清除旧定时器，若翻到中文则 1 秒后自动翻回
    if (this.flipTimer) this.flipTimer.remove();
    if (this.isFlipped) {
      this.flipTimer = this.scene.time.delayedCall(1000, () => {
        this.flipBullet();
      });
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
