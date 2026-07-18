import * as Phaser from 'phaser';
import type { CalcPuzzle, CalcTarget, DifficultyConfig } from '../models/calc-puzzle';
import { calcLevelKey, CALC_TIME_LIMITS, type CalcLevelKey } from '../models/calc-progress';
import { generatePuzzle, buildDifficultyConfig } from '../systems/puzzle-generator';
import { CalcMatchEffects } from '../systems/calc-match-effects';
import { ComboTracker } from '../systems/combo-tracker';
import { eventManager } from '../systems/event-manager';
import type { CalcOperatorOption, CalcDifficultyLevel } from '../systems/puzzle-generator';
import { CalcProgressStore } from '../storage/calc-progress-store';
import { MathDataStore } from '../storage/math-data-store';
// 拆分模块
import type { CellSprite } from './calc/CalcMatchTypes';
import { CalcMatchUI } from './calc/CalcMatchUI';
import { CalcMatchTimer } from './calc/CalcMatchTimer';
import { CalcMatchToast } from './calc/CalcMatchToast';
import { CalcMatchWrongArea } from './calc/CalcMatchWrongArea';
import { CalcMatchAnimator } from './calc/CalcMatchAnimator';

export class CalcMatchScene extends Phaser.Scene {
  // 数据层
  private puzzle!: CalcPuzzle;
  private config!: DifficultyConfig;
  private grid!: (number | null)[][];
  private currentTargetIndex: number = 0;
  private currentTarget!: CalcTarget;
  private eliminatedCount: number = 0;
  private totalPairs: number = 0;
  private correctCount: number = 0;
  private wrongCount: number = 0;
  private comboTracker: ComboTracker = new ComboTracker();
  private currentDifficulty!: CalcDifficultyLevel;
  private progressStore: CalcProgressStore = new CalcProgressStore();
  private mathDataStore: MathDataStore = new MathDataStore();
  private levelKey!: CalcLevelKey;
  private matchStartTime: number = 0;
  private gameStartTime: number = 0;

  // 交互状态
  private selectedCell: CellSprite | null = null;
  private isProcessing: boolean = false;
  private flippedCell: CellSprite | null = null;
  private flipTimer: Phaser.Time.TimerEvent | null = null;

  // 模块
  private ui!: CalcMatchUI;
  private timer!: CalcMatchTimer;
  private toast!: CalcMatchToast;
  private wrongArea!: CalcMatchWrongArea;
  private animator!: CalcMatchAnimator;
  private effects!: CalcMatchEffects;

  private shutdownHandler?: () => void;

  constructor() {
    super({ key: 'CalcMatchScene' });
  }

  init(data: { operator?: CalcOperatorOption; difficulty?: CalcDifficultyLevel }): void {
    const operator = data.operator ?? '+';
    const difficulty = data.difficulty ?? 'easy';
    this.currentDifficulty = difficulty;
    this.config = buildDifficultyConfig(operator, difficulty);
    this.puzzle = generatePuzzle(this.config);
    this.grid = this.puzzle.grid.map(row => [...row]);
    this.currentTargetIndex = 0;
    this.currentTarget = this.puzzle.targetQueue[0];
    this.eliminatedCount = 0;
    this.totalPairs = this.puzzle.pairs.length;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.comboTracker.reset();
    this.selectedCell = null;
    this.isProcessing = false;
    this.flippedCell = null;
    this.flipTimer = null;
    this.matchStartTime = Date.now();

    const op = data.operator ?? '+';
    this.levelKey = calcLevelKey(op, difficulty);
    this.gameStartTime = Date.now();
  }

  create(): void {
    this.effects = new CalcMatchEffects(this);
    this.ui = new CalcMatchUI(this);
    this.animator = new CalcMatchAnimator(this);
    this.toast = new CalcMatchToast(this, 310);
    this.wrongArea = new CalcMatchWrongArea(this);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景与标题
    this.ui.createBackground(width, height, this.config);

    // 各UI区域
    this.ui.createGuideArea(width);
    this.ui.createTargetCards(width, this.puzzle);
    this.ui.createGrid(
      width,
      this.puzzle,
      this.grid,
      (row, col) => this.onCellClick(row, col),
      () => this.selectedCell
    );
    this.ui.createTimerBar(width, this.puzzle.gridCols);
    this.ui.createBestTimeDisplay(width, this.levelKey);
    this.ui.createHUD(width, this.puzzle.gridRows);
    this.wrongArea.create(width, this.ui.gridOffsetY, this.puzzle.gridRows);
    this.ui.createBackButton(width, height, () => this.scene.start('MenuScene'));

    // 初始化计时器模块
    const timeLimit = CALC_TIME_LIMITS[this.levelKey] ?? 120;
    this.timer = new CalcMatchTimer(
      this,
      this.ui.timerBar,
      this.puzzle.gridCols,
      this.ui.gridOffsetY,
      timeLimit,
      () => this.onTimeUp()
    );
    this.timer.start();

    // 注册 shutdown 清理
    this.shutdownHandler = () => {
      this.timer.stop();
    };
    this.events.on('shutdown', this.shutdownHandler);

    this.updateProgressDisplay();
  }

  // ========== 交互逻辑 ==========

  private onCellClick(row: number, col: number): void {
    if (this.isProcessing) return;
    if (this.grid[row][col] === null) return;

    const cell = this.ui.cells[row][col];

    // 困难模式：如果格子还盖着，先翻牌
    if (this.puzzle.faceDown && !cell.isFlipped) {
      const result = this.animator.flipCard3D(
        cell,
        this.flippedCell,
        this.flipTimer,
        this.grid,
        (_cell, newTimer) => {
          this.flipTimer = newTimer;
        },
        (cell) => {
          this.animator.unflipCard3D(cell, this.grid);
          this.flippedCell = null;
          this.flipTimer = null;
        }
      );
      this.flippedCell = result.flippedCell;
      this.flipTimer = result.flipTimer;
      return;
    }

    // 已翻开的格子：选中逻辑
    if (this.selectedCell === null) {
      this.selectCell(cell);
    } else if (this.selectedCell.row === row && this.selectedCell.col === col) {
      this.deselectCell();
    } else {
      this.tryMatch(this.selectedCell, cell);
    }
  }

  private selectCell(cell: CellSprite): void {
    this.selectedCell = cell;
    this.animator.selectCell(cell);
  }

  private deselectCell(): void {
    if (this.selectedCell) {
      this.animator.deselectCell(this.selectedCell);
      this.selectedCell = null;
    }
  }

  // ========== 匹配判定 ==========

  private tryMatch(cellA: CellSprite, cellB: CellSprite): void {
    this.isProcessing = true;
    const a = this.grid[cellA.row][cellA.col]!;
    const b = this.grid[cellB.row][cellB.col]!;
    const target = this.currentTarget;

    const isCorrect = this.checkPair(a, b, target);

    if (isCorrect) {
      this.onCorrectMatch(cellA, cellB);
    } else {
      this.onWrongMatch(cellA, cellB);
    }
  }

  private checkPair(a: number, b: number, target: CalcTarget): boolean {
    const { operator, result } = target;
    switch (operator) {
      case '+': return a + b === result;
      case '-': return a - b === result || b - a === result;
      case '×': return a * b === result;
      case '÷':
        return (b !== 0 && a / b === result) || (a !== 0 && b / a === result);
      default: return false;
    }
  }

  private onCorrectMatch(cellA: CellSprite, cellB: CellSprite): void {
    this.correctCount++;
    const combo = this.comboTracker.onCorrect();
    const milestone = this.comboTracker.isMilestone();

    // 取消翻牌计时器
    if (this.flipTimer) {
      this.flipTimer.remove();
      this.flipTimer = null;
    }
    this.flippedCell = null;

    const xA = cellA.container.x;
    const xB = cellB.container.x;
    const yA = cellA.container.y;
    const yB = cellB.container.y;

    this.animator.eliminateCell(cellA);
    this.animator.eliminateCell(cellB);

    this.grid[cellA.row][cellA.col] = null;
    this.grid[cellB.row][cellB.col] = null;
    this.eliminatedCount++;

    const { operator } = this.currentTarget;
    this.effects.playEliminateEffect(operator, (xA + xB) / 2, (yA + yB) / 2, () => {
      this.selectedCell = null;
      this.advanceTarget();
      this.isProcessing = false;
    });

    this.updateProgressDisplay();

    if (combo > 1) {
      this.toast.showCombo(combo);
    }

    if (milestone) {
      this.effects.playEliminateEffect(operator, this.cameras.main.width / 2, this.cameras.main.height / 2);
      eventManager.emit('combo:milestone', { level: milestone, count: combo });
    }

    const responseTimeMs = Date.now() - this.matchStartTime;
    this.matchStartTime = Date.now();

    // 知识点级别的数据记录（保留原有逻辑）
    const knowledgePointId = `${operator}-${this.currentTarget.result}`;
    eventManager.emit('answer:correct', {
      knowledgePointId,
      knowledgePointType: 'math',
      responseTimeMs,
    });
    this.mathDataStore.recordAnswer(knowledgePointId, true, responseTimeMs);
    this.progressStore.recordCorrect(knowledgePointId);

    // 关卡级别的正确率记录和里程碑检查
    this.mathDataStore.recordAnswer(this.levelKey, true, responseTimeMs);
    this.mathDataStore.getAccuracy(this.levelKey).then(accuracy => {
      if (accuracy !== null) {
        this.progressStore.checkAccuracyMilestone(this.levelKey, accuracy).then(milestoneResult => {
          if (milestoneResult !== null) {
            this.toast.showAccuracy(milestoneResult);
          }
        });
      }
    });
  }

  private onWrongMatch(cellA: CellSprite, cellB: CellSprite): void {
    this.wrongCount++;
    this.comboTracker.onWrong();

    // 错题反馈：添加到错题区域
    const { operator, result, givenA } = this.currentTarget;
    const opDisplay: Record<string, string> = { '+': '＋', '-': '－', '×': '×', '÷': '÷' };
    const answer = this.currentTarget.answer;
    if (givenA !== null && answer !== null) {
      this.wrongArea.add(`${givenA} ${opDisplay[operator]} ${answer} = ${result}`);
    }

    this.animator.flashCell(cellA, 0xff4444);
    this.animator.flashCell(cellB, 0xff4444);
    this.effects.playWrongSound();

    // 困难模式下翻回去
    if (this.puzzle.faceDown) {
      this.time.delayedCall(400, () => {
        this.animator.unflipCard3D(cellA, this.grid);
        this.animator.unflipCard3D(cellB, this.grid);
      });
    }

    this.deselectCell();
    this.time.delayedCall(600, () => {
      this.isProcessing = false;
    });

    eventManager.emit('answer:wrong', {
      knowledgePointId: `${this.currentTarget.operator}-${this.currentTarget.result}`,
      knowledgePointType: 'math',
    });

    // 知识点级别的数据记录（保留原有逻辑）
    const knowledgePointId = `${this.currentTarget.operator}-${this.currentTarget.result}`;
    this.mathDataStore.recordAnswer(knowledgePointId, false, 0);
    this.progressStore.recordWrong(knowledgePointId);

    // 关卡级别的正确率记录和里程碑检查
    this.mathDataStore.recordAnswer(this.levelKey, false, 0);
    this.mathDataStore.getAccuracy(this.levelKey).then(accuracy => {
      if (accuracy !== null) {
        this.progressStore.checkAccuracyMilestone(this.levelKey, accuracy).then(milestoneResult => {
          if (milestoneResult !== null && milestoneResult.direction === 'down') {
            this.toast.showAccuracy(milestoneResult);
          }
        });
      }
    });
  }

  // ========== 目标推进 ==========

  private advanceTarget(): void {
    this.currentTargetIndex++;
    if (this.currentTargetIndex >= this.puzzle.targetQueue.length) {
      this.onPuzzleComplete();
      return;
    }
    this.currentTarget = this.puzzle.targetQueue[this.currentTargetIndex];
    this.ui.renderTargetCards(this.puzzle, this.currentTargetIndex);
  }

  private updateProgressDisplay(): void {
    this.ui.updateProgressDisplay(this.eliminatedCount, this.totalPairs);
  }

  // ========== 超时处理 ==========

  private onTimeUp(): void {
    // 不再强制结束游戏，允许玩家继续答题完成配对（可获得2★）
    this.isProcessing = false;
    this.timer.onTimeUp();
  }

  // ========== 通关结算 ==========

  private async onPuzzleComplete(): Promise<void> {
    // 停止计时器
    this.timer.stop();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const totalTimeMs = Date.now() - this.gameStartTime;
    const isComplete = this.eliminatedCount >= this.totalPairs;

    // 计算星级
    let stars = 0;
    if (isComplete) {
      if (this.wrongCount === 0 && !this.timer.isTimeUp) {
        stars = 3;  // 全对且未超时
      } else if (this.wrongCount === 0 && this.timer.isTimeUp) {
        stars = 2;  // 全对但超时
      } else {
        stars = 1;  // 有错但通关
      }
    }

    // 保存进度
    if (stars > 0) {
      await this.progressStore.updateLevelProgress(this.levelKey, stars, totalTimeMs);
    }

    // 遮罩
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a, 0.75).setDepth(200);

    // 星级显示
    const starY = height / 2 - 100;
    if (stars > 0) {
      const starText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      this.add.text(width / 2, starY, starText, {
        fontSize: '40px',
        color: '#f0d060',
        fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(201);
    }

    // 通关/超时文字
    const titleText = isComplete ? (this.timer.isTimeUp ? '超时通关' : '通关!') : '时间到';
    this.add.text(width / 2, starY + 50, titleText, {
      fontSize: '36px',
      color: isComplete ? '#f0d060' : '#ff6b6b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);

    // 统计信息
    const accuracy = (this.correctCount + this.wrongCount) > 0
      ? Math.round((this.correctCount / (this.correctCount + this.wrongCount)) * 100)
      : 0;
    const timeSec = (totalTimeMs / 1000).toFixed(1);
    this.add.text(width / 2, starY + 100, `正确 ${this.correctCount}  错误 ${this.wrongCount}  正确率 ${accuracy}%  用时 ${timeSec}s`, {
      fontSize: '16px',
      color: '#a0b0c0',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(201);

    // 按钮
    const btnY = starY + 160;
    const btnGap = 60;
    const btnW = 200;
    const btnH = 45;
    const depth = 201;

    // 再玩一次
    const replayBtn = this.add.container(width / 2, btnY).setDepth(depth);
    const replayBg = this.add.rectangle(0, 0, btnW, btnH, 0x1a3050, 0.9).setStrokeStyle(2, 0xd4a017);
    const replayText = this.add.text(0, 0, '再玩一次', { fontSize: '20px', color: '#f0e0c0', fontFamily: 'Arial' }).setOrigin(0.5);
    replayBtn.add([replayBg, replayText]);
    replayBtn.setSize(btnW, btnH);
    replayBtn.setInteractive({ useHandCursor: true });
    replayBtn.on('pointerdown', () => {
      this.scene.restart({ operator: this.config.operators[0] as CalcOperatorOption, difficulty: this.currentDifficulty });
    });

    // 选择难度
    const diffBtn = this.add.container(width / 2, btnY + btnGap).setDepth(depth);
    const diffBg = this.add.rectangle(0, 0, btnW, btnH, 0x1b2838, 0.9).setStrokeStyle(2, 0x5a7a9a);
    const diffText = this.add.text(0, 0, '选择难度', { fontSize: '20px', color: '#8a9aaa', fontFamily: 'Arial' }).setOrigin(0.5);
    diffBtn.add([diffBg, diffText]);
    diffBtn.setSize(btnW, btnH);
    diffBtn.setInteractive({ useHandCursor: true });
    diffBtn.on('pointerdown', () => {
      this.scene.start('CalcDifficultySelectScene', { operator: this.config.operators[0] });
    });

    // 返回菜单
    const menuBtn = this.add.container(width / 2, btnY + btnGap * 2).setDepth(depth);
    const menuBg = this.add.rectangle(0, 0, btnW, btnH, 0x2a1a3a, 0.9).setStrokeStyle(2, 0x6a4a8a);
    const menuText = this.add.text(0, 0, '返回菜单', { fontSize: '20px', color: '#a080c0', fontFamily: 'Arial' }).setOrigin(0.5);
    menuBtn.add([menuBg, menuText]);
    menuBtn.setSize(btnW, btnH);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}        