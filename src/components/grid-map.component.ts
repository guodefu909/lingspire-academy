import * as Phaser from "phaser";
import {
  GRID_SIZE,
  COLOR_GRASS,
  COLOR_ROAD,
  COLOR_ROAD_DAMAGED,
  COLOR_WATER,
  COLOR_TOWER,
  COLOR_TOWER_DAMAGED,
  COLOR_SPIRIT_LIGHT,
} from "@config/constants";
import { StateManager } from "@core/state-manager";

/** 网格单元格类型枚举 */
export enum GridCellType {
  /** 草地（装饰，不可通行） */
  GRASS = "grass",
  /** 完好道路（可通行） */
  ROAD = "road",
  /** 损坏道路（关卡载体，不可通行，解谜修复后变为道路） */
  ROAD_DAMAGED = "road_damaged",
  /** 损坏建筑（关卡载体，不可通行，解谜修复后变为建筑） */
  BUILDING_DAMAGED = "building_damaged",
  /** 损坏标志（关卡载体，不可通行，解谜修复后变为标志） */
  SIGN_DAMAGED = "sign_damaged",
  /** 损坏灵塔（最终关卡载体，可通行到旁边触发，修复后岛屿通关） */
  TOWER_DAMAGED = "tower_damaged",
  /** 完好建筑（修复后的建筑，可通行） */
  BUILDING = "building",
  /** 完好标志（修复后的标志，可通行） */
  SIGN = "sign",
  /** 完好灵塔（修复后，岛屿通关标志） */
  TOWER = "tower",
  /** 起点（玩家初始位置） */
  START = "start",
  /** 水面（装饰，不可通行） */
  WATER = "water",
}

/** 解谜配置接口 —— 每个损坏格子自带的关卡数据 */
export interface PuzzleConfig {
  /** 关卡唯一 ID */
  id: string;
  /** 关卡名称 */
  name: string;
  /** 学习知识点 */
  knowledgePoint: string;
  /** 关卡类型（如 'grid-fill' 方格放灵石） */
  type: string;
  /** 难度等级 1~5 */
  difficulty: number;
  /** 关卡描述 */
  description: string;
  /** 关卡具体配置（不同类型有不同结构） */
  config: any;
  /** 通过后奖励的灵石数 */
  rewardStones: number;
  /** 通过后奖励的灵光值 */
  rewardLight: number;
}

/** 单元格数据结构 */
export interface GridCell {
  /** 列坐标 */
  col: number;
  /** 行坐标 */
  row: number;
  /** 格子类型 */
  type: GridCellType;
  /** 是否已修复 */
  repaired: boolean;
  /** 关卡配置（仅损坏类型的格子有） */
  puzzle?: PuzzleConfig;
}

/** 岛屿数据 JSON 的结构 */
export interface IslandData {
  /** 岛屿 ID */
  id: string;
  /** 岛屿名称 */
  name: string;
  /** 地图网格数据（二维数组，每个元素是格子定义） */
  grid: CellDef[][];
}

/** JSON 中每个格子的定义 */
export interface CellDef {
  /** 格子类型 */
  type: string;
  /** 关卡配置（仅损坏类型需要） */
  puzzle?: PuzzleConfig;
}

/**
 * 网格地图组件 —— 管理岛屿的网格地图渲染与交互
 * 【作用】
 * 解析岛屿 JSON 数据，将二维网格数组渲染为可视化的网格地图
 * 管理格子的通行性判断（可通行/不可通行/损坏）
 * 处理格子修复后的视觉效果更新
 */
export class GridMapComponent {
  private scene: Phaser.Scene;
  private islandData: IslandData;
  private cells: GridCell[][] = [];
  private cellGraphics: Phaser.GameObjects.Rectangle[][] = [];

  constructor(scene: Phaser.Scene, islandData: IslandData) {
    this.scene = scene;
    this.islandData = islandData;
    this.initCells();
    this.renderMap();
  }

  /** 初始化格子数据 */
  private initCells(): void {
    this.cells = [];

    // 获取已完成的关卡 ID 列表，用于恢复存档进度
    const completedNodes = StateManager.getState().player.completedNodes;

    for (let row = 0; row < this.islandData.grid.length; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.islandData.grid[row].length; col++) {
        const cellDef = this.islandData.grid[row][col];
        const type = cellDef.type as GridCellType;

        // 检查该格子是否已被修复（存档中有对应的 puzzleId）
        let repaired = false;
        let actualType = type;
        if (cellDef.puzzle && completedNodes.includes(cellDef.puzzle.id)) {
          repaired = true;
          // 恢复为完好类型
          switch (type) {
            case GridCellType.ROAD_DAMAGED:
              actualType = GridCellType.ROAD;
              break;
            case GridCellType.BUILDING_DAMAGED:
              actualType = GridCellType.BUILDING;
              break;
            case GridCellType.SIGN_DAMAGED:
              actualType = GridCellType.SIGN;
              break;
            case GridCellType.TOWER_DAMAGED:
              actualType = GridCellType.TOWER;
              break;
          }
        }

        this.cells[row][col] = {
          col,
          row,
          type: actualType,
          repaired,
          puzzle: cellDef.puzzle,
        };
      }
    }
  }

  /** 渲染地图 */
  private renderMap(): void {
    for (let row = 0; row < this.cells.length; row++) {
      this.cellGraphics[row] = [];
      for (let col = 0; col < this.cells[row].length; col++) {
        const cell = this.cells[row][col];
        const x = col * GRID_SIZE + GRID_SIZE / 2;
        const y = row * GRID_SIZE + GRID_SIZE / 2;
        const color = this.getCellColor(cell);
        const alpha = this.getCellAlpha(cell);

        const rect = this.scene.add.rectangle(
          x,
          y,
          GRID_SIZE - 1,
          GRID_SIZE - 1,
          color,
          alpha,
        );
        rect.setDepth(1);
        this.cellGraphics[row][col] = rect;

        this.addCellMarker(cell, x, y);
      }
    }
  }

  /** 获取格子颜色 */
  private getCellColor(cell: GridCell): number {
    switch (cell.type) {
      case GridCellType.GRASS:
        return COLOR_GRASS;
      case GridCellType.ROAD:
        return COLOR_ROAD;
      case GridCellType.ROAD_DAMAGED:
        return COLOR_ROAD_DAMAGED;
      case GridCellType.BUILDING_DAMAGED:
        return 0x886644;
      case GridCellType.SIGN_DAMAGED:
        return 0x887766;
      case GridCellType.TOWER_DAMAGED:
        return COLOR_TOWER_DAMAGED;
      case GridCellType.BUILDING:
        return 0xaa8855;
      case GridCellType.SIGN:
        return 0x99aa88;
      case GridCellType.TOWER:
        return COLOR_TOWER;
      case GridCellType.START:
        return 0x44cc88;
      case GridCellType.WATER:
        return COLOR_WATER;
      default:
        return COLOR_GRASS;
    }
  }

  /** 获取格子透明度 */
  private getCellAlpha(cell: GridCell): number {
    // 草地完全透明，让背景图显示
    if (cell.type === GridCellType.GRASS) {
      return 0;
    }
    if (this.isDamagedType(cell.type) && !cell.repaired) {
      return 0.6;
    }
    return 1;
  }

  /** 判断是否是损坏类型 */
  private isDamagedType(type: GridCellType): boolean {
    return (
      type === GridCellType.ROAD_DAMAGED ||
      type === GridCellType.BUILDING_DAMAGED ||
      type === GridCellType.SIGN_DAMAGED ||
      type === GridCellType.TOWER_DAMAGED
    );
  }

  /** 为特殊格子添加标记图标 */
  private addCellMarker(cell: GridCell, x: number, y: number): void {
    const markerSize = GRID_SIZE * 0.3;

    switch (cell.type) {
      case GridCellType.ROAD_DAMAGED:
        // 损坏道路：感叹号
        this.scene.add
          .text(x, y, "!", {
            fontSize: "20px",
            color: "#ffaa00",
            fontFamily: "Arial",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        break;

      case GridCellType.BUILDING_DAMAGED:
        // 损坏建筑：房子+裂缝标记
        const bldg = this.scene.add.graphics();
        bldg.lineStyle(2, 0xff6644, 0.8);
        bldg.strokeRect(
          x - markerSize * 0.7,
          y - markerSize * 0.5,
          markerSize * 1.4,
          markerSize * 1.2,
        );
        bldg.lineStyle(1, 0xff4444, 0.6);
        bldg.beginPath();
        bldg.moveTo(x - markerSize * 0.3, y - markerSize * 0.5);
        bldg.lineTo(x, y + markerSize * 0.1);
        bldg.lineTo(x + markerSize * 0.3, y - markerSize * 0.5);
        bldg.strokePath();
        break;

      case GridCellType.SIGN_DAMAGED:
        // 损坏标志：问号
        this.scene.add
          .text(x, y, "?", {
            fontSize: "20px",
            color: "#ffaa44",
            fontFamily: "Arial",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        break;

      case GridCellType.TOWER_DAMAGED:
        // 灵塔：三角形标记
        this.scene.add.triangle(
          x,
          y,
          0,
          -markerSize,
          markerSize,
          markerSize * 0.6,
          -markerSize,
          markerSize * 0.6,
          COLOR_TOWER,
          0.7,
        );
        break;

      case GridCellType.TOWER:
        // 完好灵塔：发光三角形
        const towerGlow = this.scene.add.triangle(
          x,
          y,
          0,
          -markerSize * 1.2,
          markerSize * 1.2,
          markerSize * 0.8,
          -markerSize * 1.2,
          markerSize * 0.8,
          COLOR_SPIRIT_LIGHT,
          0.5,
        );
        this.scene.tweens.add({
          targets: towerGlow,
          alpha: 0.2,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;

      case GridCellType.START:
        this.scene.add
          .text(x, y, "S", {
            fontSize: "16px",
            color: "#ffffff",
            fontFamily: "Arial",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        break;
    }
  }

  /**
   * 获取指定位置的格子数据
   */
  getCell(col: number, row: number): GridCell | null {
    if (row < 0 || row >= this.cells.length) return null;
    if (col < 0 || col >= this.cells[row].length) return null;
    return this.cells[row][col];
  }

  /**
   * 检查指定格子是否可通行
   * - 完好的道路/建筑/标志/灵塔/起点 → 可通行
   * - 损坏的格子 → 不可通行（需先完成解谜修复）
   * - 草地/水面 → 不可通行
   */
  isWalkable(col: number, row: number): boolean {
    const cell = this.getCell(col, row);
    if (!cell) return false;

    switch (cell.type) {
      case GridCellType.ROAD:
      case GridCellType.BUILDING:
      case GridCellType.SIGN:
      case GridCellType.TOWER:
      case GridCellType.START:
        return true;
      default:
        return false;
    }
  }

  /**
   * 检查指定格子是否是损坏的关卡载体
   */
  isDamagedCell(col: number, row: number): boolean {
    const cell = this.getCell(col, row);
    if (!cell) return false;
    return this.isDamagedType(cell.type) && !cell.repaired;
  }

  /**
   * 修复指定格子（解谜完成后调用）
   * - 损坏道路 → 完好道路
   * - 损坏建筑 → 完好建筑
   * - 损坏标志 → 完好标志
   * - 损坏灵塔 → 完好灵塔
   */
  repairCell(col: number, row: number): void {
    const cell = this.getCell(col, row);
    if (!cell || cell.repaired) return;

    cell.repaired = true;

    // 类型转换：损坏 → 完好
    switch (cell.type) {
      case GridCellType.ROAD_DAMAGED:
        cell.type = GridCellType.ROAD;
        break;
      case GridCellType.BUILDING_DAMAGED:
        cell.type = GridCellType.BUILDING;
        break;
      case GridCellType.SIGN_DAMAGED:
        cell.type = GridCellType.SIGN;
        break;
      case GridCellType.TOWER_DAMAGED:
        cell.type = GridCellType.TOWER;
        break;
    }

    // 更新视觉
    this.updateCellVisual(col, row);
  }

  /** 更新格子视觉 */
  private updateCellVisual(col: number, row: number): void {
    const rect = this.cellGraphics[row]?.[col];
    if (!rect) return;

    const cell = this.cells[row][col];
    rect.setFillStyle(this.getCellColor(cell), this.getCellAlpha(cell));

    // 修复后添加一个闪光特效
    const x = col * GRID_SIZE + GRID_SIZE / 2;
    const y = row * GRID_SIZE + GRID_SIZE / 2;
    const flash = this.scene.add.circle(
      x,
      y,
      GRID_SIZE * 0.4,
      COLOR_SPIRIT_LIGHT,
      0.6,
    );
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 600,
      onComplete: () => flash.destroy(),
    });
  }

  /** 获取起点网格坐标 */
  getStartGridPos(): { col: number; row: number } {
    for (let row = 0; row < this.cells.length; row++) {
      for (let col = 0; col < this.cells[row].length; col++) {
        if (this.cells[row][col].type === GridCellType.START) {
          return { col, row };
        }
      }
    }
    return { col: 1, row: 1 };
  }

  /** 获取岛屿数据 */
  getIslandData(): IslandData {
    return this.islandData;
  }
}
