/**
 * 日志工具 —— 分级日志输出
 * 【作用】
 * 支持 DEBUG / INFO / WARN / ERROR 四个级别
 * 开发环境输出所有日志，生产环境只输出 WARN 和 ERROR
 * 统一格式：[级别][模块名] 消息
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
export class Logger {
  /** 当前日志级别（开发环境 DEBUG，生产环境 WARN） */
  private static level: LogLevel = LogLevel.DEBUG;

  /** 设置日志级别 */
  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  /** DEBUG 级别日志 */
  static debug(module: string, message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG][${module}] ${message}`, ...args);
    }
  }

  /** INFO 级别日志 */
  static info(module: string, message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO][${module}] ${message}`, ...args);
    }
  }

  /** WARN 级别日志 */
  static warn(module: string, message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN][${module}] ${message}`, ...args);
    }
  }

  /** ERROR 级别日志 */
  static error(module: string, message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR][${module}] ${message}`, ...args);
    }
  }
}
