import * as Phaser from "phaser";
import { BattleSoldier } from "./battle-soldier";

/**
 * 飞行炮弹 —— 从水晶炮塔飞向目标士兵的光团特效。
 *
 * 炮弹携带一个单词，发射后追踪目标移动（每帧修正方向）。
 * 命中时由 CombatSystem 判断单词是否匹配并结算伤害。
 * 视觉上为多层半透明圆构成的彩色光团。
 */
export class BattleBullet extends Phaser.GameObjects.Container {
  private word: string;
  private imageUrl: string;
  private chinese: string;
  private batch: number;
  private target: BattleSoldier | null = null;
  private speed: number;
  private isFlying: boolean = false;
  /** 光团图形 */
  private glow: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    word: string,
    imageUrl: string,
    speed: number = 300,
    chinese: string = "",
    batch: number = -1,
  ) {
    super(scene, 0, 0);

    this.word = word;
    this.imageUrl = imageUrl;
    this.chinese = chinese;
    this.batch = batch;
    this.speed = speed;

    this.glow = scene.add.graphics();
    this.drawGlow();
    this.add(this.glow);

    this.setVisible(false);
    scene.add.existing(this);
  }

  /** 绘制多层渐变光团：外圈淡 → 内圈浓 → 中心白亮 */
  private drawGlow(): void {
    this.glow.clear();

    const color = this.getBulletColor();

    this.glow.fillStyle(color, 0.1);
    this.glow.fillCircle(0, 0, 18);

    this.glow.fillStyle(color, 0.25);
    this.glow.fillCircle(0, 0, 13);

    this.glow.fillStyle(color, 0.5);
    this.glow.fillCircle(0, 0, 8);

    this.glow.fillStyle(0xffffff, 0.9);
    this.glow.fillCircle(0, 0, 3);
  }

  /** 根据单词首字母哈希选择一个颜色 */
  private getBulletColor(): number {
    const hash = this.word.charCodeAt(0);
    const colors = [
      0x4a90e2, 0xe24a4a, 0x2ecc71, 0xf39c12,
      0x9b59b6, 0x1abc9c, 0xe67e22, 0xe74c3c,
    ];
    return colors[hash % colors.length];
  }

  /** 发射：设置目标并显示 */
  launch(target: BattleSoldier): void {
    this.target = target;
    this.isFlying = true;
    this.setVisible(true);
  }

  /**
   * 每帧飞行：追踪目标当前位置，到达距离阈值后停止。
   * @returns true 表示已命中目标
   */
  move(delta: number): boolean {
    if (!this.isFlying || !this.target) return false;

    const targetPos = new Phaser.Math.Vector2(this.target.x, this.target.y);
    const currentPos = new Phaser.Math.Vector2(this.x, this.y);
    const distance = Phaser.Math.Distance.Between(
      currentPos.x, currentPos.y,
      targetPos.x, targetPos.y,
    );

    if (distance < 20) {
      this.isFlying = false;
      return true;
    }

    const step = (this.speed * delta) / 1000;
    const dir = targetPos.subtract(currentPos).normalize();
    this.setPosition(this.x + dir.x * step, this.y + dir.y * step);

    return false;
  }

  /** 是否已命中目标 */
  hasHitTarget(): boolean {
    return !this.isFlying && this.target !== null;
  }

  /** 炮弹单词是否与目标士兵单词相同 */
  checkMatch(): boolean {
    if (!this.target) return false;
    return this.word === this.target.getWord();
  }

  getWord(): string { return this.word; }
  getImageUrl(): string { return this.imageUrl; }
  getChinese(): string { return this.chinese; }
  getBatch(): number { return this.batch; }
  getTarget(): BattleSoldier | null { return this.target; }
}
