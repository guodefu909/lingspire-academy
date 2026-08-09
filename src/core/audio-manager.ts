/**
 * 音频管理器 —— 统一管理背景音乐和音效
 * 【作用】
 * BGM（背景音乐）：同一时间只播放一首，切换时淡入淡出
 * SFX（音效）：可以同时播放多个，如点击、获得灵石等
 * 音量由 StateManager 中的 settings 统一控制
 * 【用法示例】
 * AudioManager.playBgm('main-theme');
 * AudioManager.playSfx('spirit-stone-gain');
 */
import * as Phaser from "phaser";
import { StateManager } from "./state-manager";
export class AudioManager {
  /** 当前播放的 BGM 的 Phaser.Sound 对象 */
  private static currentBgm: Phaser.Sound.BaseSound | null = null;
  /** 当前 BGM 的 key */
  private static currentBgmKey: string = "";
  /** Phaser 场景引用（音频必须通过场景播放） */
  private static scene: Phaser.Scene | null = null;

  /**
   * 初始化音频管理器
   * @param scene 当前场景的引用，音频必须通过场景来播放
   */
  static init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * 播放背景音乐
   * @param key      音频资源在 Phaser 中的 key（在 PreloadScene 中加载）
   * @param fadeInMs  淡入时长（毫秒）
   * @param loop     是否循环播放，默认 true
   */
  static playBgm(
    key: string,
    fadeInMs: number = 1000,
    loop: boolean = true,
  ): void {
    if (!this.scene) return;

    // 如果已经在播放同一首，不重复播放
    if (this.currentBgmKey === key && this.currentBgm?.isPlaying) return;

    // 先停止当前 BGM
    this.stopBgm(fadeInMs);

    // 延迟一点等旧的淡出完毕，再播放新的
    this.scene.time.delayedCall(fadeInMs, () => {
      if (!this.scene) return;

      const bgmVolume = StateManager.getState().settings.bgmVolume;
      this.currentBgm = this.scene.sound.add(key, {
        volume: 0,
        loop,
      });
      this.currentBgm.play();
      this.currentBgmKey = key;

      // 淡入效果
      if (this.currentBgm instanceof Phaser.Sound.WebAudioSound) {
        this.currentBgm.setVolume(bgmVolume);
      }
    });
  }

  /** 停止背景音乐（带淡出） */
  static stopBgm(fadeOutMs: number = 1000): void {
    if (!this.currentBgm || !this.scene) return;

    if (this.currentBgm instanceof Phaser.Sound.WebAudioSound) {
      this.scene.tweens.add({
        targets: this.currentBgm,
        volume: 0,
        duration: fadeOutMs,
        onComplete: () => {
          this.currentBgm?.stop();
          this.currentBgm = null;
          this.currentBgmKey = "";
        },
      });
    } else {
      this.currentBgm.stop();
      this.currentBgm = null;
      this.currentBgmKey = "";
    }
  }

  /**
   * 播放音效
   * @param key   音效资源 key
   * @param volume 音量覆盖（默认使用设置中的 sfxVolume）
   */
  static playSfx(key: string, volume?: number): void {
    if (!this.scene) return;

    const sfxVolume = volume ?? StateManager.getState().settings.sfxVolume;
    this.scene.sound.play(key, { volume: sfxVolume });
  }

  /** 更新 BGM 音量（设置界面调用） */
  static updateBgmVolume(volume: number): void {
    if (this.currentBgm instanceof Phaser.Sound.WebAudioSound) {
      this.currentBgm.setVolume(volume);
    }
  }
}
