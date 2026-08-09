/**
 * 游戏主场景 —— 核心玩法所在
 * 【作用】
 * 玩家在岛屿网格地图上移动
 * 走到损坏物旁边触发解谜交互（损坏物=关卡）
 * 解谜完成即修复，获得灵石和灵光奖励
 * 【核心循环】
 * 进入岛屿 → 沿道路移动 → 遇到损坏物 → 触发解谜
 * → 解谜完成=修复=获得灵石 → 继续前进 → 修复灵塔 → 岛屿通关
 */
import * as Phaser from "phaser";
import { SceneKey } from "@core/scene-manager";
import { EventBus } from "@core/event-bus";
import { StateManager } from "@core/state-manager";
import { InputManager } from "@core/input-manager";
import { AudioManager } from "@core/audio-manager";
import {
  GRID_SIZE,
  GRID_COLS,
  GRID_ROWS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "@config/constants";
import {
  GridMapComponent,
  GridCellType,
  PuzzleConfig,
} from "@components/grid-map.component";
import { Player } from "@entities/player/player";
import { GridFillPuzzle } from "@components/grid-fill-puzzle";
export class GameScene extends Phaser.Scene {
  private gridMap!: GridMapComponent;
  private player!: Player;
  private islandId: string = "island-01";
  private isPlayerMoving: boolean = false;
  /** 当前正在进行的解谜界面（null 表示没有解谜） */
  private activePuzzle: GridFillPuzzle | null = null;
  /** 是否正在解谜中（解谜时禁止移动） */
  private isPuzzling: boolean = false;

  constructor() {
    super({ key: SceneKey.GAME });
  }

  init(data: any): void {
    if (data?.islandId) {
      this.islandId = data.islandId;
    }
    this.isPlayerMoving = false;
    this.isPuzzling = false;
    this.activePuzzle = null;
  }

  create(): void {
    InputManager.init(this);
    AudioManager.init(this);

    const islandData = this.cache.json.get(this.islandId);
    if (!islandData) {
      console.error(`[GameScene] 找不到岛屿数据: ${this.islandId}`);
      return;
    }

    // 添加地图背景图（在网格下层），资源不存在时跳过
    if (this.textures.exists("map-bg")) {
      this.add.image(0, 0, "map-bg").setOrigin(0, 0).setDepth(0);
    }

    this.gridMap = new GridMapComponent(this, islandData);

    const startPos = this.gridMap.getStartGridPos();
    this.player = new Player(this, startPos.col, startPos.row);

    this.setupCamera();
    this.createHUD();
    this.setupEventListeners();

    StateManager.setState("currentIslandId", this.islandId);
    StateManager.setState("isPlaying", true);

    console.log(`[GameScene] 进入岛屿: ${this.islandId}`);
  }

  private setupCamera(): void {
    const mapWidth = GRID_COLS * GRID_SIZE;
    const mapHeight = GRID_ROWS * GRID_SIZE;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
  }

  private createHUD(): void {
    const stoneIcon = this.add.circle(30, 30, 10, 0x00ccff).setScrollFactor(0);
    const stoneText = this.add
      .text(50, 22, String(StateManager.getState().player.spiritStones), {
        fontSize: "20px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setScrollFactor(0);

    const lightIcon = this.add.circle(130, 30, 10, 0xffd700).setScrollFactor(0);
    const lightText = this.add
      .text(150, 22, String(StateManager.getState().player.spiritLight), {
        fontSize: "20px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setScrollFactor(0);

    EventBus.on("state-changed:player.spiritStones", (data: any) => {
      stoneText.setText(String(data.newValue));
    });

    EventBus.on("state-changed:player.spiritLight", (data: any) => {
      lightText.setText(String(data.newValue));
    });

    const pauseBtn = this.add
      .text(CANVAS_WIDTH - 30, 22, "⏸", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    pauseBtn.on("pointerdown", () => {
      EventBus.emit("pause-requested");
    });
  }

  private setupEventListeners(): void {
    EventBus.on("pause-requested", () => this.onPauseRequested());
    EventBus.on("escape-pressed", () => this.onPauseRequested());
    EventBus.on("game-auto-pause", () => this.onPauseRequested());

    // 解谜关闭后恢复移动
    EventBus.on("puzzle-closed", () => {
      this.isPuzzling = false;
      this.activePuzzle = null;
      InputManager.setEnabled(true);
    });

    // 岛屿完成
    EventBus.on("island-completed", () => this.onIslandCompleted());

    // 修复完成 → 更新地图格子
    EventBus.on("repair-completed", (data: any) => {
      this.gridMap.repairCell(data.col, data.row);
    });
  }

  private onPauseRequested(): void {
    if (this.isPuzzling) return;
    this.scene.launch(SceneKey.PAUSE);
    this.scene.pause();
  }

  /** 岛屿完成（灵塔修复后） */
  private onIslandCompleted(): void {
    this.time.delayedCall(1500, () => {
      this.scene.start(SceneKey.GAME_OVER);
    });
  }

  update(_time: number, _delta: number): void {
    if (this.isPuzzling) return;

    if (this.isPlayerMoving) {
      const direction = InputManager.getDirection();
      if (direction === "none") {
        this.player.playIdleIfWalking();
      }
      InputManager.clearFrameState();
      return;
    }

    this.handleGridMovement();
    this.handleClickMovement();
    this.checkAdjacentDamagedCells();

    InputManager.clearFrameState();
  }

  private handleGridMovement(): void {
    const direction = InputManager.getDirection();
    if (direction === "none") {
      if (!this.isPlayerMoving) {
        this.player.playIdleIfWalking();
      }
      return;
    }

    let dCol = 0;
    let dRow = 0;

    switch (direction) {
      case "up":
        dRow = -1;
        break;
      case "down":
        dRow = 1;
        break;
      case "left":
        dCol = -1;
        break;
      case "right":
        dCol = 1;
        break;
      case "upleft":
        dCol = -1;
        dRow = -1;
        break;
      case "upright":
        dCol = 1;
        dRow = -1;
        break;
      case "downleft":
        dCol = -1;
        dRow = 1;
        break;
      case "downright":
        dCol = 1;
        dRow = 1;
        break;
    }

    this.tryMovePlayer(dCol, dRow);
  }

  private handleClickMovement(): void {
    if (!InputManager.isJustClicked()) return;

    const worldPos = InputManager.getClickWorldPos();
    const col = Math.floor(worldPos.x / GRID_SIZE);
    const row = Math.floor(worldPos.y / GRID_SIZE);

    const playerCol = this.player.getGridCol();
    const playerRow = this.player.getGridRow();
    const dCol = col - playerCol;
    const dRow = row - playerRow;

    if (Math.abs(dCol) + Math.abs(dRow) === 1) {
      this.tryMovePlayer(dCol, dRow);
    }
  }

  private tryMovePlayer(dCol: number, dRow: number): void {
    const newCol = this.player.getGridCol() + dCol;
    const newRow = this.player.getGridRow() + dRow;

    this.player.updateFacing(dCol, dRow);

    if (!this.gridMap.isWalkable(newCol, newRow)) {
      if (this.gridMap.isDamagedCell(newCol, newRow)) {
        this.tryTriggerPuzzle(newCol, newRow);
      }
      return;
    }

    this.isPlayerMoving = true;

    this.player.moveToGrid(newCol, newRow, () => {
      this.isPlayerMoving = false;
    });
  }

  /** 检查玩家周围是否有损坏物 */
  private checkAdjacentDamagedCells(): void {
    const playerCol = this.player.getGridCol();
    const playerRow = this.player.getGridRow();

    const directions = [
      { dCol: 0, dRow: -1 },
      { dCol: 0, dRow: 1 },
      { dCol: -1, dRow: 0 },
      { dCol: 1, dRow: 0 },
    ];

    for (const dir of directions) {
      const col = playerCol + dir.dCol;
      const row = playerRow + dir.dRow;

      if (this.gridMap.isDamagedCell(col, row)) {
        // 给损坏物添加高亮提示（让玩家知道可以交互）
        // TODO: 后续添加高亮效果
        break;
      }
    }
  }

  /**
   * 尝试触发损坏物的解谜
   * @param col 损坏物列
   * @param row 损坏物行
   */
  private tryTriggerPuzzle(col: number, row: number): void {
    if (this.isPuzzling) return;

    const cell = this.gridMap.getCell(col, row);
    if (!cell || !cell.puzzle) return;

    // 根据关卡类型创建对应的解谜界面
    switch (cell.puzzle.type) {
      case "grid-fill":
        this.activePuzzle = new GridFillPuzzle(this, cell.puzzle, col, row);
        this.isPuzzling = true;
        InputManager.setEnabled(false);
        break;
      default:
        console.warn(`[GameScene] 未知的关卡类型: ${cell.puzzle.type}`);
    }
  }
}
