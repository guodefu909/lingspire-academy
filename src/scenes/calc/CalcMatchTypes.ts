import * as Phaser from 'phaser';

/** 方格精灵对象 */
export interface CellSprite {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  cover: Phaser.GameObjects.Rectangle;
  coverText: Phaser.GameObjects.Text;
  row: number;
  col: number;
  isFlipped: boolean;
}

// ========== 布局常量 ==========

export const CELL_SIZE = 80;
export const CELL_GAP = 8;
export const FLIP_ANIM_MS = 300;
export const FLIP_SHOW_MS = 1000;
export const TARGET_CARD_W = 150;
export const TARGET_CARD_H = 48;
export const TARGET_CARD_OFFSET_X = 4;
export const TARGET_CARD_OFFSET_Y = 4;
export const MAX_VISIBLE_CARDS = 4;
