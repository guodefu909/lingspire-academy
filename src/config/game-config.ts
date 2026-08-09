/**
 * Phaser 游戏配置 —— 告诉 Phaser 引擎怎么初始化
 * 【作用】相当于 Phaser 的"启动参数"，定义：
 * 画布尺寸、缩放策略
 * 使用哪种物理引擎
 * 注册哪些场景
 * 像素渲染风格
 * 【类比】类似后端 application.yml 中的服务配置
 */
import * as Phaser from "phaser";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
// 以下是所有场景的导入，暂时用占位，后续逐个实现
import { BootScene } from "@scenes/boot.scene";
import { PreloadScene } from "@scenes/preload.scene";
import { MainMenuScene } from "@scenes/main-menu.scene";
import { GameScene } from "@scenes/game.scene";
import { PauseScene } from "@scenes/pause.scene";
import { GameOverScene } from "@scenes/game-over.scene";
import { SettingsScene } from "@scenes/settings.scene";

/**
 * Phaser.GameConfig 配置对象
 *
 * 文档参考：https://photonstorm.github.io/phaser3-docs/Phaser.Types.Core.html#.GameConfig
 */
export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  /** 游戏标题 */
  title: "灵光 - Spirit Light",

  /** 游戏版本号，用于缓存管理 */
  version: "0.1.0",

  /** Phaser 引擎类型：自动选择 Canvas 或 WebGL */
  type: Phaser.AUTO,

  /** 画布挂载到哪个 DOM 元素 */
  parent: "game-container",

  /** 画布尺寸 */
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,

  /** 缩放策略：FIT = 保持比例缩放填满容器 */
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  /** 物理引擎配置 */
  physics: {
    default: "arcade",
    arcade: {
      /** 是否显示调试信息（开发时打开，上线前关闭） */
      debug: false,
      /** 重力设置（俯视角游戏不需要重力） */
      gravity: { x: 0, y: 0 },
    },
  },

  /** 注册所有场景 —— Phaser 会按此顺序创建场景实例 */
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    GameScene,
    PauseScene,
    GameOverScene,
    SettingsScene,
  ],

  /** 像素艺术风格渲染 —— 让像素图放大后不模糊 */
  render: {
    pixelArt: false,
    antialias: true,
  },

  /** 背景色（黑色，加载时显示） */
  backgroundColor: "#000000",

  /** 禁用右键菜单（避免游戏中右键弹出浏览器菜单） */
  disableContextMenu: true,
};
