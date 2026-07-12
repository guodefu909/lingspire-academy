import * as Phaser from 'phaser';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: { correctCount: number; totalCount: number }): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const { correctCount, totalCount } = data;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    let title = '完成！';
    let titleColor = '#f0e0ff';
    if (percentage === 100) {
      title = '完美！';
      titleColor = '#ffaa00';
    } else if (percentage >= 80) {
      title = '太棒了！';
      titleColor = '#aaff00';
    } else if (percentage >= 60) {
      title = '做得好！';
      titleColor = '#aaaaff';
    } else {
      title = '继续加油！';
      titleColor = '#ffaaaa';
    }

    this.add.text(width / 2, height * 0.25, title, {
      fontSize: '48px',
      color: titleColor,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.4, `${correctCount} / ${totalCount}`, {
      fontSize: '64px',
      color: '#f0e0ff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.5, `正确率 ${percentage}%`, {
      fontSize: '28px',
      color: '#c0a0e0',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const backButton = this.add.container(width / 2, height * 0.7);
    const bg = this.add.rectangle(0, 0, 280, 60, 0x6b4e8a, 0.9)
      .setStrokeStyle(2, 0xc0a0e0);
    const text = this.add.text(0, 0, '返回主菜单', {
      fontSize: '22px',
      color: '#f0e0ff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    backButton.add([bg, text]);
    backButton.setSize(280, 60);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => bg.setFillStyle(0x8b6eaa, 1));
    backButton.on('pointerout', () => bg.setFillStyle(0x6b4e8a, 0.9));
    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
