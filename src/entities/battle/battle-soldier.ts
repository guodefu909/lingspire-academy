import * as Phaser from "phaser";
import { PathType } from "@config/battle-constants";
import { PathManager } from "../../managers/battle/path.manager";

/**
 * 战斗士兵实体 —— 沿路径移动的士兵，支持六方向精灵动画、血条显示和单词标签。
 *
 * 士兵按照 PathManager 定义的路线行走，progress 0=起点 1=终点。
 * 玩家士兵从 progress 0→1，敌方士兵从 1→0，
 * 以实现双方互向对方基地移动。
 */
export class BattleSoldier extends Phaser.GameObjects.Container {
  private word: string;
  private imageUrl: string;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private pathType: PathType;
  private pathProgress: number;
  private pathManager: PathManager;
  /** 走动精灵图 */
  private sprite: Phaser.GameObjects.Sprite;
  /** 胸前显示的单词标签 */
  private wordText: Phaser.GameObjects.Text;
  /** 头顶血条 */
  private healthBar: Phaser.GameObjects.Graphics;
  /** 是否属于玩家一方 */
  private isPlayerOwned: boolean;
  /** 出兵批次（同批次同路双方士兵对应相遇） */
  private batch: number;
  /** 是否已开始移动（用于延迟碰撞检测） */
  private hasStartedMoving: boolean = false;
  /** 淡入进度计时器 */
  private fadeInProgress: number = 0;
  /** 出生后不可见阶段时长 */
  private invisibleDuration: number = 700;
  /** 淡入动画时长 */
  private fadeInDuration: number = 300;
  /** 是否已被正确子弹锁定（不再可点击） */
  private locked: boolean = false;
  /** 手动动画帧索引 0~7 */
  private frameIndex: number = 0;
  /** 手动动画计时器 */
  private frameTimer: number = 0;
  /**
   * 当前方向对应的精灵图起始帧号。
   * 0=下  8=左下  16=左  24=左上  32=上
   * 右侧方向通过 setFlipX(true) 镜像实现。
   */
  private animBaseFrame: number = 32;

  constructor(
    scene: Phaser.Scene,
    word: string,
    imageUrl: string,
    pathType: PathType,
    pathManager: PathManager,
    maxHealth: number = 5,
    speed: number = 60,
    isPlayerOwned: boolean = true,
    batch: number = 0,
  ) {
    super(scene, 0, 0);

    this.word = word;
    this.imageUrl = imageUrl;
    this.pathType = pathType;
    this.pathManager = pathManager;
    this.maxHealth = maxHealth;
    this.health = 1;
    this.batch = batch;

    // 中路路径更短，调低速度使各路到达时间一致
    if (pathType === PathType.MIDDLE) {
      this.speed = speed * 0.707;
    } else {
      this.speed = speed;
    }

    this.isPlayerOwned = isPlayerOwned;
    this.hasStartedMoving = false;
    this.pathProgress = this.isPlayerOwned ? 0 : 1;
    // 初始朝向：玩家朝上，敌方朝下
    this.animBaseFrame = this.isPlayerOwned ? 32 : 0;

    this.setAlpha(0);
    this.setDepth(this.isPlayerOwned ? 1 : 2);

    // 行走精灵（256px 原始帧 → 0.25 缩放 = 64px 显示）
    this.sprite = scene.add.sprite(0, 0, "soldier-walk", this.animBaseFrame);
    this.sprite.setScale(0.25);

    this.healthBar = scene.add.graphics();

    // 胸前单词标签：敌方白色加粗+红色描边，玩家白色常规
    this.wordText = scene.add
      .text(0, 0, word, {
        fontSize: "13px",
        color: "#ffffff",
        fontFamily: "Arial",
        fontStyle: this.isPlayerOwned ? "normal" : "bold",
        stroke: this.isPlayerOwned ? "#333333" : "#d32f2f",
        strokeThickness: this.isPlayerOwned ? 2 : 4,
        backgroundColor: "#33333366",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5);

    // 玩家蓝色调，敌方红色调
    if (this.isPlayerOwned) {
      this.sprite.setTint(0xccddff);
    } else {
      this.sprite.setTint(0xffcccc);
    }

    this.add([this.sprite, this.wordText, this.healthBar]);
    this.updateHealthBar();

    // 初始化位置
    if (this.isPlayerOwned) {
      const startPos = pathManager.getPositionOnPath(pathType, 0);
      this.setPosition(startPos.x, startPos.y);
    } else {
      const startPos = pathManager.getPositionOnPath(pathType, 1);
      this.setPosition(startPos.x, startPos.y);
    }

    // 点击区域：放大到覆盖精灵 + 血条 + 标签，降低点击难度
    this.setInteractive(
      new Phaser.Geom.Rectangle(-40, -48, 80, 90),
      Phaser.Geom.Rectangle.Contains,
    );

    scene.add.existing(this);
  }

  /**
   * 根据位移向量选择对应的行走方向动画。
   * 角度从正右 0° 逆时针计算，映射到六方向精灵行。
   *
   * 方向映射：右（-22.5°~22.5°）→ 左行+镜像  右上（-67.5°~-22.5°）→ 左上+镜像
   *           上（-112.5°~-67.5°）→ 上行      左上（-157.5°~-112.5°）→ 上行
   *           左（>157.5° or <-157.5°）→ 左行  左下（112.5°~157.5°）→ 左下
   *           下（67.5°~112.5°）→ 下行        右下（22.5°~67.5°）→ 下行
   */
  private updateDirectionAnimation(dx: number, dy: number): void {
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    const a = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (a > 157.5 || a < -157.5) {
      // 左
      this.sprite.setFlipX(false);
      this.animBaseFrame = 16;
    } else if (a >= 112.5) {
      // 左下
      this.sprite.setFlipX(false);
      this.animBaseFrame = 8;
    } else if (a > 67.5) {
      // 下
      this.sprite.setFlipX(false);
      this.animBaseFrame = 0;
    } else if (a > 22.5) {
      // 右下 → 用下行动画
      this.sprite.setFlipX(false);
      this.animBaseFrame = 0;
    } else if (a >= -22.5) {
      // 右 → 左行动画 + 水平镜像
      this.sprite.setFlipX(true);
      this.animBaseFrame = 16;
    } else if (a >= -67.5) {
      // 右上 → 左上动画 + 镜像
      this.sprite.setFlipX(true);
      this.animBaseFrame = 24;
    } else if (a >= -112.5) {
      // 上
      this.sprite.setFlipX(false);
      this.animBaseFrame = 32;
    } else if (a >= -157.5) {
      // 左上 → 用上行动画
      this.sprite.setFlipX(false);
      this.animBaseFrame = 32;
    } else {
      // 左
      this.sprite.setFlipX(false);
      this.animBaseFrame = 16;
    }
  }

  /**
   * 头顶血条：红色方块，每格 16×5 px，只显示当前血量数量，居中排列。
   */
  private updateHealthBar(): void {
    this.healthBar.clear();

    const blockW = 16;
    const blockH = 5;
    const gap = 2;
    const count = this.health;
    if (count <= 0) return;

    const totalW = count * blockW + (count - 1) * gap;
    const barY = -36;

    for (let i = 0; i < count; i++) {
      const x = -totalW / 2 + i * (blockW + gap);
      this.healthBar.fillStyle(0xe74c3c, 1);
      this.healthBar.fillRect(x, barY - blockH / 2, blockW, blockH);
    }
  }

  /**
   * 每帧更新：淡入效果 → 手动帧动画（10fps）→ 沿路径移动 → 刷新方向动画。
   */
  move(delta: number): void {
    // 出生淡入效果：先隐藏 700ms，再 300ms 淡入
    if (this.fadeInProgress < this.invisibleDuration + this.fadeInDuration) {
      this.fadeInProgress += delta;

      if (this.fadeInProgress < this.invisibleDuration) {
        this.setAlpha(0);
      } else {
        const fadeInTime = this.fadeInProgress - this.invisibleDuration;
        const alpha = Math.min(1, fadeInTime / this.fadeInDuration);
        this.setAlpha(alpha);
      }
    }

    // 手动逐帧动画：每 100ms 切换一帧，8 帧循环
    this.frameTimer += delta;
    if (this.frameTimer >= 100) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % 8;
      this.sprite.setFrame(this.animBaseFrame + this.frameIndex);
    }

    // 沿路径移动
    const pathLength = this.pathManager.getPathLength(this.pathType);
    const progressDelta = (this.speed * delta) / 1000 / pathLength;

    if (!this.hasStartedMoving) {
      this.hasStartedMoving = true;
    }

    if (this.isPlayerOwned) {
      this.pathProgress = Math.min(1, this.pathProgress + progressDelta);
    } else {
      this.pathProgress = Math.max(0, this.pathProgress - progressDelta);
    }

    const newPos = this.pathManager.getPositionOnPath(
      this.pathType,
      this.pathProgress,
    );
    this.setPosition(newPos.x, newPos.y);

    // 方向基于路径切线采样（与移动速度无关，避免慢速时单帧位移过小导致朝向检测失效）
    const tangentEps = 0.05;
    const tangentProgress = this.isPlayerOwned
      ? this.pathProgress + tangentEps
      : this.pathProgress - tangentEps;
    const tangentPos = this.pathManager.getPositionOnPath(
      this.pathType,
      tangentProgress,
    );
    this.updateDirectionAnimation(
      tangentPos.x - newPos.x,
      tangentPos.y - newPos.y,
    );
  }

  /** 是否已抵达路径终点 */
  hasReachedEnd(): boolean {
    if (!this.hasStartedMoving) return false;
    return this.isPlayerOwned ? this.pathProgress >= 1 : this.pathProgress <= 0;
  }

  /** 受到指定点数的伤害（cause: bullet=炮弹命中，collision=相遇碰撞） */
  takeDamage(amount: number = 1, cause: string = "bullet"): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    if (this.health <= 0) this.onDeath(cause);
  }

  /** 恢复 1 点血量（上限 maxHealth） */
  heal(): void {
    if (this.health < this.maxHealth) {
      this.health++;
      this.updateHealthBar();
    }
  }

  /** 死亡时发出事件通知外部清理 */
  private onDeath(cause: string): void {
    this.scene.events.emit("soldier-died", this, cause);
    this.destroy();
  }

  getHealth(): number { return this.health; }
  getWord(): string { return this.word; }
  getImageUrl(): string { return this.imageUrl; }
  getPathProgress(): number { return this.pathProgress; }
  getIsPlayerOwned(): boolean { return this.isPlayerOwned; }
  getPathType(): PathType { return this.pathType; }
  getBatch(): number { return this.batch; }
  lock(): void { this.locked = true; }
  isLocked(): boolean { return this.locked; }
}
