import { PathType } from "@config/battle-constants";

export interface PathPoint {
  x: number;
  y: number;
}

export const BATTLE_PATHS: Record<PathType, PathPoint[]> = {
  [PathType.TOP]: [
    { x: 80, y: 720 },
    { x: 80, y: 80 },
    { x: 720, y: 80 },
  ],
  [PathType.MIDDLE]: [
    { x: 80, y: 720 },
    { x: 400, y: 400 },
    { x: 720, y: 80 },
  ],
  [PathType.BOTTOM]: [
    { x: 80, y: 720 },
    { x: 720, y: 720 },
    { x: 720, y: 80 },
  ],
};
