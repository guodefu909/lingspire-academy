import * as Phaser from "phaser";
import { BattleTurret } from "./battle-turret";
import { BattleBullet } from "./battle-bullet";
import { WordData } from "../../managers/battle/word-library.manager";

/**
 * 战斗水晶 —— 双方的基地核心，拥有血量和炮弹炮塔。
 *
 * 水晶本体图形已设为透明（地图上有对应素材），
 * 仅保留血条显示和炮塔（炮弹队列展示区）。
 */
export class BattleCrystal extends Phaser.GameObjects.Container {
  private health: number;
  private maxHealth: number;
  private turret: BattleTurret;
  private isPlayer: boolean;
  private crystalGraphics: Phaser.GameObjects.Graphics;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    isPlayer: boolean,
    initialHealth: number = 10,
  ) {
    super(scene, x, y);

    this.isPlayer = isPlayer;
    this.maxHealth = initialHealth;
    this.health = initialHealth;

    this.crystalGraphics = scene.add.graphics();
    this.healthBar = scene.add.graphics();

    const healthBarY = isPlayer ? -70 : 60;
    this.healthText = scene.add
      .text(0, healthBarY + 10, "", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    this.add([this.crystalGraphics, this.healthBar, this.healthText]);

    // 炮塔：玩家炮塔在左下角 (81,690)，敌方炮塔在其中心对称位置 (943,78)
    const turretX = isPlayer ? 81 - x : 943 - x;
    const turretY = isPlayer ? 690 - y : 78 - y;
    this.turret = new BattleTurret(scene, turretX, turretY, isPlayer);
    this.add(this.turret);

    this.drawCrystal();
    this.updateHealthBar();

    scene.add.existing(this);
  }

  /** 绘制水晶本体 —— 已设为透明，地图上已有对应素材 */
  private drawCrystal(): void {
    this.crystalGraphics.clear();
  }

  /** 更新血条：灰色底 + 红/绿/黄色填充 + 数字文字 */
  private updateHealthBar(): void {
    this.healthBar.clear();

    const barWidth = 80;
    const barHeight = 8;
    const healthPercent = this.health / this.maxHealth;
    const barY = this.isPlayer ? -70 : 60;

    this.healthBar.fillStyle(0x333333, 1);
    this.healthBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);

    const healthColor =
      healthPercent > 0.5
        ? 0x4caf50
        : healthPercent > 0.25
          ? 0xffc107
          : 0xf44336;
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(
      -barWidth / 2, barY,
      barWidth * healthPercent, barHeight,
    );

    this.healthBar.lineStyle(1, 0xffffff, 0.5);
    this.healthBar.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

    this.healthText.setText(`${this.health}/${this.maxHealth}`);
  }

  takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);
    this.updateHealthBar();
    if (this.health <= 0) this.onDeath();
  }

  private onDeath(): void {
    this.scene.events.emit("crystal-destroyed", this.isPlayer);
  }

  getHealth(): number { return this.health; }
  isDead(): boolean { return this.health <= 0; }

  addBullet(wordData: WordData, batch: number = -1): void {
    this.turret.addBullet(wordData, batch);
  }
  getFrontBullet(): BattleBullet | null { return this.turret.getFrontBullet(); }
  removeFrontBullet(): void { this.turret.removeFrontBullet(); }
  removeBulletByWord(word: string, batch: number): boolean {
    return this.turret.removeBulletByWord(word, batch);
  }
  getTurret(): BattleTurret { return this.turret; }
  getIsPlayer(): boolean { return this.isPlayer; }
}
