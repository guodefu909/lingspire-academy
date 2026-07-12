import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x6b4e8a, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#e0d0f0',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xe0d0f0, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 20, 310 * value, 40);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      this.scene.start('MenuScene');
    });

    this.load.json('months', './data/months.json');
    this.load.json('weekdays', './data/weekdays.json');
    this.load.json('time-sentences', './data/time-sentences.json');
    this.load.json('owl-evolution', './data/owl-evolution.json');
  }
}
