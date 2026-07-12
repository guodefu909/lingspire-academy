import * as Phaser from 'phaser';
import { FeedbackPlayer } from '../systems/feedback-player';
import { eventManager } from '../systems/event-manager';
import { WordDataStore } from '../storage/word-data-store';

interface TimeQuestion {
  hour: number;
  minute: number;
  correctReadings: string[];
  wrongReadings: string[];
}

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six',
  'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty', 'thirty-one', 'thirty-two', 'thirty-three',
  'thirty-four', 'thirty-five', 'thirty-six', 'thirty-seven', 'thirty-eight', 'thirty-nine',
  'forty', 'forty-one', 'forty-two', 'forty-three', 'forty-four', 'forty-five', 'forty-six',
  'forty-seven', 'forty-eight', 'forty-nine', 'fifty', 'fifty-one', 'fifty-two', 'fifty-three',
  'fifty-four', 'fifty-five', 'fifty-six', 'fifty-seven', 'fifty-eight', 'fifty-nine'];

type Difficulty = 'novice' | 'normal' | 'hard' | 'master';

export class TimeMatchScene extends Phaser.Scene {
  private questions: TimeQuestion[] = [];
  private currentIndex: number = 0;
  private feedback!: FeedbackPlayer;
  private wordDataStore: WordDataStore;
  private correctCount: number = 0;
  private totalCount: number = 0;
  private questionStartTime: number = 0;
  private difficulty: Difficulty = 'normal';
  private timeLimit: number = 60;
  private timeRemaining: number = 60;
  private timerText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private gameEnded: boolean = false;

  constructor() {
    super({ key: 'TimeMatchScene' });
    this.wordDataStore = new WordDataStore();
  }

  init(data: { difficulty?: string; timeLimit?: number }): void {
    if (data.difficulty) {
      this.difficulty = data.difficulty as Difficulty;
    }
    if (data.timeLimit) {
      this.timeLimit = data.timeLimit;
    }
  }

  create(): void {
    this.questions = this.generateQuestions(this.difficulty, 20);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.totalCount = 0;
    this.timeRemaining = this.timeLimit;
    this.gameEnded = false;
    this.feedback = new FeedbackPlayer(this);

    this.createBackButton();
    this.createTimer();
    this.startTimer();
    this.displayQuestion();
  }

  private generateQuestions(difficulty: Difficulty, count: number): TimeQuestion[] {
    const questions: TimeQuestion[] = [];
    const possibleMinutes: number[] = this.getPossibleMinutes(difficulty);

    for (let i = 0; i < count; i++) {
      const hour = Math.floor(Math.random() * 12) + 1;
      const minute = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
      questions.push(this.buildQuestion(hour, minute));
    }
    return questions;
  }

  private getPossibleMinutes(difficulty: Difficulty): number[] {
    switch (difficulty) {
      case 'novice':
        return [0];
      case 'normal':
        return [0, 15, 30, 45];
      case 'hard':
        return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      case 'master':
        return Array.from({ length: 60 }, (_, i) => i);
      default:
        return [0];
    }
  }

  private buildQuestion(hour: number, minute: number): TimeQuestion {
    const correctReadings: string[] = [];
    const wrongReadings: string[] = [];
    const wrongHour = hour === 12 ? 1 : hour + 1;

    if (minute === 0) {
      correctReadings.push(`${NUMBERS[hour]} o'clock`);
      wrongReadings.push(`${NUMBERS[wrongHour]} o'clock`);
      wrongReadings.push(`half past ${NUMBERS[hour]}`);
    } else if (minute === 15) {
      correctReadings.push(`quarter past ${NUMBERS[hour]}`);
      correctReadings.push(`${NUMBERS[hour]} fifteen`);
      wrongReadings.push(`quarter to ${NUMBERS[hour]}`);
      wrongReadings.push(`quarter past ${NUMBERS[wrongHour]}`);
    } else if (minute === 30) {
      correctReadings.push(`half past ${NUMBERS[hour]}`);
      correctReadings.push(`${NUMBERS[hour]} thirty`);
      wrongReadings.push(`half past ${NUMBERS[wrongHour]}`);
      wrongReadings.push(`${NUMBERS[hour]} o'clock`);
    } else if (minute === 45) {
      correctReadings.push(`quarter to ${NUMBERS[wrongHour]}`);
      correctReadings.push(`${NUMBERS[hour]} forty-five`);
      wrongReadings.push(`quarter past ${NUMBERS[hour]}`);
      wrongReadings.push(`quarter to ${NUMBERS[hour]}`);
    } else {
      correctReadings.push(`${NUMBERS[hour]} ${NUMBERS[minute]}`);
      wrongReadings.push(`${NUMBERS[wrongHour]} ${NUMBERS[minute]}`);
      wrongReadings.push(`${NUMBERS[hour]} ${NUMBERS[minute === 0 ? 30 : 0]}`);
    }

    return { hour, minute, correctReadings, wrongReadings };
  }

  private createBackButton(): void {
    this.add.text(30, 30, '← 返回', {
      fontSize: '20px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.timerEvent) this.timerEvent.remove();
        this.scene.start('DifficultySelectScene', { gameMode: 'time-match' });
      });
  }

  private createTimer(): void {
    this.timerText = this.add.text(this.cameras.main.width - 80, 30, `${this.timeRemaining}s`, {
      fontSize: '24px', color: '#ffcc00', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000, repeat: this.timeLimit - 1,
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

  private displayQuestion(): void {
    this.children.removeAll(true);
    this.createBackButton();

    this.timerText = this.add.text(this.cameras.main.width - 80, 30, `${this.timeRemaining}s`, {
      fontSize: '24px', color: this.timeRemaining <= 5 ? '#ff4444' : '#ffcc00',
      fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (this.gameEnded) return;
    if (this.currentIndex >= this.questions.length) this.currentIndex = 0;

    const question = this.questions[this.currentIndex];
    this.questionStartTime = this.time.now;

    this.add.text(this.cameras.main.width / 2, 80,
      `已答 ${this.totalCount} | 正确 ${this.correctCount}`,
      { fontSize: '20px', color: '#a090c0', fontFamily: 'Arial' }).setOrigin(0.5);

    this.drawClock(this.cameras.main.width / 2, 300, question.hour, question.minute);

    const allOptions = this.shuffle([...question.correctReadings, ...question.wrongReadings]);
    this.renderTimeOptions(allOptions, question);
  }

  private drawClock(cx: number, cy: number, hour: number, minute: number): void {
    const g = this.add.graphics();
    const radius = 100;

    g.lineStyle(4, 0xc0a0e0, 1);
    g.strokeCircle(cx, cy, radius);

    g.fillStyle(0x3a2a4a, 0.6);
    g.fillCircle(cx, cy, radius);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + Math.cos(angle) * (radius - 12);
      const y1 = cy + Math.sin(angle) * (radius - 12);
      const x2 = cx + Math.cos(angle) * (radius - 2);
      const y2 = cy + Math.sin(angle) * (radius - 2);
      g.lineStyle(2, 0x8b6eaa, 0.8);
      g.lineBetween(x1, y1, x2, y2);
    }

    const hourAngle = ((hour % 12) / 12 + (minute / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    g.lineStyle(5, 0xf0e0ff, 1);
    g.lineBetween(cx, cy, cx + Math.cos(hourAngle) * (radius * 0.5), cy + Math.sin(hourAngle) * (radius * 0.5));

    const minuteAngle = (minute / 60) * Math.PI * 2 - Math.PI / 2;
    g.lineStyle(3, 0xffcc00, 1);
    g.lineBetween(cx, cy, cx + Math.cos(minuteAngle) * (radius * 0.75), cy + Math.sin(minuteAngle) * (radius * 0.75));

    g.fillStyle(0xc0a0e0, 1);
    g.fillCircle(cx, cy, 6);
  }

  private renderTimeOptions(options: string[], question: TimeQuestion): void {
    const poolY = 500;
    const optionW = 300;
    const optionH = 50;
    const gap = 10;
    const kpId = `time-${question.hour}-${question.minute}`;

    options.forEach((option, i) => {
      const y = poolY + i * (optionH + gap);
      const container = this.add.container(this.cameras.main.width / 2, y);
      const bg = this.add.rectangle(0, 0, optionW, optionH, 0x8b6eaa, 0.9).setStrokeStyle(2, 0xc0a0e0);
      const text = this.add.text(0, 0, option, {
        fontSize: '18px', color: '#f0e0ff', fontFamily: 'Arial',
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setSize(optionW, optionH);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => bg.setFillStyle(0xab8eca, 1));
      container.on('pointerout', () => bg.setFillStyle(0x8b6eaa, 0.9));
      container.on('pointerdown', () => {
        const isCorrect = question.correctReadings.some((r) => r.toLowerCase() === option.toLowerCase());
        const responseTime = this.time.now - this.questionStartTime;

        if (isCorrect) {
          this.feedback.playSnap();
          bg.setFillStyle(0x4a8a4a, 1);
          this.totalCount++;
          this.correctCount++;
          this.feedback.speak(option);
          eventManager.emit('answer:correct', {
            knowledgePointId: kpId, knowledgePointType: 'sentence', responseTimeMs: responseTime,
          });
          this.wordDataStore.recordAnswer(kpId, 'sentence', true, responseTime);
          this.time.delayedCall(1200, () => { this.currentIndex++; this.displayQuestion(); });
        } else {
          this.feedback.playBounce();
          this.cameras.main.shake(100, 0.005);
          bg.setFillStyle(0x8a3a3a, 0.8);
          const correctText = question.correctReadings[0];
          this.showCorrectAnswer(poolY, correctText);
          this.totalCount++;
          this.wordDataStore.recordAnswer(kpId, 'sentence', false, responseTime);
          this.wordDataStore.incrementWrongCount(kpId);
          this.wordDataStore.getWrongCount(kpId).then((wc) => {
            if (wc >= 3) {
              eventManager.emit('answer:wrong', { knowledgePointId: kpId, knowledgePointType: 'sentence' });
            }
          });
          this.time.delayedCall(1800, () => { this.currentIndex++; this.displayQuestion(); });
        }
      });
    });
  }

  private showCorrectAnswer(y: number, correctText: string): void {
    this.add.text(this.cameras.main.width / 2, y - 40, `正确答案：${correctText}`, {
      fontSize: '18px', color: '#ff6666', fontFamily: 'Arial',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: this.children.list.filter((c) => c instanceof Phaser.GameObjects.Text && (c as Phaser.GameObjects.Text).text?.startsWith('正确答案')),
      alpha: 1, duration: 300,
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
