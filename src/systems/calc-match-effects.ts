import type { CalcOperator } from '../models/calc-puzzle';

const OPERATOR_COLORS: Record<CalcOperator, { primary: number; secondary: number }> = {
  '+': { primary: 0xffd700, secondary: 0xffffff },
  '-': { primary: 0x87ceeb, secondary: 0xffffff },
  '×': { primary: 0xff6b35, secondary: 0xffd700 },
  '÷': { primary: 0x9b59b6, secondary: 0xffffff },
};

const OPERATOR_TONES: Record<CalcOperator, [number, number][]> = {
  '+': [[880, 0.08], [1100, 0.08]],
  '-': [[660, 0.1], [440, 0.08]],
  '×': [[880, 0.06], [1100, 0.06], [1320, 0.1]],
  '÷': [[1200, 0.04], [800, 0.04], [1200, 0.06]],
};

export class CalcMatchEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playEliminateEffect(
    operator: CalcOperator,
    x: number,
    y: number,
    onComplete?: () => void
  ): void {
    const colors = OPERATOR_COLORS[operator];
    this.createParticles(operator, x, y, colors);
    this.playOperatorSound(operator);
    this.createFlash(operator, x, y, colors, onComplete);
  }

  private createParticles(
    operator: CalcOperator,
    x: number,
    y: number,
    colors: { primary: number; secondary: number }
  ): void {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = operator === '×' ? 120 : 80;
      const vx = Math.cos(angle) * speed;
      const vy = operator === '+' ? -speed : Math.sin(angle) * speed;

      const dot = this.scene.add.circle(x, y, 4, colors.primary);
      this.scene.tweens.add({
        targets: dot,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: 0.2,
        duration: operator === '÷' ? 300 : 500,
        ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private createFlash(
    _operator: CalcOperator,
    x: number,
    y: number,
    colors: { primary: number; secondary: number },
    onComplete?: () => void
  ): void {
    const flash = this.scene.add.circle(x, y, 20, colors.secondary, 0.6);
    this.scene.tweens.add({
      targets: flash,
      scale: 2.5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
        onComplete?.();
      },
    });
  }

  private playOperatorSound(operator: CalcOperator): void {
    const tones = OPERATOR_TONES[operator];
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      tones.forEach(([freq, dur], i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = operator === '÷' ? 'sawtooth' : 'sine';
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime + i * 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.06 + dur);
        oscillator.start(audioContext.currentTime + i * 0.06);
        oscillator.stop(audioContext.currentTime + i * 0.06 + dur);
      });
    } catch {
      // 音频不可用时静默失败
    }
  }

  playWrongSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 200;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
      // 音频不可用时静默失败
    }
  }

  getOperatorColor(operator: CalcOperator): number {
    return OPERATOR_COLORS[operator].primary;
  }
}