import * as Phaser from "phaser";
import {
  PathType,
  BATTLE_MAP_OFFSET_X,
  BATTLE_MAP_OFFSET_Y,
} from "@config/battle-constants";
import { BATTLE_PATHS, PathPoint } from "../../data/battle/path-data";

export class PathManager {
  private paths: Map<PathType, Phaser.Math.Vector2[]> = new Map();
  private mapSize: number;
  private offsetX: number;
  private offsetY: number;

  constructor(
    mapSize: number = 800,
    offsetX: number = BATTLE_MAP_OFFSET_X,
    offsetY: number = BATTLE_MAP_OFFSET_Y,
  ) {
    this.mapSize = mapSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.initPaths();
  }

  private initPaths(): void {
    Object.entries(BATTLE_PATHS).forEach(([pathType, points]) => {
      const vectors = points.map(
        (p) => new Phaser.Math.Vector2(p.x + this.offsetX, p.y + this.offsetY),
      );
      this.paths.set(pathType as PathType, vectors);
    });
  }

  getPathPoints(pathType: PathType): Phaser.Math.Vector2[] {
    return this.paths.get(pathType) || [];
  }

  getPositionOnPath(pathType: PathType, progress: number): Phaser.Math.Vector2 {
    const pathPoints = this.getPathPoints(pathType);
    if (pathPoints.length < 2) {
      return new Phaser.Math.Vector2(0, 0);
    }

    progress = Phaser.Math.Clamp(progress, 0, 1);

    const totalLength = this.calculatePathLength(pathPoints);
    const targetLength = totalLength * progress;

    let currentLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const segmentLength = Phaser.Math.Distance.Between(
        pathPoints[i].x,
        pathPoints[i].y,
        pathPoints[i + 1].x,
        pathPoints[i + 1].y,
      );

      if (currentLength + segmentLength >= targetLength) {
        const segmentProgress = (targetLength - currentLength) / segmentLength;
        return new Phaser.Math.Vector2(
          Phaser.Math.Linear(
            pathPoints[i].x,
            pathPoints[i + 1].x,
            segmentProgress,
          ),
          Phaser.Math.Linear(
            pathPoints[i].y,
            pathPoints[i + 1].y,
            segmentProgress,
          ),
        );
      }

      currentLength += segmentLength;
    }

    return pathPoints[pathPoints.length - 1].clone();
  }

  private calculatePathLength(points: Phaser.Math.Vector2[]): number {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      length += Phaser.Math.Distance.Between(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
      );
    }
    return length;
  }

  getPathLength(pathType: PathType): number {
    const pathPoints = this.getPathPoints(pathType);
    return this.calculatePathLength(pathPoints);
  }
}
