import { PathType, PLAYER_CRYSTAL_X, PLAYER_CRYSTAL_Y, ENEMY_CRYSTAL_X, ENEMY_CRYSTAL_Y } from "@config/battle-constants";

export interface PathPoint {
  x: number;
  y: number;
}

/** 拐角圆弧半径（像素）—— 与地图道路弯道匹配 */
const CORNER_RADIUS = 60;

/**
 * 生成圆弧上的插值点（用于圆角转弯）。
 * @param cx,cy 圆心坐标
 * @param r 半径
 * @param startAngle 起始角度（弧度）
 * @param endAngle 终止角度（弧度）
 * @param steps 插值点数量
 */
function arcPoints(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number, steps: number,
): PathPoint[] {
  const points: PathPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / (steps + 1));
    points.push({
      x: Math.round(cx + r * Math.cos(a)),
      y: Math.round(cy + r * Math.sin(a)),
    });
  }
  return points;
}

// 左上角拐弯圆心（TOP 路径的转弯处）
const topArcCenterX = PLAYER_CRYSTAL_X + CORNER_RADIUS;
const topArcCenterY = ENEMY_CRYSTAL_Y + CORNER_RADIUS;

// 右下角拐弯圆心（BOTTOM 路径的转弯处）
const bottomArcCenterX = ENEMY_CRYSTAL_X - CORNER_RADIUS;
const bottomArcCenterY = PLAYER_CRYSTAL_Y - CORNER_RADIUS;

/**
 * 三条战斗路径定义：
 * TOP：玩家→直上→圆角左转→直右→敌方
 * MIDDLE：玩家→对角线直连→敌方（无拐角）
 * BOTTOM：玩家→直右→圆角上转→直上→敌方
 */
export const BATTLE_PATHS: Record<PathType, PathPoint[]> = {
  [PathType.TOP]: [
    { x: PLAYER_CRYSTAL_X, y: PLAYER_CRYSTAL_Y },
    { x: PLAYER_CRYSTAL_X, y: ENEMY_CRYSTAL_Y + CORNER_RADIUS },
    // 左上角圆弧（π→3π/2，即上→右）
    ...arcPoints(topArcCenterX, topArcCenterY, CORNER_RADIUS, Math.PI, Math.PI * 1.5, 6),
    { x: PLAYER_CRYSTAL_X + CORNER_RADIUS, y: ENEMY_CRYSTAL_Y },
    { x: ENEMY_CRYSTAL_X, y: ENEMY_CRYSTAL_Y },
  ],
  [PathType.MIDDLE]: [
    { x: PLAYER_CRYSTAL_X, y: PLAYER_CRYSTAL_Y },
    { x: Math.round((PLAYER_CRYSTAL_X + ENEMY_CRYSTAL_X) / 2), y: Math.round((PLAYER_CRYSTAL_Y + ENEMY_CRYSTAL_Y) / 2) },
    { x: ENEMY_CRYSTAL_X, y: ENEMY_CRYSTAL_Y },
  ],
  [PathType.BOTTOM]: [
    { x: PLAYER_CRYSTAL_X, y: PLAYER_CRYSTAL_Y },
    { x: ENEMY_CRYSTAL_X - CORNER_RADIUS, y: PLAYER_CRYSTAL_Y },
    // 右下角圆弧（π/2→0）
    ...arcPoints(bottomArcCenterX, bottomArcCenterY, CORNER_RADIUS, Math.PI * 0.5, 0, 6),
    { x: ENEMY_CRYSTAL_X, y: PLAYER_CRYSTAL_Y - CORNER_RADIUS },
    { x: ENEMY_CRYSTAL_X, y: ENEMY_CRYSTAL_Y },
  ],
};
