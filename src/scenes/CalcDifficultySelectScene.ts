import * as Phaser from 'phaser';
import {
  OPERATOR_LABELS,
  DIFFICULTY_LABELS,
  type CalcOperatorOption,
  type CalcDifficultyLevel,
} from '../systems/puzzle-generator';

export class CalcDifficultySelectScene extends Phaser.Scene {
  private selectedOperator?: CalcOperatorOption;

  constructor() {
    super({ key: 'CalcDifficultySelectScene' });
  }

  init(data: { operator?: CalcOperatorOption }): void {
    // 必须显式重置，否则场景复用时 selectedOperator 会保留旧值
    this.selectedOperator = data.operator ?? undefined;
  }

  create(): void {
    if (this.selectedOperator) {
      this.drawDifficultySelect(this.selectedOperator);
    } else {
      this.drawOperatorSelect();
    }
  }

  private drawOperatorSelect(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.children.removeAll(true);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1b2a);

    this.add.text(width / 2, 60, '灵算之塔', {
      fontSize: '36px',
      color: '#f0d060',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 110, '选择运算类型', {
      fontSize: '22px',
      color: '#c0a060',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const operators: CalcOperatorOption[] = ['+', '-', '×', '÷'];
    const opColors: Record<CalcOperatorOption, number> = {
      '+': 0xffd700,
      '-': 0x87ceeb,
      '×': 0xff6b35,
      '÷': 0x9b59b6,
    };
    const startY = 200;
    const gapY = 100;

    operators.forEach((op, i) => {
      this.createOpButton(
        width / 2,
        startY + i * gapY,
        op,
        OPERATOR_LABELS[op],
        opColors[op],
        () => {
          this.drawDifficultySelect(op);
        }
      );
    });

    this.createBackButton(width, height);
  }

  private drawDifficultySelect(operator: CalcOperatorOption): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.children.removeAll(true);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1b2a);

    this.add.text(width / 2, 60, '灵算之塔', {
      fontSize: '36px',
      color: '#f0d060',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 110, `${OPERATOR_LABELS[operator]} · 选择难度`, {
      fontSize: '22px',
      color: '#c0a060',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const difficulties: CalcDifficultyLevel[] = ['easy', 'normal', 'hard'];
    const descMap: Record<CalcDifficultyLevel, string> = {
      easy: '3×3方格 · 正面显示 · 给2/3元素',
      normal: '4×4方格 · 正面显示 · 给2/3元素',
      hard: '4×4方格 · 翻牌记忆 · 给2/3元素',
    };
    const diffColors: Record<CalcDifficultyLevel, number> = {
      easy: 0x4a8a4a,
      normal: 0x8a8a2a,
      hard: 0x8a4a4a,
    };
    const startY = 220;
    const gapY = 130;

    difficulties.forEach((diff, i) => {
      this.createDifficultyButton(
        width / 2,
        startY + i * gapY,
        diff,
        DIFFICULTY_LABELS[diff],
        descMap[diff],
        diffColors[diff],
        () => {
          this.scene.start('CalcMatchScene', { operator, difficulty: diff });
        }
      );
    });

    this.createBackButton(width, height, () => {
      this.drawOperatorSelect();
    });
  }

  private createOpButton(
    x: number,
    y: number,
    op: CalcOperatorOption,
    label: string,
    accentColor: number,
    callback: () => void
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 320, 70, 0x1b2838, 0.9)
      .setStrokeStyle(3, accentColor);

    const opText = this.add.text(-80, 0, op, {
      fontSize: '36px',
      color: '#' + accentColor.toString(16).padStart(6, '0'),
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const labelText = this.add.text(20, 0, label, {
      fontSize: '24px',
      color: '#d0e0f0',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    container.add([bg, opText, labelText]);
    container.setSize(320, 70);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(0x2a4a6a, 1);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(0x1b2838, 0.9);
    });

    container.on('pointerdown', callback);
  }

  private createDifficultyButton(
    x: number,
    y: number,
    _diff: CalcDifficultyLevel,
    label: string,
    subtitle: string,
    accentColor: number,
    callback: () => void
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 340, 90, 0x1b2838, 0.9)
      .setStrokeStyle(3, accentColor);

    const labelText = this.add.text(0, -14, label, {
      fontSize: '26px',
      color: '#d0e0f0',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subText = this.add.text(0, 16, subtitle, {
      fontSize: '13px',
      color: '#8a9aaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    container.add([bg, labelText, subText]);
    container.setSize(340, 90);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(0x2a4a6a, 1);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(0x1b2838, 0.9);
    });

    container.on('pointerdown', callback);
  }

  private createBackButton(_width: number, height: number, callback?: () => void): void {
    const btn = this.add.container(60, height - 50);
    const bg = this.add.rectangle(0, 0, 100, 40, 0x1b2838, 0.8).setStrokeStyle(1, 0x3a5a7a);
    const text = this.add.text(0, 0, '返回', { fontSize: '18px', color: '#8a9aaa', fontFamily: 'Arial' }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(100, 40);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      if (callback) {
        callback();
      } else {
        this.scene.start('MenuScene');
      }
    });
  }
}
