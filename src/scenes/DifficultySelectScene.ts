import * as Phaser from 'phaser';

export class DifficultySelectScene extends Phaser.Scene {
  private gameMode: string = '';
  private selectedTime: number = 60;
  private timeOptions: number[] = [30, 60, 90, 120, 180];
  private timeButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'DifficultySelectScene' });
  }

  init(data: { gameMode: string }): void {
    this.gameMode = data.gameMode;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.timeButtons = [];
    this.selectedTime = 60;

    this.add.text(30, 30, '← 返回', {
      fontSize: '20px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));

    const titleMap: Record<string, string> = {
      'chunk-spell': '切块拼写',
      'chunk-build': '切块造句',
      'listen-pick': '听音辨词',
      'time-match': '时间配对',
    };
    const title = titleMap[this.gameMode] || '选择玩法';
    this.add.text(width / 2, height * 0.13, title, {
      fontSize: '36px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.2, '每轮时长', {
      fontSize: '20px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.createTimeSelector(width / 2, height * 0.26);

    this.add.text(width / 2, height * 0.34, '选择难度', {
      fontSize: '22px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setOrigin(0.5);

    let difficulties: { key: string; name: string; desc: string; color: number; border: number }[] = [];

    if (this.gameMode === 'listen-pick') {
      difficulties = [
        { key: 'normal', name: '普通', desc: '听音选择（4选1）', color: 0x2a3a5a, border: 0x4a6a9a },
      ];
    } else {
      difficulties = [
        { key: 'novice', name: '新手', desc: '元音拖回 / 单块选择', color: 0x2a4a2a, border: 0x4a8a4a },
        { key: 'normal', name: '普通', desc: '音节拖回 / 单块选择', color: 0x2a3a5a, border: 0x4a6a9a },
        { key: 'hard', name: '困难', desc: '音节+干扰项 / 多块拖回', color: 0x5a3a2a, border: 0x9a6a4a },
        { key: 'master', name: '大师', desc: '自由组合 / 全句组装', color: 0x5a2a4a, border: 0x9a4a8a },
      ];
    }

    difficulties.forEach((d, i) => {
      const y = height * 0.42 + i * 75;
      this.createDifficultyButton(width / 2, y, d.name, d.desc, d.color, d.border, () => {
        const sceneMap: Record<string, string> = {
          'chunk-spell': 'ChunkSpellScene',
          'chunk-build': 'ChunkBuildScene',
          'listen-pick': 'ListenPickScene',
          'time-match': 'TimeMatchScene',
        };
        const targetScene = sceneMap[this.gameMode] || 'ChunkSpellScene';
        this.scene.start(targetScene, { difficulty: d.key, timeLimit: this.selectedTime });
      });
    });
  }

  private createTimeSelector(centerX: number, y: number): void {
    const btnWidth = 80;
    const gap = 10;
    const totalWidth = this.timeOptions.length * btnWidth + (this.timeOptions.length - 1) * gap;
    const startX = centerX - totalWidth / 2;

    this.timeOptions.forEach((seconds, i) => {
      const x = startX + i * (btnWidth + gap) + btnWidth / 2;
      const container = this.add.container(x, y);

      const isSelected = seconds === this.selectedTime;
      const bg = this.add.rectangle(0, 0, btnWidth, 45,
        isSelected ? 0x6b4e8a : 0x3a2a4a, 0.9)
        .setStrokeStyle(2, isSelected ? 0xffcc00 : 0x6b4e8a);

      const label = this.add.text(0, 0, `${seconds}s`, {
        fontSize: '18px',
        color: isSelected ? '#ffcc00' : '#c0a0e0',
        fontFamily: 'Arial',
        fontStyle: isSelected ? 'bold' : 'normal',
      }).setOrigin(0.5);

      container.add([bg, label]);
      container.setSize(btnWidth, 45);
      container.setInteractive({ useHandCursor: true });
      container.setData('seconds', seconds);
      container.setData('bg', bg);
      container.setData('label', label);

      container.on('pointerdown', () => {
        this.selectedTime = seconds;
        this.refreshTimeSelector();
      });

      this.timeButtons.push(container);
    });
  }

  private refreshTimeSelector(): void {
    for (const btn of this.timeButtons) {
      const seconds = btn.getData('seconds') as number;
      const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
      const label = btn.getData('label') as Phaser.GameObjects.Text;
      const isSelected = seconds === this.selectedTime;

      bg.setFillStyle(isSelected ? 0x6b4e8a : 0x3a2a4a, 0.9)
        .setStrokeStyle(2, isSelected ? 0xffcc00 : 0x6b4e8a);
      label.setColor(isSelected ? '#ffcc00' : '#c0a0e0');
      label.setFontStyle(isSelected ? 'bold' : 'normal');
    }
  }

  private createDifficultyButton(
    x: number, y: number, name: string, desc: string,
    bgColor: number, borderColor: number, callback: () => void
  ): void {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 400, 60, bgColor, 0.9)
      .setStrokeStyle(2, borderColor);
    const nameText = this.add.text(-180, -8, name, {
      fontSize: '22px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const descText = this.add.text(-180, 14, desc, {
      fontSize: '13px', color: '#a090c0', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    container.add([bg, nameText, descText]);
    container.setSize(400, 60);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(borderColor, 0.3));
    container.on('pointerout', () => bg.setFillStyle(bgColor, 0.9));
    container.on('pointerdown', callback);
  }
}
