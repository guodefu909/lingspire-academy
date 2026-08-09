/**
 * 实体基类 —— 所有游戏对象的公共基类
 * 【作用】
 * 定义所有实体的公共属性：网格坐标、是否存活、实体类型
 * 提供网格坐标与世界坐标的转换方法
 * 统一的生命周期管理
 * 【类比】类似后端的 BaseEntity，所有实体类继承它
 * 【继承关系】
 * BaseEntity → BaseSprite → Player / Enemy / NPC
 */
import { GRID_SIZE } from "@config/constants";
/** 实体类型枚举 */
export enum EntityType {
  PLAYER = "player",
  ENEMY = "enemy",
  NPC = "npc",
  ITEM = "item",
}

export abstract class BaseEntity {
  /** 实体唯一 ID */
  readonly id: string;
  /** 实体类型 */
  readonly type: EntityType;
  /** 网格列坐标（从0开始） */
  protected gridCol: number;
  /** 网格行坐标（从0开始） */
  protected gridRow: number;
  /** 是否存活 */
  protected alive: boolean;

  constructor(id: string, type: EntityType, col: number, row: number) {
    this.id = id;
    this.type = type;
    this.gridCol = col;
    this.gridRow = row;
    this.alive = true;
  }

  /** 获取网格列坐标 */
  getGridCol(): number {
    return this.gridCol;
  }

  /** 获取网格行坐标 */
  getGridRow(): number {
    return this.gridRow;
  }

  /** 设置网格坐标 */
  setGridPos(col: number, row: number): void {
    this.gridCol = col;
    this.gridRow = row;
  }

  /** 是否存活 */
  isAlive(): boolean {
    return this.alive;
  }

  /** 销毁实体 */
  destroy(): void {
    this.alive = false;
  }

  /**
   * 网格坐标 → 世界像素坐标（X）
   * 格子中心点的 X 像素位置 = 列号 × 格子大小 + 半个格子大小
   */
  static gridToWorldX(col: number): number {
    return col * GRID_SIZE + GRID_SIZE / 2;
  }

  /**
   * 网格坐标 → 世界像素坐标（Y）
   */
  static gridToWorldY(row: number): number {
    return row * GRID_SIZE + GRID_SIZE / 2;
  }

  /**
   * 世界像素坐标 → 网格列号
   */
  static worldToGridCol(worldX: number): number {
    return Math.floor(worldX / GRID_SIZE);
  }

  /**
   * 世界像素坐标 → 网格行号
   */
  static worldToGridRow(worldY: number): number {
    return Math.floor(worldY / GRID_SIZE);
  }
}
