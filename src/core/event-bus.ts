/**
 * 事件总线 —— 模块间解耦通信的核心
 * 【作用】就像一个"广播站"，任何模块都可以：
 * 发射（emit）一个事件，告诉所有人"某件事发生了"
 * 监听（on）一个事件，当它发生时执行自己的逻辑
 * 这样模块之间不需要互相引用，降低耦合
 * 【类比】类似后端的 MessageQueue / 观察者模式
 * 【用法示例】
 * // 发射事件：玩家获得灵石
 * EventBus.emit('spirit-stone-gained', { amount: 5 });
 * // 监听事件：UI更新灵石显示
 * EventBus.on('spirit-stone-gained', (data) => { 更新UI });
 */
export class EventBus {
  /** 事件监听器字典：key是事件名，value是回调函数数组 */
  private static listeners: Map<string, Function[]> = new Map();
  /**
   * 监听一个事件
   * @param eventName 事件名称，如 'spirit-stone-gained'
   * @param callback  事件触发时执行的回调函数
   */
  static on(eventName: string, callback: Function): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  /**
   * 取消监听一个事件
   * @param eventName 事件名称
   * @param callback  要移除的那个回调函数（必须和on时传入的是同一个引用）
   */
  static off(eventName: string, callback: Function): void {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 发射一个事件，通知所有监听者
   * @param eventName 事件名称
   * @param data      附带的数据，任何类型都可以
   */
  static emit(eventName: string, data?: any): void {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) return;
    callbacks.forEach((cb) => cb(data));
  }

  /** 清除所有事件监听（场景切换时调用，防止内存泄漏） */
  static clear(): void {
    this.listeners.clear();
  }

  /**
   * 监听一次事件，触发后自动取消监听
   * @param eventName 事件名称
   * @param callback  回调函数
   */
  static once(eventName: string, callback: Function): void {
    const wrapper = (data: any) => {
      callback(data);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }
}
