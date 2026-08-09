/**
 * 数学工具函数
 * 【作用】提供游戏中常用的数学计算方法
 */
import * as Phaser from "phaser";
export class MathUtils {
  /**
   * 计算两个网格坐标之间的曼哈顿距离
   * （只能上下左右走时的距离）
   */
  static manhattanDistance(
    col1: number,
    row1: number,
    col2: number,
    row2: number,
  ): number {
    return Math.abs(col1 - col2) + Math.abs(row1 - row2);
  }

  /**
   * 计算两个像素坐标之间的欧几里得距离
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Phaser.Math.Distance.Between(x1, y1, x2, y2);
  }

  /**
   * 加权随机选择
   * @param items   选项数组
   * @param weights 每个选项的权重数组
   * @returns 被选中的选项
   *
   * 【用法】加权随机(['A', 'B', 'C'], [1, 2, 7]) → A有10%概率，B有20%，C有70%
   */
  static weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * 将值限制在指定范围内
   * @param value 原始值
   * @param min   最小值
   * @param max   最大值
   */
  static clamp(value: number, min: number, max: number): number {
    return Phaser.Math.Clamp(value, min, max);
  }

  /**
   * 线性插值
   * @param a 起始值
   * @param b 结束值
   * @param t 插值系数 0~1
   */
  static lerp(a: number, b: number, t: number): number {
    return Phaser.Math.Linear(a, b, t);
  }
}
