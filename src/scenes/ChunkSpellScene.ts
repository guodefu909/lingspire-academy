import * as Phaser from 'phaser';
import type { WordData } from '../models/word-data';
import { DifficultyAdapter } from '../systems/difficulty-adapter';
import { ComboTracker } from '../systems/combo-tracker';
import { FeedbackPlayer } from '../systems/feedback-player';
import { eventManager } from '../systems/event-manager';
import { WordDataStore } from '../storage/word-data-store';

interface ChunkItem {
  text: string;
  isVowel: boolean;
  slotIndex: number;
}

export class ChunkSpellScene extends Phaser.Scene {
  private words: WordData[] = [];
  private currentWordIndex: number = 0;
  private difficultyAdapter: DifficultyAdapter;
  private comboTracker: ComboTracker;
  private feedback!: FeedbackPlayer;
  private wordDataStore: WordDataStore;
  private questionStartTime: number = 0;
  private correctCount: number = 0;
  private totalCount: number = 0;
  private currentSlots: Phaser.GameObjects.Container[] = [];
  private currentPool: Phaser.GameObjects.Container[] = [];
  private timeLimit: number = 60;
  private timeRemaining: number = 30;
  private timerText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private gameEnded: boolean = false;
  private gameMode: string = 'chunk-spell';

  constructor() {
    super({ key: 'ChunkSpellScene' });
    this.difficultyAdapter = new DifficultyAdapter();
    this.comboTracker = new ComboTracker();
    this.wordDataStore = new WordDataStore();
  }

  init(data: { difficulty?: string; timeLimit?: number }): void {
    this.gameMode = 'chunk-spell';
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

  private goBack(): void {
    if (this.timerEvent) this.timerEvent.remove();
    this.scene.start('DifficultySelectScene', { gameMode: this.gameMode });
  }

  async create(): Promise<void> {
    const months: WordData[] = this.cache.json.get('months') ?? [];
    const weekdays: WordData[] = this.cache.json.get('weekdays') ?? [];
    const allWords = [...months, ...weekdays];

    this.words = this.shuffle([...allWords]);
    this.currentWordIndex = 0;
    this.correctCount = 0;
    this.totalCount = 0;
    this.comboTracker.reset();
    this.timeRemaining = this.timeLimit;
    this.gameEnded = false;

    this.feedback = new FeedbackPlayer(this);

    this.createBackButton();
    this.createTimer();
    this.startTimer();
    this.displayCurrentWord();
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
          if (this.timeRemaining <= 5) {
            this.timerText.setColor('#ff4444');
          }
        }
        if (this.timeRemaining <= 0) {
          this.endGame();
        }
      },
    });
  }

  private endGame(): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    if (this.timerEvent) this.timerEvent.remove();
    this.showResults();
  }

  private createBackButton(): void {
    this.add.text(30, 30, '← 返回', {
      fontSize: '20px',
      color: '#c0a0e0',
      fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true });

    this.input.on('gameobjectdown', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Text && (gameObject as Phaser.GameObjects.Text).text === '← 返回') {
        this.goBack();
      }
    });
  }

  private displayCurrentWord(): void {
    this.clearDisplay();

    if (this.gameEnded) return;

    if (this.currentWordIndex >= this.words.length) {
      this.currentWordIndex = 0;
    }

    const word = this.words[this.currentWordIndex];
    this.questionStartTime = this.time.now;

    this.add.text(
      this.cameras.main.width / 2, 80,
      `已答 ${this.totalCount} 题 | 正确 ${this.correctCount}`,
      { fontSize: '20px', color: '#a090c0', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    this.add.text(
      this.cameras.main.width / 2, 120,
      word.meaning,
      { fontSize: '28px', color: '#e0d0f0', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    this.add.text(
      this.cameras.main.width / 2, 155,
      word.phonetic,
      { fontSize: '18px', color: '#8070a0', fontFamily: 'Arial', fontStyle: 'italic' }
    ).setOrigin(0.5);

    if (this.timerText) {
      this.timerText = this.add.text(this.cameras.main.width - 80, 30, `${this.timeRemaining}s`, {
        fontSize: '24px', color: this.timeRemaining <= 5 ? '#ff4444' : '#ffcc00',
        fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    const level = this.difficultyAdapter.getDifficultyLevel();
    switch (level) {
      case 'novice': this.renderNoviceMode(word); break;
      case 'normal': this.renderNormalMode(word); break;
      case 'hard': this.renderHardMode(word); break;
      case 'master': this.renderMasterMode(word); break;
    }
  }

  private renderNoviceMode(word: WordData): void {
    const centerY = this.cameras.main.height / 2;
    const chunkWidth = 70;
    const segments: ChunkItem[] = this.splitByVowels(word);
    const totalWidth = segments.length * chunkWidth;
    let x = (this.cameras.main.width - totalWidth) / 2;

    for (const segment of segments) {
      const cx = x + chunkWidth / 2;
      if (segment.isVowel) {
        const slot = this.createSlot(cx, centerY, chunkWidth, segment.text, true);
        this.currentSlots.push(slot);
      } else {
        this.add.text(cx, centerY, segment.text, {
          fontSize: '36px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5);
      }
      x += chunkWidth;
    }

    const vowels = word.vowelChunks.map((vc) => vc.value);
    const shuffled = this.shuffle(vowels);
    const poolY = centerY + 120;
    const poolStartX = (this.cameras.main.width - shuffled.length * 70) / 2;

    shuffled.forEach((vowel, i) => {
      const chunk = this.createChunk(poolStartX + i * 70 + 35, poolY, vowel,
        (targetSlot, chunkContainer) => this.handleDrop(vowel, targetSlot, word, chunkContainer));
      this.currentPool.push(chunk);
    });
  }

  private renderNormalMode(word: WordData): void {
    const centerY = this.cameras.main.height / 2;
    const chunkWidth = 90;
    const totalWidth = word.syllableChunks.length * chunkWidth;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    word.syllableChunks.forEach((_, i) => {
      const x = startX + i * chunkWidth + chunkWidth / 2;
      const slot = this.createSlot(x, centerY, chunkWidth, word.syllableChunks[i], false);
      this.currentSlots.push(slot);
    });

    const shuffled = this.shuffle([...word.syllableChunks]);
    const poolY = centerY + 120;
    const poolStartX = (this.cameras.main.width - shuffled.length * 90) / 2;

    shuffled.forEach((syllable, i) => {
      const chunk = this.createChunk(poolStartX + i * 90 + 45, poolY, syllable,
        (targetSlot, chunkContainer) => this.handleDrop(syllable, targetSlot, word, chunkContainer));
      this.currentPool.push(chunk);
    });
  }

  private renderHardMode(word: WordData): void {
    const centerY = this.cameras.main.height / 2;
    const chunkWidth = 90;
    const totalWidth = word.syllableChunks.length * chunkWidth;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    word.syllableChunks.forEach((_, i) => {
      const x = startX + i * chunkWidth + chunkWidth / 2;
      const slot = this.createSlot(x, centerY, chunkWidth, word.syllableChunks[i], false);
      this.currentSlots.push(slot);
    });

    const allOptions = this.shuffle([...word.syllableChunks, ...word.distractors]);
    const poolY = centerY + 120;
    const poolStartX = (this.cameras.main.width - allOptions.length * 80) / 2;

    allOptions.forEach((option, i) => {
      const chunk = this.createChunk(poolStartX + i * 80 + 40, poolY, option,
        (targetSlot, chunkContainer) => this.handleDrop(option, targetSlot, word, chunkContainer));
      this.currentPool.push(chunk);
    });
  }

  private renderMasterMode(word: WordData): void {
    const centerY = this.cameras.main.height / 2;

    this.add.text(this.cameras.main.width / 2, centerY - 80, '自由组合出完整单词', {
      fontSize: '20px', color: '#a090c0', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const slotWidth = 120;
    const totalWidth = word.syllableChunks.length * slotWidth;
    const startX = (this.cameras.main.width - totalWidth) / 2;

    for (let i = 0; i < word.syllableChunks.length; i++) {
      const slot = this.createSlot(startX + i * slotWidth + slotWidth / 2, centerY, slotWidth - 5, word.syllableChunks[i], false);
      this.currentSlots.push(slot);
    }

    const allOptions = this.shuffle([...word.syllableChunks, ...word.distractors]);
    const poolY = centerY + 120;
    const poolStartX = (this.cameras.main.width - allOptions.length * 80) / 2;

    allOptions.forEach((option, i) => {
      const chunk = this.createChunk(poolStartX + i * 80 + 40, poolY, option,
        (targetSlot, chunkContainer) => this.handleDrop(option, targetSlot, word, chunkContainer));
      this.currentPool.push(chunk);
    });
  }

  private splitByVowels(word: WordData): ChunkItem[] {
    const w = word.word;
    const items: ChunkItem[] = [];
    let pos = 0;

    for (const vc of word.vowelChunks) {
      const idx = w.indexOf(vc.value, pos);
      if (idx === -1) continue;

      if (idx > pos) {
        items.push({ text: w.substring(pos, idx), isVowel: false, slotIndex: -1 });
      }
      items.push({ text: vc.value, isVowel: true, slotIndex: vc.index });
      pos = idx + vc.value.length;
    }

    if (pos < w.length) {
      items.push({ text: w.substring(pos), isVowel: false, slotIndex: -1 });
    }

    return items;
  }

  private createSlot(x: number, y: number, width: number, correctValue: string, _isVowel: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width - 5, 55, 0x3a2a4a, 0.6).setStrokeStyle(2, 0x6b4e8a);
    const placeholder = this.add.text(0, 0, '___', {
      fontSize: '28px', color: '#6b4e8a', fontFamily: 'Arial',
    }).setOrigin(0.5);

    container.add([bg, placeholder]);
    container.setSize(width - 5, 55);
    container.setData('correctValue', correctValue.toLowerCase());
    container.setData('filled', false);
    container.setData('bg', bg);
    container.setData('placeholder', placeholder);
    return container;
  }

  private createChunk(
    x: number, y: number, text: string,
    onDrop: (slot: Phaser.GameObjects.Container, chunk: Phaser.GameObjects.Container) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 60, 50, 0x8b6eaa, 0.9).setStrokeStyle(2, 0xc0a0e0);
    const label = this.add.text(0, 0, text, {
      fontSize: '22px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(60, 50);
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
          duration: 200, ease: 'Back.easeOut',
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

  private handleDrop(
    value: string,
    slot: Phaser.GameObjects.Container,
    word: WordData,
    chunkContainer: Phaser.GameObjects.Container
  ): void {
    const correct = slot.getData('correctValue') === value.toLowerCase();

    if (correct) {
      this.fillSlot(slot, value);
      this.feedback.playSnap();
      chunkContainer.setVisible(false);
      this.checkWordComplete(word);
    } else {
      this.feedback.playBounce();
      this.shakeChunk(chunkContainer);

      const correctValue = slot.getData('correctValue') as string;
      this.showWrongFeedback(slot, correctValue);

      const responseTime = this.time.now - this.questionStartTime;
      this.totalCount++;
      this.comboTracker.onWrong();
      this.wordDataStore.recordAnswer(word.id, 'word', false, responseTime);
      this.wordDataStore.incrementWrongCount(word.id);

      this.wordDataStore.getWrongCount(word.id).then((wrongCount) => {
        if (wrongCount >= 3) {
          eventManager.emit('answer:wrong', {
            knowledgePointId: word.id,
            knowledgePointType: 'word',
          });
        }
      });

      this.time.delayedCall(1500, () => {
        this.currentWordIndex++;
        this.displayCurrentWord();
      });
    }
  }

  private showWrongFeedback(slot: Phaser.GameObjects.Container, correctValue: string): void {
    const bg = slot.getData('bg') as Phaser.GameObjects.Rectangle;
    const placeholder = slot.getData('placeholder') as Phaser.GameObjects.Text;
    bg.setFillStyle(0x5a2a2a, 0.8).setStrokeStyle(2, 0xff4444);
    placeholder.setText(correctValue);
    placeholder.setColor('#ff6666');
  }

  private fillSlot(slot: Phaser.GameObjects.Container, value: string): void {
    slot.setData('filled', true);
    const bg = slot.getData('bg') as Phaser.GameObjects.Rectangle;
    const placeholder = slot.getData('placeholder') as Phaser.GameObjects.Text;
    bg.setFillStyle(0x5a4a7a, 0.8).setStrokeStyle(2, 0xc0a0e0);
    placeholder.setText(value);
    placeholder.setColor('#f0e0ff');
  }

  private checkWordComplete(word: WordData): void {
    const allFilled = this.currentSlots.every((s) => s.getData('filled'));
    if (!allFilled) return;

    const responseTime = this.time.now - this.questionStartTime;
    this.correctCount++;
    this.totalCount++;
    const combo = this.comboTracker.onCorrect();

    this.feedback.playExplosion();

    this.time.delayedCall(300, () => {
      this.feedback.speak(word.word);
    });

    eventManager.emit('answer:correct', {
      knowledgePointId: word.id,
      knowledgePointType: 'word',
      responseTimeMs: responseTime,
    });

    this.wordDataStore.recordAnswer(word.id, 'word', true, responseTime);

    const milestone = this.comboTracker.isMilestone();
    if (milestone) {
      this.showComboEffect(milestone as 3 | 5);
      this.feedback.playCombo();
      eventManager.emit('combo:milestone', { level: milestone as 3 | 5, count: combo });
    }

    this.time.delayedCall(1500, () => {
      this.currentWordIndex++;
      this.displayCurrentWord();
    });
  }

  private showComboEffect(level: 3 | 5): void {
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      `Combo x${level}!`,
      {
        fontSize: level === 5 ? '48px' : '36px',
        color: level === 5 ? '#ffaa00' : '#ff6600',
        fontFamily: 'Arial', fontStyle: 'bold',
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text, alpha: 0, y: '-=50',
          duration: 800, delay: 500,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  private shakeChunk(chunkContainer: Phaser.GameObjects.Container): void {
    this.cameras.main.shake(100, 0.005);
    this.tweens.add({
      targets: chunkContainer,
      x: { from: chunkContainer.x - 5, to: chunkContainer.x + 5 },
      duration: 50, repeat: 2, yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: chunkContainer,
          x: chunkContainer.getData('originalX'),
          y: chunkContainer.getData('originalY'),
          duration: 200, ease: 'Back.easeOut',
        });
      },
    });
  }

  private clearDisplay(): void {
    this.currentSlots.forEach((s) => s.destroy());
    this.currentPool.forEach((p) => p.destroy());
    this.currentSlots = [];
    this.currentPool = [];
    this.children.removeAll(true);
    this.createBackButton();
  }

  private showResults(): void {
    this.scene.start('ResultScene', {
      correctCount: this.correctCount,
      totalCount: this.totalCount,
    });
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
