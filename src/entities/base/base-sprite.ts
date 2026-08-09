import * as Phaser from "phaser";
import { BaseEntity, EntityType } from "./base-entity";
import {
  GRID_SIZE,
  PLAYER_MOVE_DURATION,
  PLAYER_MOVE_EASE,
} from "@config/constants";

export abstract class BaseSprite extends BaseEntity {
  protected scene: Phaser.Scene;
  protected container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    id: string,
    type: EntityType,
    col: number,
    row: number,
  ) {
    super(id, type, col, row);

    this.scene = scene;

    const worldX = BaseEntity.gridToWorldX(col);
    const worldY = BaseEntity.gridToWorldY(row);

    this.container = scene.add.container(worldX, worldY);
    this.container.setDepth(1);
  }

  setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  moveToGrid(
    col: number,
    row: number,
    onComplete?: () => void,
    duration?: number,
  ): void {
    const worldX = BaseEntity.gridToWorldX(col);
    const worldY = BaseEntity.gridToWorldY(row);

    this.setGridPos(col, row);

    this.scene.tweens.add({
      targets: this.container,
      x: worldX,
      y: worldY,
      duration: duration ?? PLAYER_MOVE_DURATION,
      ease: PLAYER_MOVE_EASE,
      onComplete: () => {
        onComplete?.();
      },
    });
  }

  getSprite(): Phaser.GameObjects.Container {
    return this.container;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy();
    super.destroy();
  }
}
