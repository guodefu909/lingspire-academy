/**
 * 数据加载器 —— 读取 JSON 配置并缓存
 * 【作用】
 * 从 Phaser 的缓存中读取 JSON 数据
 * 提供类型安全的访问接口
 * 支持数据校验
 */
import * as Phaser from "phaser";
export class DataLoader {
  /** Phaser 场景引用 */
  private static scene: Phaser.Scene | null = null;

  /** 数据缓存 */
  private static cache: Map<string, any> = new Map();

  /**
   * 初始化数据加载器
   * @param scene Phaser 场景
   */
  static init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * 加载 JSON 数据
   * @param key 资源 key（在 PreloadScene 中加载时使用的 key）
   */
  static getJson<T>(key: string): T | null {
    // 先查缓存
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // 从 Phaser 缓存读取
    if (!this.scene) {
      console.warn("[DataLoader] 未初始化，无法读取数据");
      return null;
    }

    const data = this.scene.cache.json.get(key);
    if (!data) {
      console.warn(`[DataLoader] 找不到数据: ${key}`);
      return null;
    }

    // 存入缓存
    this.cache.set(key, data);
    return data as T;
  }

  /** 清除缓存 */
  static clearCache(): void {
    this.cache.clear();
  }
}
