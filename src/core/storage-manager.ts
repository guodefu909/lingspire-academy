/**
 * 存储管理器 —— localStorage 的封装，提供类型安全的存取
 * 【作用】
 * 封装 localStorage 的读写操作
 * 自动处理 JSON 序列化/反序列化
 * 提供默认值机制，避免读取到 null 导致崩溃
 * 【类比】类似后端的 Redis 缓存层
 */
export class StorageManager {
  /**
   * 存储数据
   * @param key 存储键
   * @param value 存储值（会自动转 JSON）
   */
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageManager] 写入失败 key=${key}:`, e);
    }
  }

  /**
   * 读取数据
   * @param key 存储键
   * @param defaultValue 读取失败时的默认值
   * @returns 解析后的数据，或默认值
   */
  static get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`[StorageManager] 读取失败 key=${key}:`, e);
      return defaultValue;
    }
  }

  /** 删除指定键 */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** 清除所有存储 */
  static clear(): void {
    localStorage.clear();
  }

  /** 检查键是否存在 */
  static has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
