import * as Phaser from 'phaser';
import type { CalcPuzzle, DifficultyConfig } from '../../models/calc-puzzle';
import type { CellSprite } from './CalcMatchTypes';
import {
  CELL_SIZE,
  CELL_GAP,
  TARGET_CARD_W,
  TARGET_CARD_H,
  TARGET_CARD_OFFSET_X,
  TARGET_CARD_OFFSET_Y,
  MAX_VISIBLE_CARDS,
} from './CalcMatchTypes';
import type { CalcLevelKey } from '../../models/calc-progress';
import { CalcProgressStore } from '../../storage/calc-progress-store';

/** UI创建与渲染模块 */
export class CalcMatchUI {
  private scene: Phaser.Scene;

  /** 燃尽条矩形 */
  timerBar!: Phaser.GameObjects.Rectangle;
  /** 进度文字 */
  progressText!: Phaser.GameObjects.Text;
  /** 目标卡牌容器 */
  targetCardContainer!: Phaser.GameObjects.Container;
  /** 方格网格 */
  cells: CellSprite[][] = [];
  /** 方格偏移X */
  gridOffsetX: number = 0;
  /** 方格偏移Y */
  gridOffsetY: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 创建背景与标题 */
  createBackground(width: number, height: number, config: DifficultyConfig): void {
    // 主背景 — 深靛蓝
    this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0d1b2a);
    // 顶部微光 — 深蓝紫
    this.scene.add.rectangle(width / 2, height * 0.25, width, height * 0.5, 0x1b2838, 0.5);

    // 标题微光（底层模糊文字）
    this.scene.add.text(width / 2, 61, '灵算之塔', {
      fontSize: '36px',
      color: '#4a3a10',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 标题主文字 — 金色
    this.scene.add.text(width / 2, 60, '灵算之塔', {
      fontSize: '36px',
      color: '#f0d060',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.scene.add.text(width / 2, 120, config.label, {
      fontSize: '22px',
      color: '#c0a060',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  /** 创建玩法介绍区 */
  createGuideArea(width: number): void {
    const guideY = 185;
    this.scene.add.rectangle(width / 2, guideY, 440, 32, 0x1b2838, 0.8)
      .setStrokeStyle(1, 0x3a5a7a);
    this.scene.add.text(width / 2, guideY, '选中方格中两个数，使它们满足提示卡上的等式', {
      fontSize: '16px',
      color: '#a0b0c0',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  /** 创建卡牌堆叠提示区 */
  createTargetCards(width: number, puzzle: CalcPuzzle): void {
    this.targetCardContainer = this.scene.add.container(width / 2, 260);
    this.renderTargetCards(puzzle, 0);
  }

  /** 渲染目标卡牌 */
  renderTargetCards(puzzle: CalcPuzzle, currentTargetIndex: number): void {
    this.targetCardContainer.removeAll(true);

    const queue = puzzle.targetQueue;
    const startIdx = currentTargetIndex;
    const count = Math.min(MAX_VISIBLE_CARDS, queue.length - startIdx);

    // 计算整体宽度，使卡牌组整体居中
    const totalWidth = (count - 1) * TARGET_CARD_OFFSET_X + TARGET_CARD_W;
    const startX = -totalWidth / 2 + TARGET_CARD_W / 2;

    // 图形化框尺寸
    const BOX_W = 28;
    const BOX_H = 28;
    const GAP = 4;
    const opW = 18;
    const eqW = 18;
    const totalContentW = 3 * BOX_W + 2 * GAP + opW + eqW;

    // 运算符映射
    const opDisplay: Record<string, string> = { '+': '＋', '-': '－', '×': '×', '÷': '÷' };

    // 从后往前画，最前面的卡最后画（覆盖在上面）
    for (let i = count - 1; i >= 0; i--) {
      const targetIdx = startIdx + i;
      const target = queue[targetIdx];
      const isCurrent = i === 0;

      const offsetX = startX + i * TARGET_CARD_OFFSET_X;
      const offsetY = i * TARGET_CARD_OFFSET_Y;

      const card = this.scene.add.container(offsetX, offsetY);

      // 卡牌背景 — origin(0.5) 居中锚点
      const cardBg = this.scene.add.rectangle(
        0, 0,
        TARGET_CARD_W, TARGET_CARD_H,
        isCurrent ? 0x1b2838 : 0x15202d,
        1
      ).setStrokeStyle(
        isCurrent ? 3 : 2,
        isCurrent ? 0xd4a017 : 0x5a7a9a
      );

      card.add(cardBg);

      // 图形化渲染卡牌内容
      const { operator, result, givenA } = target;
      const numFontSize = isCurrent ? '18px' : '13px';
      const symFontSize = isCurrent ? '18px' : '13px';
      const numColor = isCurrent ? '#f0e0c0' : '#8a9aaa';
      const symColor = isCurrent ? '#c0a060' : '#6a7a8a';
      const boxFill = isCurrent ? 0x1a3050 : 0x15202d;
      const boxStroke = isCurrent ? 0xd4a017 : 0x5a7a9a;
      const unknownStroke = isCurrent ? 0xffd700 : 0x7a6a3a;

      let cursorX = -totalContentW / 2;

      // 第一个位置：givenA框 或 □框
      if (givenA !== null) {
        // 已知数字框：实线矩形 + 数字
        const box = this.scene.add.rectangle(cursorX + BOX_W / 2, 0, BOX_W, BOX_H, boxFill)
          .setStrokeStyle(2, boxStroke);
        const numText = this.scene.add.text(cursorX + BOX_W / 2, 0, String(givenA), {
          fontSize: numFontSize, color: numColor, fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5);
        card.add([box, numText]);
      } else {
        // 未知数框：不同颜色边框
        const unknownBox = this.scene.add.rectangle(cursorX + BOX_W / 2, 0, BOX_W, BOX_H)
          .setStrokeStyle(2, unknownStroke);
        unknownBox.setFillStyle(0x0a1520, 0.5);
        card.add(unknownBox);
      }
      cursorX += BOX_W + GAP;

      // 运算符
      const opText = this.scene.add.text(cursorX + opW / 2, 0, opDisplay[operator] ?? operator, {
        fontSize: symFontSize, color: symColor, fontFamily: 'Arial',
      }).setOrigin(0.5);
      card.add(opText);
      cursorX += opW + GAP;

      // 第二个位置：□框（未知数）
      const unknownBox2 = this.scene.add.rectangle(cursorX + BOX_W / 2, 0, BOX_W, BOX_H)
        .setStrokeStyle(2, unknownStroke);
      unknownBox2.setFillStyle(0x0a1520, 0.5);
      card.add(unknownBox2);
      cursorX += BOX_W + GAP;

      // 等号
      const eqText = this.scene.add.text(cursorX + eqW / 2, 0, '=', {
        fontSize: symFontSize, color: symColor, fontFamily: 'Arial',
      }).setOrigin(0.5);
      card.add(eqText);
      cursorX += eqW + GAP;

      // result 框：实线矩形 + 数字
      const resultBox = this.scene.add.rectangle(cursorX + BOX_W / 2, 0, BOX_W, BOX_H, boxFill)
        .setStrokeStyle(2, boxStroke);
      const resultText = this.scene.add.text(cursorX + BOX_W / 2, 0, String(result), {
        fontSize: numFontSize, color: numColor, fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      card.add([resultBox, resultText]);

      this.targetCardContainer.add(card);
    }
  }

  
  async createBestTimeDisplay(width: number, levelKey: CalcLevelKey): Promise<void> {
    const progressStore = new CalcProgressStore();
    const progress = await progressStore.getLevelProgress(levelKey);
    if (progress && progress.bestTimeMs !== null) {
      const bestSec = (progress.bestTimeMs / 1000).toFixed(1);
      this.scene.add.text(width / 2, 148, `🏆 最佳 ${bestSec}s`, {
        fontSize: '18px',
        color: '#c0a060',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
    }
  }

  /** 创建方格网格 */
  createGrid(
    width: number,
    puzzle: CalcPuzzle,
    grid: (number | null)[][],
    onCellClick: (row: number, col: number) => void,
    _getSelectedCell: () => CellSprite | null
  ): void {
    const cols = puzzle.gridCols;
    const rows = puzzle.gridRows;
    const totalGridW = cols * (CELL_SIZE + CELL_GAP) - CELL_GAP;

    this.gridOffsetX = (width - totalGridW) / 2 + CELL_SIZE / 2;
    this.gridOffsetY = 420;

    this.cells = [];

    for (let r = 0; r < rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < cols; c++) {
        const value = grid[r][c];
        const x = this.gridOffsetX + c * (CELL_SIZE + CELL_GAP);
        const y = this.gridOffsetY + r * (CELL_SIZE + CELL_GAP);

        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, 0x1a3050, 0.95)
          .setStrokeStyle(2, 0x3a5a7a);

        const text = this.scene.add.text(0, 0, value !== null ? String(value) : '', {
          fontSize: '26px',
          color: '#d0e0f0',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        const cover = this.scene.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, 0x2a1a3a, 0.95)
          .setStrokeStyle(2, 0x6a4a8a);

        const coverText = this.scene.add.text(0, 0, '?', {
          fontSize: '28px',
          color: '#a080c0',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        const isFlipped = !puzzle.faceDown;
        cover.setVisible(!isFlipped);
        coverText.setVisible(!isFlipped);
        text.setVisible(isFlipped);

        if (value === null) {
          cover.setVisible(false);
          coverText.setVisible(false);
          text.setVisible(false);
          bg.setFillStyle(0x0d1b2a, 0.3);
          bg.setStrokeStyle(0);
        }

        container.add([bg, text, cover, coverText]);
        container.setSize(CELL_SIZE, CELL_SIZE);

        if (value !== null) {
          container.setInteractive({ useHandCursor: true });
          container.on('pointerdown', () => onCellClick(r, c));
        }

        this.cells[r][c] = {
          container,
          bg,
          text,
          cover,
          coverText,
          row: r,
          col: c,
          isFlipped,
        };
      }
    }
  }

  /** 创建燃尽条 */
  createTimerBar(width: number, gridCols: number): void {
    const barWidth = gridCols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const barY = this.gridOffsetY - CELL_SIZE / 2 - 40;
    this.timerBar = this.scene.add.rectangle(width / 2, barY, barWidth, 6, 0xd4a017)
      .setOrigin(0.5, 0);
  }

  /** 创建HUD（进度显示） */
  createHUD(width: number, gridRows: number): void {
    const hudY = this.gridOffsetY + gridRows * (CELL_SIZE + CELL_GAP) - CELL_GAP / 2 + 25;
    this.progressText = this.scene.add.text(width / 2, hudY, '', {
      fontSize: '16px',
      color: '#c0a060',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  /** 创建返回按钮 */
  createBackButton(_width: number, _height: number, onBack: () => void): void {
    const btnX = 60;
    const btnY = 50;
    const backBtn = this.scene.add.container(btnX, btnY);
    const btnBg = this.scene.add.rectangle(0, 0, 90, 38, 0x1b2838, 0.9)
      .setStrokeStyle(1, 0x3a5a7a);
    const btnText = this.scene.add.text(0, 0, '← 返回', {
      fontSize: '18px',
      color: '#8a9aaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    backBtn.add([btnBg, btnText]);
    backBtn.setSize(90, 38);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', onBack);
  }

  /** 更新进度文字 */
  updateProgressDisplay(eliminatedCount: number, totalPairs: number): void {
    this.progressText.setText(`已消除 ${eliminatedCount} / ${totalPairs} 对`);
  }
}