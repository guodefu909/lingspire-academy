import * as Phaser from 'phaser';
import { OwlStore } from '../storage/owl-store';
import { MonthSongAbility } from '../systems/month-song-ability';
import type { EvolutionConfig } from '../models/owl-state';

export class OwlProfileScene extends Phaser.Scene {
  private owlStore: OwlStore;

  constructor() {
    super({ key: 'OwlProfileScene' });
    this.owlStore = new OwlStore();
  }

  async create(): Promise<void> {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const owl = await this.owlStore.getOwl();
    const configs: EvolutionConfig[] = this.cache.json.get('owl-evolution') ?? [];
    const currentConfig = configs.find((c) => c.stage === owl.evolutionStage) ?? configs[0];

    this.add.text(30, 30, '← 返回', {
      fontSize: '20px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.text(width / 2, 80, '猫头鹰伙伴', {
      fontSize: '32px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.drawOwl(width / 2, height * 0.3, owl.evolutionStage);

    this.add.text(width / 2, height * 0.42, currentConfig.name, {
      fontSize: '28px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.47, currentConfig.description, {
      fontSize: '16px', color: '#c0a0e0', fontFamily: 'Arial',
      wordWrap: { width: width - 80 },
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.55, `⭐ ${owl.stars} 颗星星`, {
      fontSize: '24px', color: '#ffdd44', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const nextConfig = configs.find((c) => c.stage === owl.evolutionStage + 1);
    if (nextConfig) {
      const progress = owl.stars - currentConfig.starsRequired;
      const needed = nextConfig.starsRequired - currentConfig.starsRequired;
      this.add.text(width / 2, height * 0.6,
        `距下一阶段「${nextConfig.name}」还需 ${nextConfig.starsRequired - owl.stars} 颗星星`,
        { fontSize: '16px', color: '#8070a0', fontFamily: 'Arial' }
      ).setOrigin(0.5);

      this.add.rectangle(width / 2, height * 0.64, 300, 12, 0x3a2a4a)
        .setStrokeStyle(1, 0x6b4e8a);
      const fillWidth = Math.max(0, Math.min(300, (progress / needed) * 300));
      this.add.rectangle(
        width / 2 - 150 + fillWidth / 2, height * 0.64, fillWidth, 10, 0xc0a0e0
      );
    } else {
      this.add.text(width / 2, height * 0.6, '已达到最高形态！', {
        fontSize: '18px', color: '#ffdd44', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, height * 0.72, '已解锁能力', {
      fontSize: '20px', color: '#f0e0ff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    if (owl.abilities.includes('month-song')) {
      this.createButton(width / 2, height * 0.78, '🎵 月份之歌 - 点击播放', async () => {
        const song = new MonthSongAbility();
        await song.play();
      });
    } else {
      this.add.text(width / 2, height * 0.78,
        `答对 ${10 - owl.monthCorrectCount} 道月份题解锁月份之歌`,
        { fontSize: '16px', color: '#666666', fontFamily: 'Arial' }
      ).setOrigin(0.5);
    }
  }

  private drawOwl(x: number, y: number, stage: number): void {
    const g = this.add.graphics();

    switch (stage) {
      case 0:
        g.fillStyle(0xddccaa, 1);
        g.fillEllipse(x, y, 80, 100);
        g.fillStyle(0xffeecc, 0.5);
        g.fillEllipse(x - 10, y - 10, 40, 50);
        g.fillStyle(0xffe066, 0.3);
        g.fillCircle(x, y, 60);
        break;
      case 1:
        g.fillStyle(0xddccaa, 1);
        g.fillCircle(x, y, 50);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x - 12, y - 8, 16);
        g.fillCircle(x + 12, y - 8, 16);
        g.fillStyle(0x000000, 1);
        g.fillCircle(x - 12, y - 8, 8);
        g.fillCircle(x + 12, y - 8, 8);
        g.fillStyle(0xffaa00, 1);
        g.fillTriangle(x - 5, y + 5, x + 5, y + 5, x, y + 15);
        break;
      case 2:
        g.fillStyle(0xaa9977, 1);
        g.fillEllipse(x, y, 70, 90);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x - 15, y - 15, 20);
        g.fillCircle(x + 15, y - 15, 20);
        g.fillStyle(0x000000, 1);
        g.fillCircle(x - 15, y - 15, 10);
        g.fillCircle(x + 15, y - 15, 10);
        g.fillStyle(0xffaa00, 1);
        g.fillTriangle(x - 6, y, x + 6, y, x, y + 18);
        g.fillStyle(0x887755, 1);
        g.fillTriangle(x - 35, y - 20, x - 50, y - 40, x - 20, y - 30);
        g.fillTriangle(x + 35, y - 20, x + 50, y - 40, x + 20, y - 30);
        break;
      case 3:
        g.fillStyle(0x998866, 1);
        g.fillEllipse(x, y, 80, 100);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x - 18, y - 18, 24);
        g.fillCircle(x + 18, y - 18, 24);
        g.fillStyle(0x000000, 1);
        g.fillCircle(x - 18, y - 18, 12);
        g.fillCircle(x + 18, y - 18, 12);
        g.fillStyle(0xffaa00, 1);
        g.fillTriangle(x - 8, y, x + 8, y, x, y + 22);
        g.fillStyle(0x776644, 1);
        g.fillTriangle(x - 40, y - 25, x - 65, y - 50, x - 15, y - 35);
        g.fillTriangle(x + 40, y - 25, x + 65, y - 50, x + 15, y - 35);
        g.fillStyle(0x998866, 1);
        g.fillTriangle(x - 30, y - 45, x - 45, y - 70, x - 15, y - 55);
        g.fillTriangle(x + 30, y - 45, x + 45, y - 70, x + 15, y - 55);
        break;
      case 4:
        g.fillStyle(0xffe066, 0.3);
        g.fillCircle(x, y, 100);
        g.fillStyle(0xddbb44, 1);
        g.fillEllipse(x, y, 85, 105);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x - 20, y - 20, 26);
        g.fillCircle(x + 20, y - 20, 26);
        g.fillStyle(0xff8800, 1);
        g.fillCircle(x - 20, y - 20, 14);
        g.fillCircle(x + 20, y - 20, 14);
        g.fillStyle(0xffaa00, 1);
        g.fillTriangle(x - 9, y, x + 9, y, x, y + 25);
        g.fillStyle(0xddaa33, 1);
        g.fillTriangle(x - 45, y - 30, x - 75, y - 60, x - 15, y - 40);
        g.fillTriangle(x + 45, y - 30, x + 75, y - 60, x + 15, y - 40);
        g.fillStyle(0xffcc44, 1);
        g.fillTriangle(x - 35, y - 55, x - 55, y - 85, x - 10, y - 65);
        g.fillTriangle(x + 35, y - 55, x + 55, y - 85, x + 10, y - 65);
        break;
    }
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 320, 50, 0x6b4e8a, 0.9)
      .setStrokeStyle(2, 0xc0a0e0);
    const text = this.add.text(0, 0, label, {
      fontSize: '18px', color: '#f0e0ff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(320, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x8b6eaa, 1));
    container.on('pointerout', () => bg.setFillStyle(0x6b4e8a, 0.9));
    container.on('pointerdown', callback);
  }
}
