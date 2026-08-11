/**
 * 对战游戏常量定义 —— 画布尺寸、水晶坐标等固定参数。
 *
 * 水晶坐标根据地图图片中的实际位置设定（用户在地图图片中标定后换算）。
 */
export enum PathType {
  TOP = "top", MIDDLE = "middle", BOTTOM = "bottom",
}

export enum VictoryResult {
  ONGOING = "ongoing", PLAYER_WIN = "player_win",
  ENEMY_WIN = "enemy_win", DRAW = "draw",
}

/** 画布尺寸 1024×768 */
export const BATTLE_CANVAS_WIDTH = 1024;
export const BATTLE_CANVAS_HEIGHT = 768;
export const BATTLE_MAP_SIZE = 800;

/** 地图偏移量（当前为 0，水晶坐标使用绝对像素值） */
export const BATTLE_MAP_OFFSET_X = 0;
export const BATTLE_MAP_OFFSET_Y = 0;

/** 玩家水晶（左下）像素坐标 */
export const PLAYER_CRYSTAL_X = 223;
export const PLAYER_CRYSTAL_Y = 653;

/** 敌方水晶（右上）像素坐标 */
export const ENEMY_CRYSTAL_X = 804;
export const ENEMY_CRYSTAL_Y = 64;

/** 游戏总局时 10 分钟 */
export const BATTLE_GAME_DURATION = 10 * 60 * 1000;
