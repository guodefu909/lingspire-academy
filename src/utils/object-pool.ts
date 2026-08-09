/**
 * 对象池 —— 复用游戏对象，避免频繁创建销毁导致卡顿
 *
 * 【作用】
 *
 * 预先创建一批对象放在池中
 * 需要时从池中取出，用完归还
 * 避免频繁 new / destroy 导致的垃圾回收卡顿
 * 【使用场景】子弹、粒子特效、飘字等高频创建销毁的对象
 *
 * 【类比】类似后端的数据库连接池
 */
export class ObjectPool<T> {
  /** 池中可用的对象 */
  private available: T[] = [];
  /** 正在使用的对象 */
  private inUse: Set<T> = new Set();
  /** 对象工厂函数 */
  private factory: () => T;
  /** 对象重置函数 */
  private reset: (obj: T) => void;

  /**
   * @param factory 创建新对象的工厂函数
   * @param reset 归还对象时的重置函数
   * @param initialSize 初始池大小
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
  ) {
    this.factory = factory;
    this.reset = reset;

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /**
   * 从池中获取一个对象
   *
   * 如果池中没有可用对象，会创建新的
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * 将对象归还到池中
   * @param obj 要归还的对象
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) return;

    this.inUse.delete(obj);
    this.reset(obj);
    this.available.push(obj);
  }

  /** 获取当前可用对象数 */
  getAvailableCount(): number {
    return this.available.length;
  }

  /** 获取正在使用的对象数 */
  getInUseCount(): number {
    return this.inUse.size;
  }

  /** 清空对象池 */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}
