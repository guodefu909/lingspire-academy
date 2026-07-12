import * as Phaser from 'phaser';
import type { SentenceData } from '../models/sentence-data';
import { DifficultyAdapter } from '../systems/difficulty-adapter';
import { FeedbackPlayer } from '../systems/feedback-player';
import { eventManager } from '../systems/event-manager';
import { WordDataStore } from '../storage/word-data-store';

export class ChunkBuildScene extends Phaser.Scene {
  private sentences: SentenceData[] = [];
  private currentIndex: number = 0;
  private difficultyAdapter: DifficultyAdapter;
  private feedback!: FeedbackPlayer;
  private wordDataStore: WordDataStore;
  private questionStartTime: number = 0;
  private correctCount: number = 0;
  private totalCount: number = 0;
  private currentSlots: Phaser.GameObjects.Container[] = [];
  private currentOptions: Phaser.GameObjects.Container[] = [];
  private selectedAnswers: Map<number, string> = new Map();
  private timeLimit: number = 60;
  private timeRemaining: number = 30;
  private timerText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private gameEnded: boolean = false;

  constructor() {
    super({ key: 'ChunkBuildScene' });
    this.difficultyAdapter = new DifficultyAdapter();
    this.wordDataStore = new WordDataStore();
  }

  init(data: { difficulty?: string; timeLimit?: number }): void {
    if (data.difficulty) {
      const levelMap: Record<string, number> = {
        novice: 0.1,
        normal: 0.3,
        hard: 0.6,
        master: 0.85,
      };
      if (levelMap[data.difficulty] !== undefined) {
        this.difficultyAdapter.setDifficultyValue(levelMap[data.difficulty]);
      }
    }
    if (data.timeLimit) {
      this.timeLimit = data.timeLimit;
    }
  }

  create(): void {
    const allSentences: SentenceData[] = this.cache.json.get('time-sentences') ?? [];
    this.sentences = this.shuffle([...allSentences]);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.totalCount = 0;
    this.timeRemaining = this.timeLimit;
    this.gameEnded = false;
    this.feedback = new FeedbackPlayer(this);

    this.createBackButton();
    this.createTimer();
    this.startTimer();
    this.displayCurrentSentence();
  }

  private createTimer(): void {
    this.timerText = this.add.text(this.cameras.main.width - 80, 30, `${this.timeRemaining}s`, {
      fontSize: '24px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.timeLimit - 1,
      callback: () => {
        if (this.gameEnded) return;
        this.timeRemaining--;
        if (this.timerText) {
          this.timerText.setText(`${this.timeRemaining}s`);
          if (this.timeRemaining <= 5) this.timerText.setColor('#ff4444');
        }
        if (this.timeRemaining <= 0) this.endGame();
      },
    });
  }

  private endGame(): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    if (this.timerEvent) this.timerEvent.remove();
    this.scene.start('ResultScene', { correctCount: this.correctCount, totalCount: this.totalCount });
  }

  private createBackButton(): void {
    this.add.text(30, 30, '← 返回', {
      fontSize: '20px',
      color: '#c0a0e0',
      fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.timerEvent) this.timerEvent.remove();
        this.scene.start('DifficultySelectScene', { gameMode: 'chunk-build' });
      });
  }

  private displayCurrentSentence(): void {
    this.clearDisplay();
    this.createBackButton();

    if (this.gameEnded) return;

    if (this.currentIndex >= this.sentences.length) {
      this.currentIndex = 0;
    }

    const sentence = this.sentences[this.currentIndex];
    this.questionStartTime = this.time.now;

    this.add.text(
      this.cameras.main.width / 2, 60,
      `已答 ${this.totalCount} 题 | 正确 ${this.correctCount}`,
      { fontSize: '20px', color: '#a090c0', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    if (this.timerText) {
      this.timerText = this.add.text(this.cameras.main.width - 80, 30, `${this.timeRemaining}s`, {
        fontSize: '24px', color: this.timeRemaining <= 5 ? '#ff4444' : '#ffcc00',
        fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    const level = this.difficultyAdapter.getDifficultyLevel();
    switch (level) {
      case 'novice':
        this.renderNoviceMode(sentence);
        break;
      case 'normal':
        this.renderNormalMode(sentence);
        break;
      case 'hard':
        this.renderHardMode(sentence);
        break;
      case 'master':
        this.renderMasterMode(sentence);
        break;
    }
  }

  private renderNoviceMode(sentence: SentenceData): void {
    const missingIndex = Math.floor(Math.random() * sentence.chunks.length);
    const missingChunk = sentence.chunks[missingIndex];
    const chunkChinese = sentence.chunkTranslations[missingIndex];

    this.add.text(
      this.cameras.main.width / 2, 110,
      chunkChinese,
      { fontSize: '24px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold' }
    ).setOrigin(0.5);

    this.renderSentenceWithGap(sentence, missingIndex);

    const options = this.generateOptions(missingChunk, sentence.distractors, 4);
    this.renderClickOptions(options, (selected: string) => {
      this.handleClickAnswer(selected, missingChunk, sentence);
    });
  }

  private renderNormalMode(sentence: SentenceData): void {
    const missingIndex = Math.floor(Math.random() * sentence.chunks.length);
    const missingChunk = sentence.chunks[missingIndex];

    this.add.text(
      this.cameras.main.width / 2, 110,
      sentence.translation,
      { fontSize: '22px', color: '#ffcc00', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    this.renderSentenceWithGap(sentence, missingIndex);

    const options = this.generateOptions(missingChunk, sentence.distractors, 4);
    this.renderClickOptions(options, (selected: string) => {
      this.handleClickAnswer(selected, missingChunk, sentence);
    });
  }

  private renderHardMode(sentence: SentenceData): void {
    this.add.text(
      this.cameras.main.width / 2, 110,
      sentence.translation,
      { fontSize: '22px', color: '#ffcc00', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    const missingIndices = this.pickMissingIndices(sentence.chunks.length, Math.min(2, sentence.chunks.length - 1));
    this.renderSentenceWithMultipleGaps(sentence, missingIndices);

    const correctChunks = missingIndices.map((i) => sentence.chunks[i]);
    const allOptions = this.shuffle([...correctChunks, ...sentence.distractors]);

    this.renderDraggableOptions(allOptions, (selected: string, slotIndex: number, chunkContainer: Phaser.GameObjects.Container) => {
      this.handleDragAnswer(selected, slotIndex, sentence, missingIndices, chunkContainer);
    });
  }

  private renderMasterMode(sentence: SentenceData): void {
    this.add.text(
      this.cameras.main.width / 2, 110,
      sentence.translation,
      { fontSize: '22px', color: '#ffcc00', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    this.add.text(
      this.cameras.main.width / 2, 150,
      '自由组合出完整句子',
      { fontSize: '18px', color: '#8070a0', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    const centerY = this.cameras.main.height / 2 - 30;
    const chunkWidth = 110;
    const totalWidth = sentence.chunks.length * chunkWidth;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    for (let i = 0; i < sentence.chunks.length; i++) {
      const slot = this.createSlot(
        startX + i * chunkWidth + chunkWidth / 2,
        centerY,
        chunkWidth - 5,
        sentence.chunks[i]
      );
      this.currentSlots.push(slot);
    }

    const allOptions = this.shuffle([...sentence.chunks, ...sentence.distractors]);
    const poolY = centerY + 130;
    const maxWidth = this.cameras.main.width - 40;
    const charWidth = 11;
    const optW = Math.min(120, Math.max(70, Math.max(...allOptions.map(o => o.length)) * charWidth + 16));
    const totalOptWidth = Math.min(allOptions.length * optW, maxWidth);
    const actualOptW = totalOptWidth / allOptions.length;
    const poolStartX = (this.cameras.main.width - totalOptWidth) / 2;

    allOptions.forEach((option, i) => {
      const chunk = this.createDraggableChunk(
        poolStartX + i * actualOptW + actualOptW / 2,
        poolY,
        option,
        (targetSlot: Phaser.GameObjects.Container, chunkContainer: Phaser.GameObjects.Container) => {
          const slotIdx = this.currentSlots.indexOf(targetSlot);
          this.handleMasterDrop(option, targetSlot, sentence, slotIdx, chunkContainer);
        }
      );
      this.currentOptions.push(chunk);
    });
  }

  private renderSentenceWithGap(sentence: SentenceData, missingIndex: number): void {
    const centerY = this.cameras.main.height / 2 - 50;
    const chunkWidth = 110;
    const totalWidth = sentence.chunks.length * chunkWidth;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    for (let i = 0; i < sentence.chunks.length; i++) {
      const x = startX + i * chunkWidth + chunkWidth / 2;
      if (i === missingIndex) {
        const slot = this.createSlot(x, centerY, chunkWidth - 5, sentence.chunks[i]);
        this.currentSlots.push(slot);
      } else {
        this.add.text(x, centerY, sentence.chunks[i], {
          fontSize: '22px',
          color: '#f0e0ff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5);
      }
    }
  }

  private renderSentenceWithMultipleGaps(sentence: SentenceData, missingIndices: number[]): void {
    const centerY = this.cameras.main.height / 2 - 50;
    const chunkWidth = 110;
    const totalWidth = sentence.chunks.length * chunkWidth;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    for (let i = 0; i < sentence.chunks.length; i++) {
      const x = startX + i * chunkWidth + chunkWidth / 2;
      if (missingIndices.includes(i)) {
        const slot = this.createSlot(x, centerY, chunkWidth - 5, sentence.chunks[i]);
        slot.setData('missingIndex', i);
        this.currentSlots.push(slot);
      } else {
        this.add.text(x, centerY, sentence.chunks[i], {
          fontSize: '22px',
          color: '#f0e0ff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5);
      }
    }
  }

  private generateOptions(correct: string, distractors: string[], count: number): string[] {
    const shuffled = this.shuffle([...distractors]);
    const selected = shuffled.slice(0, count - 1);
    return this.shuffle([correct, ...selected]);
  }

  private renderClickOptions(options: string[], onSelect: (selected: string) => void): void {
    const poolY = this.cameras.main.height / 2 + 120;
    const maxWidth = this.cameras.main.width - 40;
    const charWidth = 12;
    const optionWidth = Math.min(180, Math.max(90, Math.max(...options.map(o => o.length)) * charWidth + 20));
    const totalWidth = Math.min(options.length * optionWidth, maxWidth);
    const actualOptionWidth = totalWidth / options.length;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    options.forEach((option, i) => {
      const x = startX + i * actualOptionWidth + actualOptionWidth / 2;
      const container = this.add.container(x, poolY);

      const bg = this.add.rectangle(0, 0, actualOptionWidth - 6, 55, 0x8b6eaa, 0.9)
        .setStrokeStyle(2, 0xc0a0e0);
      const fontSize = option.length > 12 ? '16px' : '20px';
      const text = this.add.text(0, 0, option, {
        fontSize,
        color: '#f0e0ff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setSize(actualOptionWidth - 6, 55);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => bg.setFillStyle(0xab8eca, 1));
      container.on('pointerout', () => bg.setFillStyle(0x8b6eaa, 0.9));
      container.on('pointerdown', () => {
        this.feedback.playSnap();
        onSelect(option);
      });

      this.currentOptions.push(container);
    });
  }

  private renderDraggableOptions(
    options: string[],
    onDrop: (selected: string, slotIndex: number, chunkContainer: Phaser.GameObjects.Container) => void
  ): void {
    const poolY = this.cameras.main.height / 2 + 130;
    const maxWidth = this.cameras.main.width - 40;
    const charWidth = 11;
    const optionWidth = Math.min(120, Math.max(70, Math.max(...options.map(o => o.length)) * charWidth + 16));
    const totalWidth = Math.min(options.length * optionWidth, maxWidth);
    const actualWidth = totalWidth / options.length;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    options.forEach((option, i) => {
      const x = startX + i * actualWidth + actualWidth / 2;
      const chunk = this.createDraggableChunk(x, poolY, option, (targetSlot, chunkContainer) => {
        const slotIdx = this.currentSlots.indexOf(targetSlot);
        onDrop(option, slotIdx, chunkContainer);
      });
      this.currentOptions.push(chunk);
    });
  }

  private createSlot(
    x: number, y: number, width: number, correctValue: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, 50, 0x3a2a4a, 0.6)
      .setStrokeStyle(2, 0x6b4e8a);
    const placeholder = this.add.text(0, 0, '___', {
      fontSize: '20px', color: '#6b4e8a', fontFamily: 'Arial',
    }).setOrigin(0.5);

    container.add([bg, placeholder]);
    container.setSize(width, 50);
    container.setData('correctValue', correctValue.toLowerCase());
    container.setData('filled', false);
    container.setData('bg', bg);
    container.setData('placeholder', placeholder);
    return container;
  }

  private createDraggableChunk(
    x: number, y: number, text: string,
    onDrop: (slot: Phaser.GameObjects.Container, chunkContainer: Phaser.GameObjects.Container) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 90, 45, 0x8b6eaa, 0.9)
      .setStrokeStyle(2, 0xc0a0e0);
    const label = this.add.text(0, 0, text, {
      fontSize: '18px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(90, 45);
    container.setInteractive({ useHandCursor: true });
    this.input.setDraggable(container);

    container.setData('text', text.toLowerCase());
    container.setData('originalX', x);
    container.setData('originalY', y);

    container.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      container.x = dragX;
      container.y = dragY;
    });

    container.on('dragend', () => {
      const nearestSlot = this.findNearestSlot(container);
      if (nearestSlot && !nearestSlot.getData('filled')) {
        onDrop(nearestSlot, container);
      } else {
        this.tweens.add({
          targets: container,
          x: container.getData('originalX'),
          y: container.getData('originalY'),
          duration: 200,
          ease: 'Back.easeOut',
        });
      }
    });

    return container;
  }

  private findNearestSlot(chunk: Phaser.GameObjects.Container): Phaser.GameObjects.Container | null {
    let nearest: Phaser.GameObjects.Container | null = null;
    let minDist = Infinity;

    for (const slot of this.currentSlots) {
      if (slot.getData('filled')) continue;
      const dist = Phaser.Math.Distance.Between(chunk.x, chunk.y, slot.x, slot.y);
      if (dist < 50 && dist < minDist) {
        minDist = dist;
        nearest = slot;
      }
    }
    return nearest;
  }

  private handleClickAnswer(selected: string, correct: string, sentence: SentenceData): void {
    const isCorrect = selected.toLowerCase() === correct.toLowerCase();
    const responseTime = this.time.now - this.questionStartTime;

    if (isCorrect) {
      if (this.currentSlots.length > 0) {
        this.fillSlot(this.currentSlots[0], correct);
      }
      this.feedback.playSnap();
      this.time.delayedCall(500, () => this.onSentenceComplete(sentence, true, responseTime));
    } else {
      this.feedback.playBounce();
      this.cameras.main.shake(100, 0.005);
      this.totalCount++;
      this.wordDataStore.recordAnswer(sentence.id, 'sentence', false, responseTime);
      this.wordDataStore.incrementWrongCount(sentence.id);
      this.wordDataStore.getWrongCount(sentence.id).then((wc) => {
        if (wc >= 3) {
          eventManager.emit('answer:wrong', { knowledgePointId: sentence.id, knowledgePointType: 'sentence' });
        }
      });
      this.time.delayedCall(1500, () => { this.currentIndex++; this.displayCurrentSentence(); });
    }
  }

  private handleDragAnswer(
    selected: string, slotIdx: number,
    sentence: SentenceData, _missingIndices: number[],
    chunkContainer?: Phaser.GameObjects.Container
  ): void {
    const slot = this.currentSlots[slotIdx];
    if (!slot || slot.getData('filled')) return;

    const correctValue = slot.getData('correctValue') as string;
    const isCorrect = selected.toLowerCase() === correctValue;

    if (isCorrect) {
      this.fillSlot(slot, selected);
      this.feedback.playSnap();
      if (chunkContainer) chunkContainer.setVisible(false);

      const allFilled = this.currentSlots.every((s) => s.getData('filled'));
      if (allFilled) {
        const responseTime = this.time.now - this.questionStartTime;
        this.time.delayedCall(500, () => this.onSentenceComplete(sentence, true, responseTime));
      }
    } else {
      this.feedback.playBounce();
      this.cameras.main.shake(100, 0.005);
      const responseTime = this.time.now - this.questionStartTime;
      this.totalCount++;
      this.wordDataStore.recordAnswer(sentence.id, 'sentence', false, responseTime);
      this.wordDataStore.incrementWrongCount(sentence.id);
      this.wordDataStore.getWrongCount(sentence.id).then((wc) => {
        if (wc >= 3) {
          eventManager.emit('answer:wrong', { knowledgePointId: sentence.id, knowledgePointType: 'sentence' });
        }
      });
      this.time.delayedCall(1500, () => { this.currentIndex++; this.displayCurrentSentence(); });
    }
  }

  private handleMasterDrop(
    selected: string, slot: Phaser.GameObjects.Container,
    sentence: SentenceData, slotIdx: number,
    chunkContainer?: Phaser.GameObjects.Container
  ): void {
    if (slot.getData('filled')) return;

    const correctValue = slot.getData('correctValue') as string;
    const isCorrect = selected.toLowerCase() === correctValue;

    if (isCorrect) {
      this.fillSlot(slot, selected);
      this.feedback.playSnap();
      if (chunkContainer) chunkContainer.setVisible(false);
      this.selectedAnswers.set(slotIdx, selected);

      const allFilled = this.currentSlots.every((s) => s.getData('filled'));
      if (allFilled) {
        const responseTime = this.time.now - this.questionStartTime;
        this.time.delayedCall(500, () => this.onSentenceComplete(sentence, true, responseTime));
      }
    } else {
      this.feedback.playBounce();
      this.cameras.main.shake(100, 0.005);
      const responseTime = this.time.now - this.questionStartTime;
      this.totalCount++;
      this.wordDataStore.recordAnswer(sentence.id, 'sentence', false, responseTime);
      this.wordDataStore.incrementWrongCount(sentence.id);
      this.wordDataStore.getWrongCount(sentence.id).then((wc) => {
        if (wc >= 3) {
          eventManager.emit('answer:wrong', { knowledgePointId: sentence.id, knowledgePointType: 'sentence' });
        }
      });
      this.time.delayedCall(1500, () => { this.currentIndex++; this.displayCurrentSentence(); });
    }
  }

  private fillSlot(slot: Phaser.GameObjects.Container, value: string): void {
    slot.setData('filled', true);
    const bg = slot.getData('bg') as Phaser.GameObjects.Rectangle;
    const placeholder = slot.getData('placeholder') as Phaser.GameObjects.Text;
    bg.setFillStyle(0x5a4a7a, 0.8).setStrokeStyle(2, 0xc0a0e0);
    placeholder.setText(value);
    placeholder.setColor('#f0e0ff');
  }

  private onSentenceComplete(sentence: SentenceData, _correct: boolean, responseTime: number): void {
    this.correctCount++;
    this.totalCount++;
    this.feedback.playExplosion();
    this.feedback.speak(sentence.sentence.replace(/[.?]/g, ''));

    eventManager.emit('answer:correct', {
      knowledgePointId: sentence.id,
      knowledgePointType: 'sentence',
      responseTimeMs: responseTime,
    });

    this.wordDataStore.recordAnswer(sentence.id, 'sentence', true, responseTime);

    this.time.delayedCall(1800, () => {
      this.currentIndex++;
      this.displayCurrentSentence();
    });
  }

  private pickMissingIndices(total: number, count: number): number[] {
    const indices = Array.from({ length: total }, (_, i) => i);
    return this.shuffle(indices).slice(0, count).sort((a, b) => a - b);
  }

  private clearDisplay(): void {
    this.currentSlots.forEach((s) => s.destroy());
    this.currentOptions.forEach((o) => o.destroy());
    this.currentSlots = [];
    this.currentOptions = [];
    this.selectedAnswers.clear();
    this.children.removeAll(true);
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
