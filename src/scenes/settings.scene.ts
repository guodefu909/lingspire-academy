/**
 * 设置场景 —— 游戏设置界面
 * 【作用】
 * 调整背景音乐音量
 * 调整音效音量
 * 返回主菜单
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
import { StateManager } from "@core/state-manager";
import { AudioManager } from "@core/audio-manager";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@config/constants";
export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.SETTINGS });
  }

  create(): void {
    const settings = StateManager.getState().settings;

    // 背景
    this.add.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      0x1a1a2e,
      1,
    );

    // 标题
    this.add
      .text(CANVAS_WIDTH / 2, 120, "设置", {
        fontSize: "48px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // BGM 音量
    this.add
      .text(CANVAS_WIDTH / 2 - 150, 240, "背景音乐音量", {
        fontSize: "22px",
        color: "#aaaaaa",
        fontFamily: "Arial",
      })
      .setOrigin(0, 0.5);

    const bgmSlider = this.createSlider(
      CANVAS_WIDTH / 2 + 50,
      240,
      settings.bgmVolume,
      (value) => {
        StateManager.setState("settings.bgmVolume", value);
        AudioManager.updateBgmVolume(value);
      },
    );

    // SFX 音量
    this.add
      .text(CANVAS_WIDTH / 2 - 150, 310, "音效音量", {
        fontSize: "22px",
        color: "#aaaaaa",
        fontFamily: "Arial",
      })
      .setOrigin(0, 0.5);

    const sfxSlider = this.createSlider(
      CANVAS_WIDTH / 2 + 50,
      310,
      settings.sfxVolume,
      (value) => {
        StateManager.setState("settings.sfxVolume", value);
      },
    );

    // 返回按钮
    this.createButton("返回", CANVAS_WIDTH / 2, 440, () => {
      StateManager.save();
      this.scene.start(SceneKey.MAIN_MENU);
    });
  }

  /**
   * 创建一个滑动条控件
   * @param x        滑动条中心 X
   * @param y        滑动条中心 Y
   * @param initVal  初始值 0~1
   * @param onChange 值变化回调
   */
  private createSlider(
    x: number,
    y: number,
    initVal: number,
    onChange: (value: number) => void,
  ): Phaser.GameObjects.Container {
    const trackWidth = 200;
    const trackHeight = 8;
    const handleRadius = 12;

    const container = this.add.container(x, y);

    // 滑轨背景
    const track = this.add.graphics();
    track.fillStyle(0x555555, 1);
    track.fillRoundedRect(
      -trackWidth / 2,
      -trackHeight / 2,
      trackWidth,
      trackHeight,
      4,
    );
    container.add(track);

    // 滑块
    const handle = this.add.circle(
      -trackWidth / 2 + trackWidth * initVal,
      0,
      handleRadius,
      0xffd700,
    );
    container.add(handle);

    // 让滑块可拖动
    handle.setInteractive({ draggable: true, useHandCursor: true });

    this.input.setDraggable(handle);

    handle.on("drag", (pointer: any, dragX: number) => {
      // 限制在滑轨范围内
      const minX = -trackWidth / 2;
      const maxX = trackWidth / 2;
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
      handle.x = clampedX;

      // 计算当前值 0~1
      const value = (clampedX - minX) / (maxX - minX);
      onChange(value);
    });

    return container;
  }

  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void,
  ): void {
    const width = 220;
    const height = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x334455, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    this.add
      .text(x, y, text, {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", callback);
  }
}
