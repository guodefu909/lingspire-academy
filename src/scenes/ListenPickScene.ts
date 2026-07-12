import * as Phaser from 'phaser';
import type { WordData } from '../models/word-data';
import { FeedbackPlayer } from '../systems/feedback-player';
import { eventManager } from '../systems/event-manager';
import { WordDataStore } from '../storage/word-data-store';

type QuestionType = 'word' | 'date' | 'year';

interface BaseQuestion {
  type: QuestionType;
  audioText: string;
  kpId: string;
}

interface WordQuestion extends BaseQuestion {
  type: 'word';
  correctAnswer: string;
  distractorPool: string[];
}

interface DateQuestion extends BaseQuestion {
  type: 'date';
  month: number;
  day: number;
  correctLabel: string;
  wrongLabels: string[];
}

interface YearQuestion extends BaseQuestion {
  type: 'year';
  year: number;
  correctLabel: string;
  wrongLabels: string[];
}

type Question = WordQuestion | DateQuestion | YearQuestion;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
  'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third',
  'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth',
  'twenty-ninth', 'thirtieth', 'thirty-first',
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function yearToEnglish(year: number): string {
  if (year === 2000) return 'two thousand';
  if (year >= 2001 && year <= 2009) {
    return `two thousand ${ONES[year - 2000]}`;
  }
  const firstPart = Math.floor(year / 100);
  const secondPart = year % 100;
  const firstWord = firstPart === 19 ? 'nineteen' : firstPart === 20 ? 'twenty' : String(firstPart);
  if (secondPart === 0) return firstWord;
  let secondWord: string;
  if (secondPart < 10) {
    secondWord = ONES[secondPart];
  } else if (secondPart < 20) {
    secondWord = TEENS[secondPart - 10];
  } else {
    const t = Math.floor(secondPart / 10);
    const o = secondPart % 10;
    secondWord = o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  return `${firstWord} ${secondWord}`;
}

export class ListenPickScene extends Phaser.Scene {
  private questions: Question[] = [];
  private currentIndex: number = 0;
  private feedback!: FeedbackPlayer;
  private wordDataStore: WordDataStore;
  private correctCount: number = 0;
  private totalCount: number = 0;
  private questionStartTime: number = 0;
  private timeLimit: number = 60;
  private timeRemaining: number = 60;
  private timerText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private gameEnded: boolean = false;
  private answered: boolean = false;

  constructor() {
    super({ key: 'ListenPickScene' });
    this.wordDataStore = new WordDataStore();
  }

  init(data: { difficulty?: string; timeLimit?: number }): void {
    if (data.timeLimit) {
      this.timeLimit = data.timeLimit;
    }
  }

  create(): void {
    const months: WordData[] = this.cache.json.get('months') ?? [];
    const weekdays: WordData[] = this.cache.json.get('weekdays') ?? [];
    const allWords = [...months, ...weekdays];

    const wordQuestions: WordQuestion[] = allWords.map((w) => ({
      type: 'word' as const,
      audioText: w.word,
      kpId: w.id,
      correctAnswer: w.word,
      distractorPool: allWords.filter((o) => o.id !== w.id).map((o) => o.word),
    }));

    const dateQuestions: DateQuestion[] = this.generateDateQuestions(30);
    const yearQuestions: YearQuestion[] = this.generateYearQuestions(30);

    this.questions = this.shuffle([...wordQuestions, ...dateQuestions, ...yearQuestions]);
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

  private generateDateQuestions(count: number): DateQuestion[] {
    const questions: DateQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const correctLabel = `${month}月${day}日`;

      const wrongLabels: string[] = [];
      while (wrongLabels.length < 3) {
        const wm = Math.floor(Math.random() * 12) + 1;
        const wd = Math.floor(Math.random() * 28) + 1;
        const label = `${wm}月${wd}日`;
        if (label !== correctLabel && !wrongLabels.includes(label)) {
          wrongLabels.push(label);
        }
      }

      const audioText = `${MONTH_NAMES[month - 1]} ${ORDINALS[day - 1]}`;
      questions.push({
        type: 'date' as const,
        audioText,
        kpId: `date-${month}-${day}`,
        month,
        day,
        correctLabel,
        wrongLabels,
      });
    }
    return questions;
  }

  private generateYearQuestions(count: number): YearQuestion[] {
    const questions: YearQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const year = 1950 + Math.floor(Math.random() * 75);
      const correctLabel = `${year}年`;

      const wrongLabels: string[] = [];
      while (wrongLabels.length < 3) {
        const wy = 1950 + Math.floor(Math.random() * 75);
        const label = `${wy}年`;
        if (label !== correctLabel && !wrongLabels.includes(label)) {
          wrongLabels.push(label);
        }
      }

      questions.push({
        type: 'year' as const,
        audioText: yearToEnglish(year),
        kpId: `year-${year}`,
        year,
        correctLabel,
        wrongLabels,
      });
    }
    return questions;
  }

  private createBackButton(): void {
    this.add.text(30, 30, '← 返回', {
      fontSize: '20px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.timerEvent) this.timerEvent.remove();
        this.scene.start('DifficultySelectScene', { gameMode: 'listen-pick' });
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
    this.answered = false;

    this.add.text(this.cameras.main.width / 2, 80,
      `已答 ${this.totalCount} | 正确 ${this.correctCount}`,
      { fontSize: '20px', color: '#a090c0', fontFamily: 'Arial' }).setOrigin(0.5);

    const titleMap: Record<string, string> = {
      'word': '🔊 听音辨词',
      'date': '🔊 听音选日期',
      'year': '🔊 听音选年份',
    };
    const titleText = titleMap[question.type] || '🔊 听音辨词';
    this.add.text(this.cameras.main.width / 2, 130, titleText, {
      fontSize: '28px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.createPlayButton(question);

    this.time.delayedCall(300, () => this.feedback.speak(question.audioText));

    this.renderOptions(question);
  }

  private createPlayButton(question: Question): void {
    const playButton = this.add.container(this.cameras.main.width / 2, 250);
    const playBg = this.add.circle(0, 0, 40, 0x6b4e8a, 0.9).setStrokeStyle(3, 0xc0a0e0);
    const playIcon = this.add.text(0, 0, '▶', {
      fontSize: '32px', color: '#f0e0ff', fontFamily: 'Arial',
    }).setOrigin(0.5);
    playButton.add([playBg, playIcon]);
    playButton.setSize(80, 80);
    playButton.setInteractive({ useHandCursor: true });
    playButton.on('pointerdown', () => {
      this.feedback.speak(question.audioText);
    });
  }

  private renderOptions(question: Question): void {
    let options: string[];
    let correctAnswer: string;

    if (question.type === 'word') {
      correctAnswer = question.correctAnswer;
      const distractors = this.shuffle([...question.distractorPool]).slice(0, 3);
      options = this.shuffle([correctAnswer, ...distractors]);
    } else {
      correctAnswer = question.correctLabel;
      options = this.shuffle([correctAnswer, ...question.wrongLabels]);
    }

    const poolY = 400;
    const colCount = 2;
    const isNumeric = question.type === 'date' || question.type === 'year';
    const optionW = isNumeric ? 200 : 300;
    const optionH = 60;
    const gap = 15;

    options.forEach((option, i) => {
      const col = i % colCount;
      const row = Math.floor(i / colCount);
      const x = this.cameras.main.width / 2 + (col - 0.5) * (optionW + gap);
      const y = poolY + row * (optionH + gap);

      const container = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, optionW, optionH, 0x8b6eaa, 0.9).setStrokeStyle(2, 0xc0a0e0);
      const fontSize = isNumeric ? '28px' : '22px';
      const text = this.add.text(0, 0, option, {
        fontSize, color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setSize(optionW, optionH);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => bg.setFillStyle(0xab8eca, 1));
      container.on('pointerout', () => bg.setFillStyle(0x8b6eaa, 0.9));
      container.on('pointerdown', () => {
        if (this.answered) return;
        this.answered = true;
        const isCorrect = option === correctAnswer;
        const responseTime = this.time.now - this.questionStartTime;

        if (isCorrect) {
          this.feedback.playSnap();
          bg.setFillStyle(0x4a8a4a, 1);
          this.totalCount++;
          this.correctCount++;
          eventManager.emit('answer:correct', {
            knowledgePointId: question.kpId, knowledgePointType: 'word', responseTimeMs: responseTime,
          });
          this.wordDataStore.recordAnswer(question.kpId, 'word', true, responseTime);
          this.time.delayedCall(1000, () => { this.currentIndex++; this.displayQuestion(); });
        } else {
          this.feedback.playBounce();
          this.cameras.main.shake(100, 0.005);
          bg.setFillStyle(0x8a3a3a, 0.8);
          this.totalCount++;
          this.wordDataStore.recordAnswer(question.kpId, 'word', false, responseTime);
          this.wordDataStore.incrementWrongCount(question.kpId);
          this.wordDataStore.getWrongCount(question.kpId).then((wc) => {
            if (wc >= 3) {
              eventManager.emit('answer:wrong', { knowledgePointId: question.kpId, knowledgePointType: 'word' });
            }
          });
          this.time.delayedCall(1500, () => { this.currentIndex++; this.displayQuestion(); });
        }
      });
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
