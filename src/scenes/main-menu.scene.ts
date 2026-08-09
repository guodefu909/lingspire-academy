/**
 * 主菜单场景 —— 游戏的入口界面
 * 【作用】
 * 显示游戏标题"灵光"
 * 提供"开始游戏"、"继续游戏"、"设置"按钮
 * 有存档时显示"继续游戏"按钮，无存档时只显示"开始游戏"
 * 【视觉】首版使用代码绘制的占位 UI，后续替换精美界面
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
import { StateManager } from "@core/state-manager";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_SPIRIT_LIGHT,
  COLOR_FOG,
} from "@config/constants";
/** 按钮配置接口 */
interface MenuButton {
  text: string;
  y: number;
  callback: () => void;
}

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.MAIN_MENU });
  }

  create(): void {
    this.drawBackground();
    this.drawTitle();
    this.createMenuButtons();
  }

  /** 绘制背景（渐变 + 雾霾效果） */
  private drawBackground(): void {
    // 用 Graphics 绘制渐变背景
    const bg = this.add.graphics();

    // 从深蓝到深紫的渐变，表现灵界的神秘感
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(10 + t * 30);
      const g = Math.floor(15 + t * 10);
      const b = Math.floor(40 + t * 20);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(
        0,
        (CANVAS_HEIGHT / steps) * i,
        CANVAS_WIDTH,
        CANVAS_HEIGHT / steps + 1,
      );
    }

    // 添加一些"雾霾"圆形，表现灵界被污染的状态
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, CANVAS_WIDTH);
      const y = Phaser.Math.Between(0, CANVAS_HEIGHT);
      const radius = Phaser.Math.Between(30, 100);
      const fogCircle = this.add.circle(x, y, radius, COLOR_FOG, 0.08);
      // 让雾霾缓慢飘动
      this.tweens.add({
        targets: fogCircle,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  /** 绘制游戏标题 */
  private drawTitle(): void {
    // 标题文字
    const title = this.add
      .text(CANVAS_WIDTH / 2, 160, "灵 光", {
        fontSize: "72px",
        color: "#ffd700",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 副标题
    this.add
      .text(CANVAS_WIDTH / 2, 240, "Spirit Light", {
        fontSize: "28px",
        color: "#aaccff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 标题呼吸光效
    this.tweens.add({
      targets: title,
      alpha: 0.8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** 创建菜单按钮 */
  private createMenuButtons(): void {
    const hasSave = StorageManager_hasSave();

    const buttons: MenuButton[] = [
      {
        text: "开始游戏",
        y: 340,
        callback: () => this.onStartGame(false),
      },
    ];

    // 有存档时显示"继续游戏"
    if (hasSave) {
      buttons.push({
        text: "继续游戏",
        y: 400,
        callback: () => this.onStartGame(true),
      });
    }

    buttons.push({
      text: "对战游戏",
      y: hasSave ? 460 : 400,
      callback: () => this.onBattleGame(),
    });

    buttons.push({
      text: "设置",
      y: hasSave ? 520 : 460,
      callback: () => this.onSettings(),
    });

    // 重置存档按钮（测试用，红色小按钮）
    if (hasSave) {
      this.createSmallButton("重置存档", CANVAS_WIDTH / 2, 590, 0xaa3333, () =>
        this.onResetSave(),
      );
    }

    buttons.forEach((btn) => {
      this.createButton(btn.text, CANVAS_WIDTH / 2, btn.y, btn.callback);
    });
  }

  /**
   * 创建一个按钮（占位图形版本）
   * @param text     按钮文字
   * @param x        X 坐标
   * @param y        Y 坐标
   * @param callback 点击回调
   */
  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void,
  ): void {
    const width = 220;
    const height = 50;

    // 按钮背景（圆角矩形）
    const bg = this.add.graphics();
    bg.fillStyle(0x334455, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    bg.lineStyle(2, COLOR_SPIRIT_LIGHT, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    // 按钮文字
    const label = this.add
      .text(x, y, text, {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 创建一个透明的交互区域（让整个按钮区域可点击）
    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    // 鼠标悬停效果
    hitArea.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x445566, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      bg.lineStyle(2, COLOR_SPIRIT_LIGHT, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    });

    hitArea.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x334455, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      bg.lineStyle(2, COLOR_SPIRIT_LIGHT, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    });

    // 点击事件
    hitArea.on("pointerdown", callback);
  }

  /**
   * 创建小号按钮（用于重置存档等次要操作）
   * @param text     按钮文字
   * @param x        X 坐标
   * @param y        Y 坐标
   * @param color    背景颜色
   * @param callback 点击回调
   */
  private createSmallButton(
    text: string,
    x: number,
    y: number,
    color: number,
    callback: () => void,
  ): void {
    const width = 140;
    const height = 36;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    bg.lineStyle(1, 0xff6666, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);

    const label = this.add
      .text(x, y, text, {
        fontSize: "16px",
        color: "#ffcccc",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0xcc4444, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
      bg.lineStyle(1, 0xff8888, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    });

    hitArea.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
      bg.lineStyle(1, 0xff6666, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    });

    hitArea.on("pointerdown", callback);
  }

  /** 点击"重置存档" —— 清除所有存档数据并刷新菜单 */
  private onResetSave(): void {
    StateManager.reset();
    this.scene.restart();
  }

  /** 点击"开始游戏" */
  private onStartGame(continueGame: boolean): void {
    if (!continueGame) {
      StateManager.reset();
    }
    StateManager.setState("isPlaying", true);
    this.scene.start(SceneKey.GAME);
  }

  /** 点击"设置" */
  private onSettings(): void {
    this.scene.start(SceneKey.SETTINGS);
  }

  /** 点击"对战游戏" */
  private onBattleGame(): void {
    window.location.href = "battle.html";
  }
}

/** 辅助函数：检查是否有存档 */
function StorageManager_hasSave(): boolean {
  try {
    return localStorage.getItem("spirit-light-save") !== null;
  } catch {
    return false;
  }
}
