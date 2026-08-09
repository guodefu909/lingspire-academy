import {
  BattleConfig,
  DEFAULT_BATTLE_CONFIG,
} from "../../data/battle/battle-config";
import { WordLibraryManager, WordData } from "../battle/word-library.manager";
import { PathManager } from "../battle/path.manager";
import { SoldierSpawnSystem } from "../../systems/battle/soldier-spawn.system";
import { SoldierMovementSystem } from "../../systems/battle/soldier-movement.system";
import { CombatSystem } from "../../systems/battle/combat.system";
import { AISystem } from "../../systems/battle/ai.system";
import { VictorySystem } from "../../systems/battle/victory.system";
import { BattleCrystal } from "../../entities/battle/battle-crystal";
import { BattleSoldier } from "../../entities/battle/battle-soldier";
import { BattleBullet } from "../../entities/battle/battle-bullet";
import {
  VictoryResult,
  BATTLE_MAP_SIZE,
  BATTLE_MAP_OFFSET_X,
  BATTLE_MAP_OFFSET_Y,
  PLAYER_CRYSTAL_X,
  PLAYER_CRYSTAL_Y,
  ENEMY_CRYSTAL_X,
  ENEMY_CRYSTAL_Y,
} from "@config/battle-constants";

export class BattleGameManager {
  private scene: Phaser.Scene;
  private config: BattleConfig;
  private wordLibrary: WordLibraryManager;
  private pathManager: PathManager;
  private soldierSpawnSystem!: SoldierSpawnSystem;
  private soldierMovementSystem!: SoldierMovementSystem;
  private combatSystem!: CombatSystem;
  private aiSystem!: AISystem;
  private victorySystem!: VictorySystem;

  private playerCrystal!: BattleCrystal;
  private enemyCrystal!: BattleCrystal;
  private playerSoldiers: BattleSoldier[] = [];
  private enemySoldiers: BattleSoldier[] = [];
  private flyingBullets: BattleBullet[] = [];
  private wrongWords: WordData[] = [];

  private isPaused: boolean = false;
  private isGameStarted: boolean = false;

  constructor(scene: Phaser.Scene, config?: Partial<BattleConfig>) {
    this.scene = scene;
    this.config = { ...DEFAULT_BATTLE_CONFIG, ...config };

    this.wordLibrary = new WordLibraryManager(this.config.word.imageBaseUrl);
    this.pathManager = new PathManager(
      BATTLE_MAP_SIZE,
      BATTLE_MAP_OFFSET_X,
      BATTLE_MAP_OFFSET_Y,
    );

    this.init();
  }

  init(): void {
    this.createCrystals();

    this.soldierSpawnSystem = new SoldierSpawnSystem(
      this.scene,
      this.wordLibrary,
      this.pathManager,
      this.config,
      this.config.game.duration,
    );

    this.soldierMovementSystem = new SoldierMovementSystem(this.pathManager);
    this.soldierMovementSystem.setOnSoldierHitCrystal((soldier, crystal) => {
      if (!soldier.getIsPlayerOwned() && crystal.getIsPlayer()) {
        const wordData = this.wordLibrary.getWordData(soldier.getWord());
        if (
          wordData &&
          !this.wrongWords.find((w) => w.word === wordData.word)
        ) {
          this.wrongWords.push(wordData);
        }
        this.wordLibrary.getStatsManager().recordWrong(soldier.getWord());
      }
    });

    this.combatSystem = new CombatSystem();
    this.combatSystem.setOnCorrectMatch((bullet, soldier) => {
      if (soldier.getIsPlayerOwned() === false) {
        this.wordLibrary.getStatsManager().recordCorrect(soldier.getWord());
        this.speakWord(soldier.getWord());
      }
    });
    this.combatSystem.setOnWrongMatch((bullet, soldier) => {
      if (soldier.getIsPlayerOwned() === false) {
        const wordData = this.wordLibrary.getWordData(bullet.getWord());
        if (
          wordData &&
          !this.wrongWords.find((w) => w.word === wordData.word)
        ) {
          this.wrongWords.push(wordData);
        }
        this.wordLibrary.getStatsManager().recordWrong(soldier.getWord());
      }
    });

    this.aiSystem = new AISystem(
      this.enemyCrystal,
      this.combatSystem,
      this.config.ai.errorRate,
    );

    this.victorySystem = new VictorySystem(
      this.playerCrystal,
      this.enemyCrystal,
      this.config.game.duration,
    );

    this.clearEventListeners();
    this.setupEventListeners();
  }

  private clearEventListeners(): void {
    this.scene.events.off("soldier-spawned");
    this.scene.events.off("soldier-died");
    this.scene.events.off("crystal-destroyed");
  }

  private createCrystals(): void {
    this.playerCrystal = new BattleCrystal(
      this.scene,
      PLAYER_CRYSTAL_X,
      PLAYER_CRYSTAL_Y,
      true,
      this.config.crystal.initialHealth,
    );

    this.enemyCrystal = new BattleCrystal(
      this.scene,
      ENEMY_CRYSTAL_X,
      ENEMY_CRYSTAL_Y,
      false,
      this.config.crystal.initialHealth,
    );
  }

  private setupEventListeners(): void {
    this.scene.events.on("soldier-spawned", (data: any) => {
      const { soldier, crystal, wordData } = data;

      if (crystal.getIsPlayer()) {
        soldier.setData("targetCrystal", this.enemyCrystal);
        this.playerSoldiers.push(soldier);
        // 玩家士兵出现，给敌方水晶添加炮弹（用于攻击玩家士兵）
        this.enemyCrystal.addBullet(wordData);
      } else {
        soldier.setData("targetCrystal", this.playerCrystal);
        this.enemySoldiers.push(soldier);
        // 敌方士兵出现，给玩家水晶添加炮弹（用于攻击敌方士兵）
        this.playerCrystal.addBullet(wordData);
      }
    });

    this.scene.events.on("soldier-died", (soldier: BattleSoldier) => {
      const playerIndex = this.playerSoldiers.indexOf(soldier);
      if (playerIndex > -1) {
        this.playerSoldiers.splice(playerIndex, 1);
      }

      const enemyIndex = this.enemySoldiers.indexOf(soldier);
      if (enemyIndex > -1) {
        this.enemySoldiers.splice(enemyIndex, 1);
      }
    });

    this.scene.events.on("crystal-destroyed", (isPlayer: boolean) => {
      const result = isPlayer
        ? VictoryResult.ENEMY_WIN
        : VictoryResult.PLAYER_WIN;
      this.endGame(result);
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused || !this.isGameStarted) {
      return;
    }

    this.victorySystem.updateTime(delta);

    this.soldierSpawnSystem.update(time, delta, [
      this.playerCrystal,
      this.enemyCrystal,
    ]);

    this.soldierMovementSystem.update(
      this.playerSoldiers,
      this.playerCrystal,
      this.enemyCrystal,
      delta,
    );

    this.soldierMovementSystem.update(
      this.enemySoldiers,
      this.enemyCrystal,
      this.playerCrystal,
      delta,
    );

    this.combatSystem.update(this.flyingBullets, this.enemySoldiers, delta);

    const aiBullet = this.aiSystem.update(time, this.playerSoldiers);
    if (aiBullet) {
      this.flyingBullets.push(aiBullet);
    }

    const result = this.victorySystem.checkVictory();
    if (result !== VictoryResult.ONGOING) {
      this.endGame(result);
    }
  }

  startGame(): void {
    this.isGameStarted = true;
    this.isPaused = false;
  }

  pauseGame(): void {
    this.isPaused = true;
  }

  resumeGame(): void {
    this.isPaused = false;
  }

  endGame(result: VictoryResult): void {
    this.isGameStarted = false;
    this.scene.events.emit("game-ended", result);
  }

  handlePlayerClick(target: BattleSoldier): void {
    if (target.isLocked()) {
      return;
    }

    if (!this.playerCrystal.getTurret().hasBullets()) {
      return;
    }

    const bullet = this.combatSystem.launchBullet(this.playerCrystal, target);

    if (bullet) {
      const isMatch = bullet.checkMatch();
      if (isMatch) {
        target.lock();
      }
      this.flyingBullets.push(bullet);
    }
  }

  discardBullet(): void {
    if (this.playerCrystal.getTurret().hasBullets()) {
      this.playerCrystal.removeFrontBullet();
    }
  }

  getWrongWords(): WordData[] {
    return this.wrongWords;
  }

  getPlayerCrystal(): BattleCrystal {
    return this.playerCrystal;
  }

  getEnemyCrystal(): BattleCrystal {
    return this.enemyCrystal;
  }

  getEnemySoldiers(): BattleSoldier[] {
    return this.enemySoldiers;
  }

  getVictorySystem(): VictorySystem {
    return this.victorySystem;
  }

  private speakWord(word: string): void {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}
