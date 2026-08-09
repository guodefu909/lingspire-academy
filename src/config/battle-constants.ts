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
export const BATTLE_MAP_OFFSET_X = (BATTLE_CANVAS_WIDTH - BATTLE_MAP_SIZE) / 2;
export const BATTLE_MAP_OFFSET_Y = (BATTLE_CANVAS_HEIGHT - BATTLE_MAP_SIZE) / 2;
export const BATTLE_GAME_DURATION = 10 * 60 * 1000;
