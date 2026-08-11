import * as Phaser from "phaser";
import { PathType, BATTLE_MAP_OFFSET_X, BATTLE_MAP_OFFSET_Y } from "@config/battle-constants";
import { BATTLE_PATHS, PathPoint } from "../../data/battle/path-data";

/**
 * 路径管理器 —— 管理三条士兵移动路线（上/中/下）。
 *
 * 支持传入偏移量适配不同画布布局，提供路径上任意进度的精确坐标。
 * 路径由多个控制点组成，沿途插值计算位置。
 */
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

  /** 从路径数据创建坐标点（加偏移量） */
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

  /**
   * 获取路径上指定进度的坐标。
   * progress 0=起点 1=终点，在各段之间线性插值。
   */
  getPositionOnPath(pathType: PathType, progress: number): Phaser.Math.Vector2 {
    const pathPoints = this.getPathPoints(pathType);
    if (pathPoints.length < 2) return new Phaser.Math.Vector2(0, 0);

    progress = Phaser.Math.Clamp(progress, 0, 1);

    const totalLength = this.calculatePathLength(pathPoints);
    const targetLength = totalLength * progress;

    // 累加各段长度直到到达目标进度，在该段内线性插值
    let currentLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const segmentLength = Phaser.Math.Distance.Between(
        pathPoints[i].x, pathPoints[i].y,
        pathPoints[i + 1].x, pathPoints[i + 1].y,
      );

      if (currentLength + segmentLength >= targetLength) {
        const segmentProgress = (targetLength - currentLength) / segmentLength;
        return new Phaser.Math.Vector2(
          Phaser.Math.Linear(pathPoints[i].x, pathPoints[i + 1].x, segmentProgress),
          Phaser.Math.Linear(pathPoints[i].y, pathPoints[i + 1].y, segmentProgress),
        );
      }

      currentLength += segmentLength;
    }

    return pathPoints[pathPoints.length - 1].clone();
  }

  /** 计算路径总长度 */
  private calculatePathLength(points: Phaser.Math.Vector2[]): number {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      length += Phaser.Math.Distance.Between(
        points[i].x, points[i].y,
        points[i + 1].x, points[i + 1].y,
      );
    }
    return length;
  }

  getPathLength(pathType: PathType): number {
    return this.calculatePathLength(this.getPathPoints(pathType));
  }
}
