/**
 * 输入管理器 —— 统一处理键盘、鼠标、触摸输入
 * 【作用】
 * 将 Phaser 的输入事件封装为更易用的接口
 * 支持方向键/WASD 移动、点击交互
 * 记录当前输入状态，供游戏逻辑每帧查询
 * 【用法示例】
 * // 在场景的 update 中查询
 * if (InputManager.isMovingUp()) { 角色向上移动 }
 * if (InputManager.isJustClicked()) { 检查点击位置 }
 */
import * as Phaser from "phaser";
import { EventBus } from "./event-bus";

/** 方向枚举，用于网格移动 */
export enum Direction {
  NONE = "none",
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  UP_LEFT = "upleft",
  UP_RIGHT = "upright",
  DOWN_LEFT = "downleft",
  DOWN_RIGHT = "downright",
}

export class InputManager {
  /** Phaser 场景引用 */
  private static scene: Phaser.Scene | null = null;

  /** 当前按住的方向键方向 */
  private static currentDirection: Direction = Direction.NONE;

  /** 本帧是否有点击事件 */
  private static clickedThisFrame: boolean = false;

  /** 点击的世界坐标 */
  private static clickWorldPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  /** 点击的屏幕坐标 */
  private static clickScreenPos: Phaser.Math.Vector2 =
    new Phaser.Math.Vector2();

  /** 是否启用输入（暂停时禁用） */
  private static enabled: boolean = true;

  /**
   * 初始化输入管理器
   * @param scene 当前场景
   */
  static init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupKeyboard();
    this.setupPointer();
  }

  /** 设置键盘监听 */
  private static setupKeyboard(): void {
    if (!this.scene) return;

    this.scene.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (!this.enabled) return;
      this.handleKeyDown(event.code);
    });

    this.scene.input.keyboard!.on("keyup", () => {
      this.updateDirectionFromKeys();
    });
  }

  /** 设置鼠标/触摸监听 */
  private static setupPointer(): void {
    if (!this.scene) return;

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      this.clickedThisFrame = true;
      this.clickScreenPos.set(pointer.x, pointer.y);
      this.clickWorldPos.set(pointer.worldX, pointer.worldY);
    });
  }

  /** 处理按键按下 */
  private static handleKeyDown(code: string): void {
    if (!this.enabled) return;
    this.updateDirectionFromKeys();
    if (code === "Escape") {
      EventBus.emit("escape-pressed");
    }
  }

  /** 根据当前按住的键更新方向（支持8方向组合） */
  private static updateDirectionFromKeys(): void {
    if (!this.scene) return;

    const cursors = this.scene.input.keyboard!.createCursorKeys();
    const wasd = this.scene.input.keyboard!.addKeys("W,A,S,D") as any;

    const up = cursors.up.isDown || wasd.W.isDown;
    const down = cursors.down.isDown || wasd.S.isDown;
    const left = cursors.left.isDown || wasd.A.isDown;
    const right = cursors.right.isDown || wasd.D.isDown;

    if (up && left) this.currentDirection = Direction.UP_LEFT;
    else if (up && right) this.currentDirection = Direction.UP_RIGHT;
    else if (down && left) this.currentDirection = Direction.DOWN_LEFT;
    else if (down && right) this.currentDirection = Direction.DOWN_RIGHT;
    else if (up) this.currentDirection = Direction.UP;
    else if (down) this.currentDirection = Direction.DOWN;
    else if (left) this.currentDirection = Direction.LEFT;
    else if (right) this.currentDirection = Direction.RIGHT;
    else this.currentDirection = Direction.NONE;
  }

  /** 获取当前移动方向（网格移动时每帧查询） */
  static getDirection(): Direction {
    return this.currentDirection;
  }

  /** 是否正在向上移动 */
  static isMovingUp(): boolean {
    return this.currentDirection === Direction.UP;
  }

  /** 是否正在向下移动 */
  static isMovingDown(): boolean {
    return this.currentDirection === Direction.DOWN;
  }

  /** 是否正在向左移动 */
  static isMovingLeft(): boolean {
    return this.currentDirection === Direction.LEFT;
  }

  /** 是否正在向右移动 */
  static isMovingRight(): boolean {
    return this.currentDirection === Direction.RIGHT;
  }

  /** 本帧是否有点击（每帧末尾需调用 clearFrameState 清除） */
  static isJustClicked(): boolean {
    return this.clickedThisFrame;
  }

  /** 获取点击的世界坐标（用于判断点击了哪个网格/节点） */
  static getClickWorldPos(): Phaser.Math.Vector2 {
    return this.clickWorldPos.clone();
  }

  /** 获取点击的屏幕坐标（用于 UI 交互） */
  static getClickScreenPos(): Phaser.Math.Vector2 {
    return this.clickScreenPos.clone();
  }

  /** 清除本帧状态（在场景 update 末尾调用） */
  static clearFrameState(): void {
    this.clickedThisFrame = false;
  }

  /** 启用/禁用输入 */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.currentDirection = Direction.NONE;
    }
  }

  /** 销毁输入管理器，清除所有监听 */
  static destroy(): void {
    this.scene = null;
    this.currentDirection = Direction.NONE;
    this.enabled = true;
  }
}
