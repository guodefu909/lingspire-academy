/**
 * 玩家实体 —— 玩家控制的角色
 * 【作用】
 * 代表灵界之灵引导的孩子
 * 在网格地图上移动
 * 与关卡节点交互
 * 【精灵图】
 * player-idle: 5行1列(下/左下/左/左上/上)，每帧256x256
 * player-walk: 5行8列(下/左下/左/左上/上)，每帧256x256
 * 右侧方向(右下/右/右上)通过 flipX 镜像左侧方向实现
 * 【方向行映射】
 * 行0=下, 行1=左下, 行2=左, 行3=左上, 行4=上
 * 右下=左下+flipX, 右=左+flipX, 右上=左上+flipX
 */
import * as Phaser from "phaser";
import { BaseSprite } from "../base/base-sprite";
import { EntityType } from "../base/base-entity";
import { GRID_SIZE } from "@config/constants";
const FRAME_SIZE = 256;
const DIR_ROWS: Record<string, number> = {
  down: 0,
  downleft: 1,
  left: 2,
  upleft: 3,
  up: 4,
  downright: 1,
  right: 2,
  upright: 3,
};
const FLIP_DIRS = new Set(["downright", "right", "upright"]);

export class Player extends BaseSprite {
  private facing: string = "down";
  private sprite: Phaser.GameObjects.Sprite;
  private isMoving: boolean = false;
  private static animsCreated: boolean = false;

  constructor(scene: Phaser.Scene, startCol: number, startRow: number) {
    super(scene, "player", EntityType.PLAYER, startCol, startRow);
    this.setDepth(10);

    if (!Player.animsCreated) {
      Player.createAnimations(scene);
      Player.animsCreated = true;
    }

    this.sprite = scene.add.sprite(0, 0, "player-idle");
    this.sprite.setOrigin(0.5, 1.0);
    this.sprite.setY(GRID_SIZE * 0.4);
    this.container.add(this.sprite);

    this.playIdle();
  }

  private static createAnimations(scene: Phaser.Scene): void {
    const dirs = ["down", "downleft", "left", "upleft", "up"];

    for (let i = 0; i < dirs.length; i++) {
      const row = i;

      scene.anims.create({
        key: `idle-${dirs[i]}`,
        frames: scene.anims.generateFrameNumbers("player-idle", {
          start: row,
          end: row,
        }),
        duration: 1000,
        repeat: -1,
      });

      const walkFrames: number[] = [];
      for (let f = 0; f < 8; f++) {
        walkFrames.push(row * 8 + f);
      }

      scene.anims.create({
        key: `walk-${dirs[i]}`,
        frames: walkFrames.map((idx) => ({
          key: "player-walk",
          frame: idx,
          duration: 100,
        })),
        duration: 800,
        repeat: -1,
      });
    }
  }

  private playIdle(): void {
    const dir = this.normalizeDir(this.facing);
    const flipX = FLIP_DIRS.has(this.facing);
    this.sprite.setFlipX(flipX);
    this.sprite.play(`idle-${dir}`, true);
    this.isMoving = false;
  }

  playIdleIfWalking(): void {
    if (this.isMoving) return;
    const currentAnim = this.sprite.anims.currentAnim;
    if (currentAnim && currentAnim.key.startsWith("walk-")) {
      this.playIdle();
    }
  }

  private playWalk(): void {
    const dir = this.normalizeDir(this.facing);
    const flipX = FLIP_DIRS.has(this.facing);
    this.sprite.setFlipX(flipX);
    this.sprite.play(`walk-${dir}`, true);
  }

  private normalizeDir(dir: string): string {
    if (dir === "downright") return "downleft";
    if (dir === "right") return "left";
    if (dir === "upright") return "upleft";
    return dir;
  }

  private setFacing(dCol: number, dRow: number): void {
    if (dCol > 0 && dRow > 0) this.facing = "downright";
    else if (dCol > 0 && dRow < 0) this.facing = "upright";
    else if (dCol > 0) this.facing = "right";
    else if (dCol < 0 && dRow > 0) this.facing = "downleft";
    else if (dCol < 0 && dRow < 0) this.facing = "upleft";
    else if (dCol < 0) this.facing = "left";
    else if (dRow > 0) this.facing = "down";
    else if (dRow < 0) this.facing = "up";
  }

  updateFacing(dCol: number, dRow: number): void {
    this.setFacing(dCol, dRow);
    this.playWalk();
  }

  moveToGrid(
    col: number,
    row: number,
    onComplete?: () => void,
    duration?: number,
  ): void {
    this.setFacing(col - this.gridCol, row - this.gridRow);

    this.isMoving = true;
    this.playWalk();

    super.moveToGrid(
      col,
      row,
      () => {
        this.isMoving = false;
        this.playIdle();
        onComplete?.();
      },
      duration,
    );
  }

  getFacing(): string {
    return this.facing;
  }
}
