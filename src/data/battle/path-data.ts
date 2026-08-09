import { PathType, PLAYER_CRYSTAL_X, PLAYER_CRYSTAL_Y, ENEMY_CRYSTAL_X, ENEMY_CRYSTAL_Y } from "@config/battle-constants";

export interface PathPoint {
  x: number;
  y: number;
}

const CORNER_RADIUS = 60;

function arcPoints(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  steps: number,
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

const topArcCenterX = PLAYER_CRYSTAL_X + CORNER_RADIUS;
const topArcCenterY = ENEMY_CRYSTAL_Y + CORNER_RADIUS;

const bottomArcCenterX = ENEMY_CRYSTAL_X - CORNER_RADIUS;
const bottomArcCenterY = PLAYER_CRYSTAL_Y - CORNER_RADIUS;

export const BATTLE_PATHS: Record<PathType, PathPoint[]> = {
  [PathType.TOP]: [
    { x: PLAYER_CRYSTAL_X, y: PLAYER_CRYSTAL_Y },
    { x: PLAYER_CRYSTAL_X, y: ENEMY_CRYSTAL_Y + CORNER_RADIUS },
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
    ...arcPoints(bottomArcCenterX, bottomArcCenterY, CORNER_RADIUS, Math.PI * 0.5, 0, 6),
    { x: ENEMY_CRYSTAL_X, y: PLAYER_CRYSTAL_Y - CORNER_RADIUS },
    { x: ENEMY_CRYSTAL_X, y: ENEMY_CRYSTAL_Y },
  ],
};
