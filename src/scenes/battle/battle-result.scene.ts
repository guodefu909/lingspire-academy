import * as Phaser from "phaser";
import {
  VictoryResult,
  BATTLE_CANVAS_WIDTH,
  BATTLE_CANVAS_HEIGHT,
} from "@config/battle-constants";
import { WordData } from "../../managers/battle/word-library.manager";

interface ResultData {
  result: VictoryResult;
  wrongWords: WordData[];
  crystalHealth: number;
}

/**
 * 对战结果场景 —— 显示胜负 + 需复习单词列表。
 *
 * 答错的单词显示：图片 + 英文 + 中文释义。
 * 可"再来一局"或"返回菜单"。
 */
export class BattleResultScene extends Phaser.Scene {
  private resultData!: ResultData;

  constructor() {
    super({ key: "BattleResultScene" });
  }

  init(data: ResultData): void {
    this.resultData = data;
  }

  create(): void {
    this.createBackground();
    this.createResultTitle();
    this.createWrongWords();
    this.createButtons();
  }

  private createBackground(): void {
    this.add.rectangle(
      BATTLE_CANVAS_WIDTH / 2,
      BATTLE_CANVAS_HEIGHT / 2,
      BATTLE_CANVAS_WIDTH,
      BATTLE_CANVAS_HEIGHT,
      0x2c3e50,
    );
  }

  private createResultTitle(): void {
    const { result } = this.resultData;
    let titleText: string;
    let titleColor: string;

    switch (result) {
      case VictoryResult.PLAYER_WIN:
        titleText = "胜利！";
        titleColor = "#ffd700";
        break;
      case VictoryResult.ENEMY_WIN:
        titleText = "失败";
        titleColor = "#e74c3c";
        break;
      case VictoryResult.DRAW:
        titleText = "平局";
        titleColor = "#3498db";
        break;
      default:
        titleText = "游戏结束";
        titleColor = "#ffffff";
    }

    this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 80, titleText, {
        fontSize: "48px",
        color: titleColor,
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  private createWrongWords(): void {
    const { wrongWords } = this.resultData;

    if (wrongWords.length === 0) {
      this.add
        .text(
          BATTLE_CANVAS_WIDTH / 2,
          BATTLE_CANVAS_HEIGHT / 2 - 40,
          "太棒了！全部正确！",
          {
            fontSize: "28px",
            color: "#2ecc71",
            fontFamily: "Arial",
          },
        )
        .setOrigin(0.5);
      return;
    }

    this.add
      .text(BATTLE_CANVAS_WIDTH / 2, 160, "需要复习的单词：", {
        fontSize: "24px",
        color: "#e74c3c",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const startY = 210;
    const lineHeight = 40;
    const maxDisplay = Math.min(wrongWords.length, 10);

    for (let i = 0; i < maxDisplay; i++) {
      const word = wrongWords[i];
      const y = startY + i * lineHeight;
      const imgKey = `word_img_${word.word}`;

      if (this.textures.exists(imgKey)) {
        this.add
          .image(BATTLE_CANVAS_WIDTH / 2 - 100, y, imgKey)
          .setDisplaySize(30, 30)
          .setOrigin(0.5);
      }

      this.add
        .text(BATTLE_CANVAS_WIDTH / 2 - 40, y, word.word, {
          fontSize: "20px",
          color: "#ffffff",
          fontFamily: "Arial",
        })
        .setOrigin(0, 0.5);

      this.add
        .text(BATTLE_CANVAS_WIDTH / 2 + 60, y, word.chinese, {
          fontSize: "18px",
          color: "#bdc3c7",
          fontFamily: "Arial",
        })
        .setOrigin(0, 0.5);
    }
  }

  private createButtons(): void {
    const buttonY = BATTLE_CANVAS_HEIGHT - 80;

    this.createButton(
      "再来一局",
      BATTLE_CANVAS_WIDTH / 2 - 130,
      buttonY,
      () => {
        this.scene.start("BattleGameScene", {
          crystalHealth: this.resultData.crystalHealth,
        });
      },
    );

    this.createButton(
      "返回菜单",
      BATTLE_CANVAS_WIDTH / 2 + 130,
      buttonY,
      () => {
        this.scene.start("BattleMenuScene");
      },
    );
  }

  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void,
  ): void {
    const width = 200;
    const height = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0x334455, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    const label = this.add
      .text(x, y, text, {
        fontSize: "22px",
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
