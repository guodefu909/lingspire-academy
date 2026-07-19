import * as Phaser from 'phaser';

export class FeedbackPlayer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playSnap(): void {
    this.playTone(800, 0.05);
  }

  playBounce(): void {
    this.playTone(300, 0.1);
  }

  playExplosion(): void {
    this.playTone(1200, 0.15);
    this.scene.time.delayedCall(80, () => this.playTone(600, 0.1));
  }

  playCombo(): void {
    this.playTone(880, 0.08);
    this.scene.time.delayedCall(60, () => this.playTone(1100, 0.08));
    this.scene.time.delayedCall(120, () => this.playTone(1320, 0.12));
  }

  playPetEat(): void {
    this.playTone(500, 0.06);
    this.scene.time.delayedCall(50, () => this.playTone(700, 0.04));
  }

  speak(text: string): void {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    const voices = synth.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en-US'))
      ?? voices.find(v => v.lang.startsWith('en'));
    if (enVoice) {
      utterance.voice = enVoice;
    }
    utterance.onend = () => {
      if (synth.paused) synth.resume();
    };
    synth.speak(utterance);
    setTimeout(() => {
      if (synth.paused) synth.resume();
    }, 10);
  }

  private playTone(frequency: number, duration: number): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      // 音频不可用时静默失败
    }
  }

  static preload(_scene: Phaser.Scene): void {
    // 音效用 Web Audio API 程序生成，无需预加载
  }
}
