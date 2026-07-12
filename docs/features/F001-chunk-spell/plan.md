# 实现计划：切块拼写 (chunk-spell)

> 在 spec 审批后编写。

---

## 概述

- **功能 ID**：F001
- **目标仓库**：EnglishCraft
- **创建日期**：2026-07-11
- **状态**：已批准
  - 取值：草稿 | 审阅中 | 已批准

---

## 技术栈

| 类别 | 选择 | 原因 |
| ---- | ---- | ---- |
| 游戏引擎 | Phaser 3 | 2D、轻量、生态成熟、Web原生、内置拖拽支持 |
| 构建工具 | Vite | 快速冷启动、HMR、Phaser插件生态好 |
| 语言 | TypeScript | 类型安全、接口定义数据模型 |
| 数据格式 | JSON | 知识点数据静态存储、离线友好 |
| 数据存储 | IndexedDB (Dexie.js) | Dexie 提供简洁的 IndexedDB API，支持索引查询 |
| 音频 | Phaser内置Audio + Web Speech API | 音效用Phaser，语音用浏览器原生TTS |

---

## 架构

```
┌─────────────────────────────────────────┐
│              Phaser Game                │
│  ┌───────────┐  ┌───────────────────┐   │
│  │ ChunkSpell│  │   共享层           │   │
│  │  Scene    │──│                   │   │
│  │           │  │ ┌───────────────┐ │   │
│  │ - 渲染块  │  │ │ WordDataStore │ │   │
│  │ - 拖拽逻辑│  │ │ (IndexedDB)   │ │   │
│  │ - 反馈特效│  │ └───────┬───────┘ │   │
│  │ - 连击系统│  │         │         │   │
│  └─────┬─────┘  │ ┌───────▼───────┐ │   │
│        │        │ │ EventManager  │ │   │
│        │        │ │ (事件总线)     │ │   │
│        │        │ └───────┬───────┘ │   │
│        │        └─────────┼─────────┘   │
│        │                  │             │
│  ┌─────▼──────┐  ┌───────▼───────┐     │
│  │ Difficulty  │  │ 外部集成接口   │     │
│  │ Adapter    │  │ - onCorrect() │     │
│  │ (难度适配) │  │ - onWrong()   │     │
│  └────────────┘  └───────────────┘     │
└─────────────────────────────────────────┘
```

### 核心组件

1. **ChunkSpellScene**：Phaser 场景，负责渲染单词、块、选项池，处理拖拽交互
2. **WordDataStore**：基于 IndexedDB 的数据层，管理单词数据和答题记录
3. **DifficultyAdapter**：根据正确率自动调整出题难度
4. **ComboTracker**：追踪连续正确数，触发连击特效
5. **EventManager**：全局事件总线，向心魔系统和猫头鹰伙伴发送答题事件
6. **FeedbackPlayer**：统一管理音效、动画、TTS 播放

### 数据流

```
WordDataStore → 题目生成 → ChunkSpellScene → 玩家交互
                                                  │
                                          ┌───────┴───────┐
                                          │               │
                                      答对事件         答错事件
                                          │               │
                                    EventManager      EventManager
                                          │               │
                                    猫头鹰伙伴         心魔系统
                                    (F004)           (F003)
```

---

## 文件结构

```
src/
├── main.ts                          # 入口，Phaser游戏配置，PWA注册
├── config/
│   └── game.config.ts               # Phaser游戏配置（尺寸、物理、场景）
├── data/
│   ├── months.json                  # 12个月份单词数据
│   └── weekdays.json                # 7个星期单词数据
├── scenes/
│   ├── BootScene.ts                 # 资源预加载
│   ├── ChunkSpellScene.ts           # 切块拼写主场景
│   └── ResultScene.ts               # 本局结算场景
├── components/
│   ├── WordDisplay.ts               # 单词渲染（静态文字+空位槽）
│   ├── ChunkPool.ts                 # 选项池（可拖拽块容器）
│   ├── DraggableChunk.ts            # 可拖拽块（触摸+指针）
│   ├── DropSlot.ts                  # 放置区（吸附判定+反馈）
│   └── ComboDisplay.ts              # 连击计数+火焰特效
├── models/
│   ├── word-data.ts                 # 单词数据接口定义
│   └── game-session.ts              # 游戏局数据接口
├── systems/
│   ├── difficulty-adapter.ts        # 自适应难度
│   ├── combo-tracker.ts             # 连击追踪
│   ├── event-manager.ts             # 全局事件总线
│   └── feedback-player.ts           # 音效/动画/TTS反馈
├── storage/
│   └── word-data-store.ts           # IndexedDB数据层
├── utils/
│   └── chunk-splitter.ts            # 切块工具（验证块数据、生成干扰项）
└── types/
    └── events.ts                    # 事件类型定义（answer:correct, answer:wrong, combo:milestone）

public/
├── index.html
├── manifest.json                    # PWA清单
├── sw.js                            # Service Worker
├── assets/
│   ├── audio/                       # 音效文件
│   │   ├── snap.mp3                 # 吸附音
│   │   ├── bounce.mp3               # 弹回音
│   │   ├── explosion.mp3            # 炸裂音
│   │   ├── combo.mp3                # 连击音
│   │   └── pet-eat.mp3              # 宠物吃星星音
│   └── sprites/                     # 精灵图
│       ├── slots/                   # 空位槽外观
│       └── effects/                 # 特效帧（炸裂、火焰）
```

---

## 关键数据结构

### 单词数据 (months.json / weekdays.json)

```json
[
  {
    "id": "september",
    "word": "September",
    "phonetic": "/sɛpˈtɛmbər/",
    "meaning": "九月",
    "vowelChunks": [
      { "index": 1, "value": "e" },
      { "index": 3, "value": "e" },
      { "index": 5, "value": "e" }
    ],
    "syllableChunks": ["Sep", "tem", "ber"],
    "difficulty": 0.7,
    "distractors": ["tim", "bor", "sep", "bir"]
  }
]
```

### 游戏局数据

```json
{
  "sessionId": "uuid",
  "difficulty": "normal",
  "questions": ["september", "february", ...],
  "results": [
    { "wordId": "september", "correct": true, "responseTimeMs": 3200 }
  ]
}
```

---

## 难度值到难度等级映射

数据中每个知识点的 `difficulty` 值（0-1）映射到四个难度等级：

| difficulty 值范围 | 难度等级 | 说明 |
| ---- | ---- | ---- |
| 0.00 - 0.25 | 新手 | 元音拖回 / 单块选择 |
| 0.25 - 0.50 | 普通 | 音节拖回 / 单块选择 |
| 0.50 - 0.75 | 困难 | 音节+干扰项 / 多块拖回 |
| 0.75 - 1.00 | 大师 | 自由组合 / 全句组装 |

DifficultyAdapter 在调整难度时，根据正确率上下移动 difficulty 值，跨过阈值时切换难度等级。

---

## 拖拽交互实现方案

使用 Phaser 3 的内置交互系统：

1. **DraggableChunk**：继承 Phaser.GameObjects.Container，包含文本 + 背景
   - `setInteractive({ draggable: true })` 启用拖拽
   - `on('drag', ...)` 更新位置跟随指针
   - `on('dragend', ...)` 检测是否在 DropSlot 上方

2. **DropSlot**：放置区
   - 使用 `Phaser.Geom.Rectangle.contains()` 做碰撞检测
   - 正确放置：吸附动画（tween 到精确位置）+ 音效
   - 错误放置：弹回动画（tween 回选项池原位）+ 震动

3. **触摸兼容**：
   - `input.touch.enabled = true`（Phaser 默认支持）
   - 拖拽区域不小于 44×44px

---

## 测试策略

- **单元测试**：使用 Vitest
  - chunk-splitter 工具函数：切块验证、干扰项生成
  - difficulty-adapter：难度升降逻辑
  - combo-tracker：连击计算
  - WordDataStore：IndexedDB 读写

- **集成测试**：
  - 完整答题流程：出题→拖拽→判定→反馈→下一题
  - 难度切换流程

- **端到端测试**：
  - 手动测试：4 个难度级别的完整游戏体验
  - 触摸设备测试：平板上拖拽流畅度

---

## 相关文档

- 规格：[spec.md](./spec.md)
- 决策：[decisions.md](./decisions.md)
- IndexedDB Schema：[`../../indexeddb-schema.md`](../../indexeddb-schema.md)

### 共享基础设施（本 Feature 首次实现）

- `DifficultyAdapter`：难度自适应，供 F002/F003 复用
- `EventManager`：全局事件总线，供 F002/F003/F004 订阅
- `WordDataStore`：IndexedDB 数据层，供 F002/F003 复用
