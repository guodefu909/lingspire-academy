/**
 * 结算场景 —— 岛屿完成后的结算界面
 * 【作用】
 * 显示本岛屿的完成统计（获得灵石、灵光、修复进度等）
 * 提供"前往下一岛屿"和"返回主菜单"选项
 * 【触发时机】修复灵塔后自动进入结算
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
import { StateManager } from "@core/state-manager";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_SPIRIT_LIGHT,
} from "@config/constants";
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.GAME_OVER });
  }

  create(): void {
    const state = StateManager.getState();

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
      .text(CANVAS_WIDTH / 2, 120, "岛屿修复完成", {
        fontSize: "48px",
        color: "#ffd700",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 统计信息
    this.add
      .text(CANVAS_WIDTH / 2, 220, `获得灵石: ${state.player.spiritStones}`, {
        fontSize: "28px",
        color: "#00ccff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 270, `灵光值: ${state.player.spiritLight}`, {
        fontSize: "28px",
        color: "#ffd700",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 前往下一岛屿按钮
    this.createButton("前往下一岛屿", CANVAS_WIDTH / 2, 380, () => {
      // TODO: 根据当前岛屿确定下一个岛屿
      this.scene.start(SceneKey.GAME, { islandId: "island-02" });
    });

    // 返回主菜单按钮
    this.createButton("返回主菜单", CANVAS_WIDTH / 2, 460, () => {
      this.scene.start(SceneKey.MAIN_MENU);
    });
  }

  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void,
  ): void {
    const width = 260;
    const height = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x334455, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    bg.lineStyle(2, COLOR_SPIRIT_LIGHT, 1);
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
