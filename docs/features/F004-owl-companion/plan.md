# 实现计划：猫头鹰伙伴 (owl-companion)

> 在 spec 审批后编写。

---

## 概述

- **功能 ID**：F004
- **目标仓库**：EnglishCraft
- **创建日期**：2026-07-11
- **状态**：已批准
  - 取值：草稿 | 审阅中 | 已批准

---

## 技术栈

| 类别 | 选择 | 原因 |
| ---- | ---- | ---- |
| 渲染 | Phaser 3 Sprite + Tween | 精灵动画+补间动画，轻量高效 |
| 数据存储 | IndexedDB (Dexie.js) | 与F003共享，持久化猫头鹰状态 |
| 语音 | Web Speech API | 浏览器原生TTS，唱月份之歌 |

---

## 架构

```
┌──────────────────────────────────────────────┐
│              猫头鹰伙伴系统                    │
│                                               │
│  ┌──────────────┐    ┌────────────────┐       │
│  │ OwlStore     │    │ OwlSprite      │       │
│  │ (IndexedDB)  │───▶│ (Phaser精灵)   │       │
│  └──────┬───────┘    └───────┬────────┘       │
│         │                    │                │
│  ┌──────▼───────┐    ┌──────▼────────┐       │
│  │ Evolution     │    │ AnimationCtrl │       │
│  │ Engine       │    │ (动画控制器)   │       │
│  └──────┬───────┘    └───────┬────────┘       │
│         │                    │                │
│         └────────┬───────────┘                │
│                  │                            │
│           ┌──────▼──────┐                     │
│           │ EventManager│ ◀── 答题事件         │
│           │ (事件总线)  │     (F001/F002)      │
│           └──────┬──────┘                     │
│                  │                            │
│         ┌────────┴────────┐                   │
│    ┌────▼────┐      ┌─────▼─────┐             │
│    │ 吃星星   │      │ 进化/能力  │             │
│    │ (答对)   │      │ 解锁      │             │
│    └─────────┘      └───────────┘             │
│                                               │
│  ┌────────────────────────────────────┐       │
│  │ 月份之歌 (MonthSongAbility)         │       │
│  │ - Web Speech API TTS               │       │
│  │ - 顺序朗读12个月份                  │       │
│  └────────────────────────────────────┘       │
└──────────────────────────────────────────────┘
```

### 核心组件

1. **OwlStore**：IndexedDB 数据层，持久化猫头鹰状态（星星数、进化阶段、能力）
2. **OwlSprite**：Phaser 精灵，渲染猫头鹰外观，根据进化阶段切换纹理
3. **EvolutionEngine**：进化引擎，检测星星数是否达到阈值，触发进化动画
4. **AnimationController**：动画控制器，根据事件类型播放对应动画（跳跃、歪头、拍翅膀等）
5. **MonthSongAbility**：月份之歌能力，使用 Web Speech API 朗读月份名

---

## 文件结构

```
src/
├── scenes/
│   └── OwlProfileScene.ts           # 猫头鹰资料场景（点击查看详情/唱歌）
├── components/
│   ├── OwlSprite.ts                 # 猫头鹰精灵（游戏中栖息在角落）
│   ├── EvolutionEffect.ts           # 进化特效（发光、变身、羽毛飞散）
│   ├── StarCounter.ts               # 星星计数显示
│   └── AbilityBadge.ts              # 能力徽章显示
├── models/
│   └── owl-state.ts                 # 猫头鹰状态接口
├── systems/
│   ├── evolution-engine.ts          # 进化引擎（阈值检测+触发）
│   └── month-song-ability.ts        # 月份之歌能力（TTS）
├── storage/
│   └── owl-store.ts                 # 猫头鹰数据层（IndexedDB + Dexie）
└── data/
    └── owl-evolution.json           # 进化配置（阈值、纹理名、描述）
```

---

## 关键数据结构

### 猫头鹰状态

```json
{
  "stars": 35,
  "evolutionStage": 2,
  "abilities": ["month-song"],
  "monthCorrectCount": 12,
  "dayCorrectCount": 0,
  "sentenceCorrectCount": 0,
  "createdAt": "2026-07-11T08:00:00.000Z",
  "lastEvolutionAt": "2026-07-11T09:00:00.000Z"
}
```

### 进化配置 (owl-evolution.json)

```json
[
  {
    "stage": 0,
    "name": "蛋",
    "starsRequired": 0,
    "textureKey": "owl-egg",
    "description": "一颗微微发光的蛋，里面似乎有什么在动..."
  },
  {
    "stage": 1,
    "name": "雏鸟",
    "starsRequired": 10,
    "textureKey": "owl-chick",
    "description": "毛绒绒的小家伙，用好奇的大眼睛看着你！"
  },
  {
    "stage": 2,
    "name": "幼年猫头鹰",
    "starsRequired": 30,
    "textureKey": "owl-young",
    "description": "开始学会拍翅膀了，偶尔能短距离飞行。"
  },
  {
    "stage": 3,
    "name": "成年猫头鹰",
    "starsRequired": 60,
    "textureKey": "owl-adult",
    "description": "威风凛凛的成年猫头鹰，智慧的眼神充满力量。"
  },
  {
    "stage": 4,
    "name": "圣鸟",
    "starsRequired": 100,
    "textureKey": "owl-sacred",
    "description": "传说中掌握所有知识之力的圣鸟，周身环绕金色光晕。"
  }
]
```

---

## 猫头鹰精灵资源方案

MVP 阶段使用**简单几何图形+程序生成**，不依赖外部美术资源：

| 阶段 | 实现方式 |
| ---- | ---- |
| 蛋 | 椭圆形+微光（圆形渐变） |
| 雏鸟 | 圆形身体+小翅膀+大眼睛 |
| 幼年 | 稍大身体+短翅膀+尖耳朵 |
| 成年 | 完整猫头鹰轮廓+展翅 |
| 圣鸟 | 成年+金色光晕（圆形粒子） |

使用 Phaser 的 `Graphics` 对象程序绘制，后续可替换为真实精灵图。

---

## 动画系统

### 游戏中栖息动画（循环）

```
正常：微微上下浮动（y ±2px，1.5s循环）
呼吸：身体轻微缩放（scale 0.98-1.02，2s循环）
```

### 事件触发动画（Tween）

| 事件 | 动画 | 时长 |
| ---- | ---- | ---- |
| 答对 | y-10→y+0（跳跃）+ scale 1→1.05→1 | 400ms |
| 答错 | rotation 0→-0.1→0.1→0（歪头） | 600ms |
| 连击x3 | y-15→y+0（大跳）+ scaleX 1→1.1→1 | 500ms |
| 连击x5 | 360度旋转 + y-20→y+0 | 700ms |
| 进化 | 飞到中央→发光→变身→飞回 | 3000ms |
| 唱歌 | y ±5（上下摆动）循环 | 持续到唱完 |

---

## 月份之歌实现

逐个朗读每个月份，月份之间加 500ms 停顿，避免长文本被截断。首次播放需用户交互触发（浏览器 autoplay policy）。

```typescript
async function playMonthSong(): Promise<void> {
  // 浏览器兼容性检测
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API 不支持，跳过月份之歌');
    return;
  }

  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  startSingingAnimation();

  for (const month of months) {
    const utterance = new SpeechSynthesisUtterance(month);
    utterance.lang = "en-US";
    utterance.rate = 0.8;

    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
      speechSynthesis.speak(utterance);
    });

    await delay(500); // 月份间停顿
  }

  stopSingingAnimation();
}
```

---

## 测试策略

- **单元测试**：使用 Vitest
  - EvolutionEngine：星星阈值判定、进化触发
  - MonthSongAbility：TTS 调用逻辑（mock SpeechSynthesis）

- **集成测试**：
  - 答对→吃星星→星星计数增长→进化检测
  - 进化动画完整流程
  - 月份之歌解锁和播放

- **端到端测试**：
  - 手动测试：猫头鹰在游戏中的反应是否自然
  - 触摸点击猫头鹰触发唱歌

---

## 相关文档

- 规格：[spec.md](./spec.md)
- 决策：[decisions.md](./decisions.md)
- IndexedDB Schema：[`../../indexeddb-schema.md`](../../indexeddb-schema.md)

### 与 F001 共享的基础设施

- `EventManager`：共享，由 F001 实现，本 Feature 订阅答对事件以增加星星和触发进化检测
