import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height * 0.2, 'EnglishCraft', {
      fontSize: '48px',
      color: '#f0e0ff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.2 + 60, '英语魔法学院', {
      fontSize: '28px',
      color: '#c0a0e0',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.createButton(width / 2, height * 0.32, '切块拼写', () => {
      this.scene.start('DifficultySelectScene', { gameMode: 'chunk-spell' });
    });

    this.createButton(width / 2, height * 0.42, '切块造句', () => {
      this.scene.start('DifficultySelectScene', { gameMode: 'chunk-build' });
    });

    this.createButton(width / 2, height * 0.52, '听音辨词', () => {
      this.scene.start('DifficultySelectScene', { gameMode: 'listen-pick' });
    });

    this.createButton(width / 2, height * 0.62, '时间配对', () => {
      this.scene.start('DifficultySelectScene', { gameMode: 'time-match' });
    });

    this.createButton(width / 2, height * 0.72, '日常任务', () => {
      this.scene.start('QuestScene');
    });

    this.createButton(width / 2, height * 0.82, '猫头鹰伙伴', () => {
      this.scene.start('OwlProfileScene');
    });
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 280, 60, 0x6b4e8a, 0.9)
      .setStrokeStyle(2, 0xc0a0e0);

    const text = this.add.text(0, 0, label, {
      fontSize: '22px',
      color: '#f0e0ff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(280, 60);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      bg.setFillStyle(0x8b6eaa, 1);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(0x6b4e8a, 0.9);
    });

    button.on('pointerdown', callback);
  }
}
