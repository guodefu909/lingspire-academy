import * as Phaser from "phaser";
import { PathType } from "@config/battle-constants";
import { BattleTurret } from "./battle-turret";
import { BattleSoldier } from "./battle-soldier";
import { BattleBullet } from "./battle-bullet";
import { WordData } from "../../managers/battle/word-library.manager";

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

    this.turret = new BattleTurret(scene, 0, 0, isPlayer);
    this.add(this.turret);

    this.drawCrystal();
    this.updateHealthBar();

    scene.add.existing(this);
  }

  private drawCrystal(): void {
    this.crystalGraphics.clear();

    const color = this.isPlayer ? 0x4a90e2 : 0xe24a4a;

    this.crystalGraphics.fillStyle(color, 1);
    this.crystalGraphics.fillCircle(0, 0, 40);

    this.crystalGraphics.fillStyle(0xffffff, 0.3);
    this.crystalGraphics.fillCircle(-10, -10, 15);

    this.crystalGraphics.lineStyle(3, 0xffffff, 0.8);
    this.crystalGraphics.strokeCircle(0, 0, 40);
  }

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
      -barWidth / 2,
      barY,
      barWidth * healthPercent,
      barHeight,
    );

    this.healthBar.lineStyle(1, 0xffffff, 0.5);
    this.healthBar.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

    this.healthText.setText(`${this.health}/${this.maxHealth}`);
  }

  takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);
    this.updateHealthBar();

    if (this.health <= 0) {
      this.onDeath();
    }
  }

  private onDeath(): void {
    this.scene.events.emit("crystal-destroyed", this.isPlayer);
  }

  getHealth(): number {
    return this.health;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  addBullet(wordData: WordData): void {
    this.turret.addBullet(wordData);
  }

  getFrontBullet(): BattleBullet | null {
    return this.turret.getFrontBullet();
  }

  removeFrontBullet(): void {
    this.turret.removeFrontBullet();
  }

  getTurret(): BattleTurret {
    return this.turret;
  }

  getIsPlayer(): boolean {
    return this.isPlayer;
  }
}
