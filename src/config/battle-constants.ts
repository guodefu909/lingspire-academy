export enum PathType {
  TOP = "top",
  MIDDLE = "middle",
  BOTTOM = "bottom",
}

export enum VictoryResult {
  ONGOING = "ongoing",
  PLAYER_WIN = "player_win",
  ENEMY_WIN = "enemy_win",
  DRAW = "draw",
}

export const BATTLE_MAP_SIZE = 800;
export const BATTLE_CANVAS_WIDTH = 1024;
export const BATTLE_CANVAS_HEIGHT = 768;
export const BATTLE_MAP_OFFSET_X = 0;
export const BATTLE_MAP_OFFSET_Y = 0;

export const PLAYER_CRYSTAL_X = 223;
export const PLAYER_CRYSTAL_Y = 653;
export const ENEMY_CRYSTAL_X = 804;
export const ENEMY_CRYSTAL_Y = 64;
export const BATTLE_GAME_DURATION = 10 * 60 * 1000;
