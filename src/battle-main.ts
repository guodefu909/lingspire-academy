import * as Phaser from "phaser";
import { BattleBootScene } from "./scenes/battle/battle-boot.scene";
import { BattleMenuScene } from "./scenes/battle/battle-menu.scene";
import { BattleGameScene } from "./scenes/battle/battle-game.scene";
import { BattleResultScene } from "./scenes/battle/battle-result.scene";
import { BattleStatsScene } from "./scenes/battle/battle-stats.scene";
import {
  BATTLE_CANVAS_WIDTH,
  BATTLE_CANVAS_HEIGHT,
} from "./config/battle-constants";

export class BattleGameManager {
  private static game: Phaser.Game | null = null;

  static start(): void {
    if (this.game) {
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: BATTLE_CANVAS_WIDTH,
      height: BATTLE_CANVAS_HEIGHT,
      parent: "game-container",
      backgroundColor: "#2c3e50",
      scene: [
        BattleBootScene,
        BattleMenuScene,
        BattleGameScene,
        BattleResultScene,
        BattleStatsScene,
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: BATTLE_CANVAS_WIDTH,
        height: BATTLE_CANVAS_HEIGHT,
      },
    };

    this.game = new Phaser.Game(config);
  }

  static stop(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

if (typeof window !== "undefined") {
  (window as any).BattleGameManager = BattleGameManager;
  BattleGameManager.start();
}

export default BattleGameManager;
