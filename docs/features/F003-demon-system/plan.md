# 实现计划：心魔系统 (demon-system)

> 在 spec 审批后编写。

---

## 概述

- **功能 ID**：F003
- **目标仓库**：EnglishCraft
- **创建日期**：2026-07-11
- **状态**：已批准
  - 取值：草稿 | 审阅中 | 已批准

---

## 技术栈

| 类别 | 选择 | 原因 |
| ---- | ---- | ---- |
| 数据存储 | IndexedDB (Dexie.js) | Dexie提供更简洁的IndexedDB API，支持索引查询 |
| 算法 | SM-2 简化版 | 固定间隔（1/3/7天），比完整SM-2更适合MVP |
| 定时触发 | 启动时检查 | 无需后台服务，每次打开游戏时计算到期心魔 |
| 视觉 | Phaser 3 | 与其他功能共享引擎，复用精灵动画系统 |

---

## 架构

```
┌──────────────────────────────────────────────────┐
│                   心魔系统                         │
│                                                   │
│  ┌─────────────┐   ┌──────────────┐              │
│  │ DemonStore  │   │ QuestEngine  │              │
│  │ (IndexedDB) │──▶│ (任务生成器)  │              │
│  └──────┬──────┘   └──────┬───────┘              │
│         │                 │                       │
│  ┌──────▼──────┐   ┌──────▼───────┐              │
│  │ SM2Scheduler│   │ QuestScene   │              │
│  │ (间隔调度)  │   │ (任务界面)   │              │
│  └──────┬──────┘   └──────┬───────┘              │
│         │                 │                       │
│         └────────┬────────┘                       │
│                  │                                │
│           ┌──────▼──────┐                         │
│           │ EventManager│ ◀── 答题事件输入         │
│           │ (事件总线)  │     (F001/F002)          │
│           └──────┬──────┘                         │
│                  │                                │
│         ┌────────┴────────┐                       │
│    ┌────▼────┐      ┌─────▼─────┐                 │
│    │创建心魔  │      │击败/净化  │                 │
│    │(答错时)  │      │(答对时)   │                 │
│    └─────────┘      └───────────┘                 │
│                                                   │
│  ┌──────────────────────────────────┐             │
│  │ DifficultyAdapter (自适应难度)    │             │
│  │ - 追踪每个知识点正确率            │             │
│  │ - 调整出题难度等级                │             │
│  └──────────────────────────────────┘             │
└──────────────────────────────────────────────────┘
```

### 核心组件

1. **DemonStore**：IndexedDB 数据层，管理心魔的增删改查
2. **SM2Scheduler**：间隔重复调度，计算下次复习日期
3. **QuestEngine**：任务生成器，根据日期和规则生成每日/每周/每月任务
4. **QuestScene**：Phaser 场景，渲染任务列表和心魔视觉
5. **DifficultyAdapter**：自适应难度，根据正确率调整出题等级

### 数据流

```
F001/F002 答题 → EventManager → 答错？
                                  │
                           ┌──────▼──────┐
                           │ 创建/重置心魔│
                           │ DemonStore  │
                           └──────┬──────┘
                                  │
                           ┌──────▼──────┐
                           │ SM2Scheduler │
                           │ 计算下次日期  │
                           └──────┬──────┘
                                  │
                    游戏启动时 ↓
                           ┌──────▼──────┐
                           │ QuestEngine  │
                           │ 生成到期任务  │
                           └──────┬──────┘
                                  │
                           ┌──────▼──────┐
                           │ QuestScene  │
                           │ 展示心魔列表  │
                           └─────────────┘
```

---

## 文件结构

```
src/
├── scenes/
│   ├── QuestScene.ts                # 任务场景（每日/每周/每月）
│   └── PurificationScene.ts         # 净化动画场景
├── models/
│   ├── demon.ts                     # 心魔数据接口
│   └── quest.ts                     # 任务数据接口
├── systems/
│   ├── sm2-scheduler.ts             # SM-2 间隔调度
│   ├── quest-engine.ts              # 任务生成引擎
│   └── difficulty-adapter.ts        # 自适应难度（扩展F001的版本）
├── storage/
│   └── demon-store.ts               # 心魔数据层（IndexedDB + Dexie）
├── components/
│   ├── DemonCard.ts                 # 心魔卡片（暗黑精灵外观）
│   ├── DemonProgressBar.ts          # 心魔削弱进度条
│   ├── QuestList.ts                 # 任务列表UI
│   └── SpiritGallery.ts            # 守护精灵图鉴（净化后收集）
└── data/
    └── spirit-configs.json          # 精灵视觉配置（颜色、形态）
```

---

## 关键数据结构

### 心魔数据

```json
{
  "id": "demon-september-uuid",
  "knowledgePointId": "september",
  "knowledgePointType": "word",
  "stage": 1,
  "nextReviewDate": "2026-07-14T00:00:00.000Z",
  "createdAt": "2026-07-11T10:30:00.000Z",
  "lastDefeatAt": "2026-07-11T10:35:00.000Z",
  "totalDefeats": 1,
  "totalFailures": 0
}
```

### 任务数据

```json
{
  "id": "daily-2026-07-11-uuid",
  "type": "daily",
  "date": "2026-07-11",
  "items": [
    { "knowledgePointId": "september", "source": "demon", "completed": false },
    { "knowledgePointId": "february", "source": "demon", "completed": false },
    { "knowledgePointId": "tuesday", "source": "new", "completed": false },
    { "knowledgePointId": "wednesday", "source": "new", "completed": false },
    { "knowledgePointId": "what-time-get-up-monday", "source": "new", "completed": false }
  ],
  "completedAt": null
}
```

---

## SM-2 调度算法

```typescript
function calculateNextReview(stage: number, wasCorrect: boolean): { 
  nextStage: number; 
  intervalDays: number 
} {
  if (!wasCorrect) {
    return { nextStage: 0, intervalDays: 1 };
  }
  
  switch (stage) {
    case 0: return { nextStage: 1, intervalDays: 3 };
    case 1: return { nextStage: 2, intervalDays: 7 };
    case 2: return { nextStage: 3, intervalDays: -1 }; // -1 = 净化
    default: return { nextStage: 3, intervalDays: -1 };
  }
}
```

---

## 任务生成逻辑

### 心魔答题路由规则

| 知识点类型 | 路由到场景 |
| ---- | ---- |
| `word`（月份/星期） | ChunkSpellScene (F001) |
| `sentence`（时间句型） | ChunkBuildScene (F002) |

QuestScene 中点击心魔时，根据 `knowledgePointType` 字段切换到对应答题场景。

### 每日任务

```
1. 查询所有 nextReviewDate <= 今天的活跃心魔
2. 按优先级排序：到期最久的排最前
3. 补充3道新知识题（从未见过或正确率最低的知识点）
4. 总题数 = 心魔数 + 3，上限15题（保证5-10分钟）
```

### 每周任务

```
1. 查询过去7天内所有活跃心魔
2. 混合切块拼写和切块造句玩法
3. 上限20题
```

### 每月任务

```
1. 所有知识点随机出题
2. 难度根据当前正确率自适应
3. 上限30题
4. 完成后给予重大奖励
```

---

## 心魔视觉状态

| 阶段 | 外观 | 动画 |
| ---- | ---- | ---- |
| 0（新生） | 完整暗黑外壳，紫/红发光，凶恶眼睛 | 微微浮动 |
| 1（击败1次） | 小裂痕，微光渗出 | 浮动+偶尔抖动 |
| 2（击败2次） | 大裂痕，更多光线，姿态减弱 | 浮动减缓，光线闪烁 |
| 3（净化） | 碎裂→光芒→正常精灵 | 2-3秒变身动画 |

净化动画帧序列：
1. 暗黑外壳出现大裂痕（0.5s）
2. 壳体碎裂飞散（0.5s）
3. 白光爆发（0.5s）
4. 正常精灵出现+柔和光晕（0.5s）
5. 庆祝粒子效果（0.5s）

---

## 测试策略

- **单元测试**：使用 Vitest
  - SM2Scheduler：各阶段间隔计算、边界情况
  - QuestEngine：任务生成逻辑、上限控制
  - DifficultyAdapter：正确率阈值判定

- **集成测试**：
  - 答错→创建心魔→次日出现→答对→间隔变化→净化完整流程
  - 再次答错→间隔重置

- **端到端测试**：
  - 手动模拟多天跨越（调整系统时间），验证间隔正确性

---

## 相关文档

- 规格：[spec.md](./spec.md)
- 决策：[decisions.md](./decisions.md)
- IndexedDB Schema：[`../../indexeddb-schema.md`](../../indexeddb-schema.md)

### 与 F001 共享的基础设施

- `EventManager`：共享，由 F001 实现，本 Feature 订阅答对/答错事件以创建/更新心魔
- `DifficultyAdapter`：共享，由 F001 实现，本 Feature 复用以调整出题难度
- `WordDataStore`：本 Feature 新增 demonStore, questStore, owlStore，数据库结构见 schema 文档
