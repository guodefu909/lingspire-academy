/**
 * 实体相关类型定义
 */
/** 实体基础接口 */
export interface IEntity {
  id: string;
  gridCol: number;
  gridRow: number;
  alive: boolean;
}

/** 角色属性接口 */
export interface IStats {
  /** 生命值 */
  hp: number;
  /** 最大生命值 */
  maxHp: number;
  /** 速度（影响移动快慢） */
  speed: number;
}

/** 武器接口 */
export interface IWeapon {
  id: string;
  name: string;
  damage: number;
  range: number;
}
