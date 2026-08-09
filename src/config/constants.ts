/**
 * 全局常量 —— 游戏中所有"魔法数字"集中管理
 * 【作用】
 * 避免代码中出现硬编码的数字（如格子大小 64 到处写）
 * 修改数值只需改这里，所有地方生效
 * 类似后端的常量类 / 配置中心
 */
/** ====== 画布与视口 ====== */
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

/** ====== 网格系统 ====== */
/** 每个网格单元的像素大小（宽高相同，正方形格子） */
export const GRID_SIZE = 64;
/** 网格列数（一个岛屿地图的列数） */
export const GRID_COLS = 20;
/** 网格行数（一个岛屿地图的行数） */
export const GRID_ROWS = 12;

/** ====== 玩家移动 ====== */
/** 玩家网格移动的过渡时长（毫秒），越小移动越快 */
export const PLAYER_MOVE_DURATION = 200;
/** 玩家移动的缓动函数名 */
export const PLAYER_MOVE_EASE = "Quad.easeInOut";

/** ====== 灵石与灵光 ====== */
/** 进入岛屿时获得的初始灵石数 */
export const INITIAL_SPIRIT_STONES = 3;
/** 完成一个关卡获得的灵石数（默认值，具体由关卡配置决定） */
export const PUZZLE_REWARD_STONES = 2;
/** 完成一个关卡获得的灵光值（默认值，具体由关卡配置决定） */
export const PUZZLE_REWARD_LIGHT = 5;

/** ====== 颜色 ====== */
/** 灵光颜色（金色） */
export const COLOR_SPIRIT_LIGHT = 0xffd700;
/** 灵石颜色（青蓝色） */
export const COLOR_SPIRIT_STONE = 0x00ccff;
/** 雾霾颜色（灰紫色） */
export const COLOR_FOG = 0x8866aa;
/** 道路颜色（浅灰） */
export const COLOR_ROAD = 0xcccccc;
/** 草地颜色（绿色） */
export const COLOR_GRASS = 0x44aa44;
/** 水面颜色（蓝色） */
export const COLOR_WATER = 0x4488cc;
/** 损坏道路颜色（暗灰） */
export const COLOR_ROAD_DAMAGED = 0x666666;
/** 灵塔颜色（白色） */
export const COLOR_TOWER = 0xffffff;
/** 损坏灵塔颜色（暗灰紫） */
export const COLOR_TOWER_DAMAGED = 0x887788;

/** ====== 动画时长 ====== */
/** 场景切换淡入淡出时长（毫秒） */
export const SCENE_TRANSITION_DURATION = 500;
/** UI 面板打开/关闭动画时长 */
export const PANEL_ANIMATION_DURATION = 300;
/** 灵石获得特效时长 */
export const SPIRIT_STONE_FX_DURATION = 800;

/** ====== 存档 ====== */
export const SAVE_KEY = "spirit-light-save";
export const SETTINGS_KEY = "spirit-light-settings";
