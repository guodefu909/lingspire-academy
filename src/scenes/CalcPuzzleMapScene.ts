import * as Phaser from 'phaser';
import {
  DIFFICULTY_LABELS,
  type CalcOperatorOption,
  type CalcDifficultyLevel,
} from '../systems/puzzle-generator';
import { calcLevelKey, type CalcLevelProgress } from '../models/calc-progress';
import { CalcProgressStore } from '../storage/calc-progress-store';

const OPERATORS: CalcOperatorOption[] = ['+', '-', '×', '÷'];
const DIFFICULTIES: CalcDifficultyLevel[] = ['easy', 'normal', 'hard'];

/** 拼图边的类型 */
type EdgeType = 'flat' | 'tab' | 'blank';

/** 拼图块边缘配置：[上, 右, 下, 左] */
interface PuzzleEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

export class CalcPuzzleMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CalcPuzzleMapScene' });
  }

  async create(): Promise<void> {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1b2a);
    this.add.rectangle(width / 2, height * 0.3, width, height * 0.6, 0x1b2838, 0.5);

    // 标题
    this.add.text(width / 2, 50, '灵算之塔 · 拼图进度', {
      fontSize: '28px',
      color: '#f0d060',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 加载进度数据
    const store = new CalcProgressStore();
    const allProgress = await store.getAllLevelProgress();
    const progressMap = new Map<string, CalcLevelProgress>();
    for (const p of allProgress) {
      progressMap.set(p.levelKey, p);
    }

    // 统计
    const earned = allProgress.filter(p => p.bestStars >= 2).length;
    const gold = allProgress.filter(p => p.bestStars >= 3).length;
    this.add.text(width / 2, 90, `已收集 ${earned}/12  金色 ${gold}/12`, {
      fontSize: '16px',
      color: '#8a9aaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // 拼图网格参数
    const rows = OPERATORS.length;  // 4
    const cols = DIFFICULTIES.length; // 3
    const cellW = 140;
    const cellH = 140;
    const tabSize = cellW / 5; // 凸凹尺寸约为块边长的1/5

    // 生成边缘配置（相邻块互补）
    const edgeConfig = this.generateEdgeConfig(rows, cols);

    // 整体拼图尺寸（含凸出部分）
    const totalW = cols * cellW + tabSize * 2; // 左右各可能有tab
    const puzzleX = (width - totalW) / 2 + tabSize;
    const puzzleY = 140;

    // 列标题（难度）
    DIFFICULTIES.forEach((_, c) => {
      this.add.text(puzzleX + c * cellW + cellW / 2, puzzleY - 20, DIFFICULTY_LABELS[DIFFICULTIES[c]], {
        fontSize: '14px',
        color: '#6a7a8a',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
    });

    // 行标题（运算符）
    const opColors: Record<string, number> = { '+': 0xffd700, '-': 0x87ceeb, '×': 0xff6b35, '÷': 0x9b59b6 };
    OPERATORS.forEach((op, r) => {
      this.add.text(puzzleX - 35, puzzleY + r * cellH + cellH / 2, op, {
        fontSize: '22px',
        color: '#' + opColors[op].toString(16).padStart(6, '0'),
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    // 绘制拼图块
    OPERATORS.forEach((op, r) => {
      DIFFICULTIES.forEach((diff, c) => {
        const x = puzzleX + c * cellW;
        const y = puzzleY + r * cellH;
        const key = calcLevelKey(op, diff);
        const progress = progressMap.get(key);
        const stars = progress?.bestStars ?? 0;
        const edges = edgeConfig[r][c];

        this.createPuzzlePiece(x, y, cellW, cellH, tabSize, edges, op, diff, stars, opColors[op]);
      });
    });

    // 返回按钮
    const btn = this.add.container(60, height - 50);
    const bg = this.add.rectangle(0, 0, 100, 40, 0x1b2838, 0.9).setStrokeStyle(1, 0x3a5a7a);
    const text = this.add.text(0, 0, '返回', { fontSize: '18px', color: '#8a9aaa', fontFamily: 'Arial' }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(100, 40);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  /** 生成拼图边缘配置，相邻块互补 */
  private generateEdgeConfig(rows: number, cols: number): PuzzleEdges[][] {
    // 水平边（行与行之间）：horizontalEdges[r][c] 表示第r行和第r+1行之间第c列的边
    // true = 上方tab(凸出) + 下方blank(凹入)
    const horizontalEdges: boolean[][] = [];
    for (let r = 0; r < rows - 1; r++) {
      horizontalEdges[r] = [];
      for (let c = 0; c < cols; c++) {
        horizontalEdges[r][c] = Math.random() > 0.5;
      }
    }

    // 垂直边（列与列之间）：verticalEdges[r][c] 表示第c列和第c+1列之间第r行的边
    // true = 左方tab(凸出) + 右方blank(凹入)
    const verticalEdges: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      verticalEdges[r] = [];
      for (let c = 0; c < cols - 1; c++) {
        verticalEdges[r][c] = Math.random() > 0.5;
      }
    }

    const config: PuzzleEdges[][] = [];
    for (let r = 0; r < rows; r++) {
      config[r] = [];
      for (let c = 0; c < cols; c++) {
        config[r][c] = {
          top: r === 0 ? 'flat' : (horizontalEdges[r - 1][c] ? 'blank' : 'tab'),
          bottom: r === rows - 1 ? 'flat' : (horizontalEdges[r][c] ? 'tab' : 'blank'),
          left: c === 0 ? 'flat' : (verticalEdges[r][c - 1] ? 'blank' : 'tab'),
          right: c === cols - 1 ? 'flat' : (verticalEdges[r][c] ? 'tab' : 'blank'),
        };
      }
    }
    return config;
  }
  /** 绘制拼图块路径（贝塞尔曲线凹凸形状） */
  private drawPuzzlePath(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number,
    w: number, h: number,
    tabSize: number,
    edges: PuzzleEdges
  ): void {
    g.beginPath();
    g.moveTo(x, y);

    // 上边 (从左到右)
    this.drawEdgePath(g, x, y, x + w, y, edges.top, tabSize);

    // 右边 (从上到下)
    this.drawEdgePath(g, x + w, y, x + w, y + h, edges.right, tabSize);

    // 下边 (从右到左)
    this.drawEdgePath(g, x + w, y + h, x, y + h, edges.bottom, tabSize);

    // 左边 (从下到上)
    this.drawEdgePath(g, x, y + h, x, y, edges.left, tabSize);

    g.closePath();
  }

  /** 绘制单条边的路径（含凹凸），用圆弧模拟凸凹形状 */
  private drawEdgePath(
    g: Phaser.GameObjects.Graphics,
    x1: number, y1: number,
    x2: number, y2: number,
    edgeType: EdgeType,
    tabSize: number
  ): void {
    if (edgeType === 'flat') {
      g.lineTo(x2, y2);
      return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    // 沿边方向的单位向量
    const ux = dx / len;
    const uy = dy / len;

    // 法线方向（凸出方向：对于上边向上凸出，对于右边向右凸出）
    const nx = -uy;
    const ny = ux;

    // tab 向外凸出，blank 向内凹入
    const direction = edgeType === 'tab' ? 1 : -1;

    // 颈部位置：边的35%和65%处
    const neck1x = x1 + ux * len * 0.38;
    const neck1y = y1 + uy * len * 0.38;
    const neck2x = x1 + ux * len * 0.62;
    const neck2y = y1 + uy * len * 0.62;

    // 到颈部起点
    g.lineTo(neck1x, neck1y);

    // 颈部内收（稍微向内缩进，形成拼图颈）
    const neckInset = tabSize * 0.15 * direction;
    const neckIn1x = neck1x + nx * neckInset;
    const neckIn1y = neck1y + ny * neckInset;
    g.lineTo(neckIn1x, neckIn1y);

    // 用多段直线模拟圆弧凸起/凹入
    const bulgeRadius = tabSize * 0.55;
    const bulgeCenterX = (neck1x + neck2x) / 2 + nx * (tabSize * 0.7 * direction);
    const bulgeCenterY = (neck1y + neck2y) / 2 + ny * (tabSize * 0.7 * direction);

    // 计算从圆心到颈部两端的向量
    const toNeck1x = neckIn1x - bulgeCenterX;
    const toNeck1y = neckIn1y - bulgeCenterY;
    const toNeck2x = neck2x + nx * neckInset - bulgeCenterX;
    const toNeck2y = neck2y + ny * neckInset - bulgeCenterY;

    const startAngle = Math.atan2(toNeck1y, toNeck1x);
    const endAngle = Math.atan2(toNeck2y, toNeck2x);

    // 用 arc 绘制圆弧
    g.arc(bulgeCenterX, bulgeCenterY, bulgeRadius, startAngle, endAngle, direction < 0);

    // 颈部终点
    g.lineTo(neck2x, neck2y);

    // 到终点
    g.lineTo(x2, y2);
  }

  private createPuzzlePiece(
    x: number, y: number,
    w: number, h: number,
    tabSize: number,
    edges: PuzzleEdges,
    op: CalcOperatorOption, diff: CalcDifficultyLevel,
    stars: number, accentColor: number
  ): void {
    const container = this.add.container(x + w / 2, y + h / 2);

    // 颜色配置
    let fillColor: number, fillAlpha: number, strokeColor: number, strokeWidth: number;
    if (stars >= 3) {
      fillColor = 0xd4a017; strokeColor = 0xffd700; strokeWidth = 3; fillAlpha = 0.9;
    } else if (stars >= 2) {
      fillColor = 0x1a3050; strokeColor = 0x5a7a9a; strokeWidth = 2; fillAlpha = 0.9;
    } else {
      fillColor = 0x15202d; strokeColor = 0x3a4a5a; strokeWidth = 1; fillAlpha = 0.6;
    }

    // 绘制拼图形状的 Graphics
    const piece = this.add.graphics();

    // 填充
    piece.fillStyle(fillColor, fillAlpha);
    this.drawPuzzlePath(piece, -w / 2, -h / 2, w, h, tabSize, edges);
    piece.fillPath();

    // 描边
    piece.lineStyle(strokeWidth, strokeColor, 1);
    this.drawPuzzlePath(piece, -w / 2, -h / 2, w, h, tabSize, edges);
    piece.strokePath();

    // 运算符文字
    const opColor = stars >= 3 ? '#1a1a00' : '#' + accentColor.toString(16).padStart(6, '0');
    const opText = this.add.text(0, -15, op, {
      fontSize: '28px', color: opColor, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 难度名
    const diffColor = stars >= 3 ? '#3a3a10' : '#8a9aaa';
    const diffText = this.add.text(0, 12, DIFFICULTY_LABELS[diff], {
      fontSize: '14px', color: diffColor, fontFamily: 'Arial',
    }).setOrigin(0.5);

    // 星级
    let starTextObj: Phaser.GameObjects.Text | null = null;
    if (stars > 0) {
      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      const starColor = stars >= 3 ? '#4a3a10' : '#c0a060';
      starTextObj = this.add.text(0, 35, starStr, {
        fontSize: '14px', color: starColor, fontFamily: 'Arial',
      }).setOrigin(0.5);
    }

    const children: Phaser.GameObjects.GameObject[] = [piece, opText, diffText];
    if (starTextObj) children.push(starTextObj);
    container.add(children);

    // 交互区域（使用矩形作为hit area，足够精确）
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      piece.clear();
      piece.fillStyle(stars >= 3 ? 0xe0b020 : 0x2a4a6a, 1);
      this.drawPuzzlePath(piece, -w / 2, -h / 2, w, h, tabSize, edges);
      piece.fillPath();
      piece.lineStyle(strokeWidth, stars >= 3 ? 0xffd700 : 0x7a9aba, 1);
      this.drawPuzzlePath(piece, -w / 2, -h / 2, w, h, tabSize, edges);
      piece.strokePath();
    });

    container.on('pointerout', () => {
      piece.clear();
      piece.fillStyle(fillColor, fillAlpha);
      this.drawPuzzlePath(piece, -w / 2, -h / 2, w, h, tabSize, edges);
      piece.fillPath();
      piece.lineStyle(strokeWidth, strokeColor, 1);
      this.drawPuzzlePath(piece, -w / 2, -h / 2, w, h, tabSize, edges);
      piece.strokePath();
    });

    container.on('pointerdown', () => {
      this.scene.start('CalcMatchScene', { operator: op, difficulty: diff });
    });
  }
}  