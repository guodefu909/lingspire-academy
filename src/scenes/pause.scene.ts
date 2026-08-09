/**
 * 暂停场景 —— 覆盖在游戏场景上方的暂停菜单
 * 【作用】
 * 游戏暂停时显示的覆盖层
 * 提供"继续游戏"、"返回主菜单"选项
 * 半透明黑色遮罩，能看到下方游戏画面
 * 【注意】这是一个"叠加场景"，不会销毁下方的 GameScene
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@config/constants";
export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.PAUSE });
  }

  create(): void {
    // 半透明黑色遮罩
    const overlay = this.add.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      0x000000,
      0.6,
    );

    // 暂停标题
    this.add
      .text(CANVAS_WIDTH / 2, 200, "游戏暂停", {
        fontSize: "48px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 继续游戏按钮
    this.createButton("继续游戏", CANVAS_WIDTH / 2, 320, () => {
      this.scene.stop(SceneKey.PAUSE);
      this.scene.resume(SceneKey.GAME);
    });

    // 返回主菜单按钮
    this.createButton("返回主菜单", CANVAS_WIDTH / 2, 400, () => {
      this.scene.stop(SceneKey.PAUSE);
      this.scene.stop(SceneKey.GAME);
      this.scene.start(SceneKey.MAIN_MENU);
    });
  }

  /** 创建按钮（与主菜单风格一致） */
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

    hitArea.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x445566, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    });

    hitArea.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x334455, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    });

    hitArea.on("pointerdown", callback);
  }
}
