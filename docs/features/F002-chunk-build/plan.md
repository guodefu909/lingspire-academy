# 实现计划：切块造句 (chunk-build)

> 在 spec 审批后编写。

---

## 概述

- **功能 ID**：F002
- **目标仓库**：EnglishCraft
- **创建日期**：2026-07-11
- **状态**：已批准
  - 取值：草稿 | 审阅中 | 已批准

---

## 技术栈

| 类别 | 选择 | 原因 |
| ---- | ---- | ---- |
| 游戏引擎 | Phaser 3 | 与F001一致，共享引擎和基础设施 |
| 构建工具 | Vite | 同上 |
| 语言 | TypeScript | 同上 |
| 数据格式 | JSON | 句子数据静态存储 |
| 音频 | Phaser内置Audio + Web Speech API | 音效用Phaser，句子朗读用TTS |

---

## 架构

```
┌──────────────────────────────────────────┐
│              Phaser Game                 │
│  ┌────────────┐  ┌───────────────────┐   │
│  │ ChunkBuild │  │   共享层           │   │
│  │  Scene     │──│                   │   │
│  │            │  │ ┌───────────────┐ │   │
│  │ - 渲染句子 │  │ │SentenceStore  │ │   │
│  │ - 块排列   │  │ │ (IndexedDB)   │ │   │
│  │ - 拖拽逻辑 │  │ └───────┬───────┘ │   │
│  │ - 反馈特效 │  │         │         │   │
│  └─────┬──────┘  │ ┌───────▼───────┐ │   │
│        │         │ │ EventManager  │ │   │
│        │         │ │ (与F001共享)   │ │   │
│        │         │ └───────┬───────┘ │   │
│        │         └─────────┼─────────┘   │
│        │                   │             │
│  ┌─────▼───────┐  ┌───────▼───────┐     │
│  │ Difficulty   │  │ 外部集成接口   │     │
│  │ Adapter     │  │ - onCorrect() │     │
│  │ (与F001共享) │  │ - onWrong()   │     │
│  └─────────────┘  └───────────────┘     │
└──────────────────────────────────────────┘
```

### 核心组件

1. **ChunkBuildScene**：Phaser 场景，负责渲染句子、块空位、选项池，处理拖拽/点击交互
2. **SentenceStore**：基于 IndexedDB 的句子数据层（与 F001 的 WordDataStore 共享 IndexedDB 实例）
3. **DifficultyAdapter**：与 F001 共享，按知识点追踪正确率
4. **EventManager**：与 F001 共享的全局事件总线

### 数据流

```
SentenceStore → 题目生成 → ChunkBuildScene → 玩家交互
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
├── scenes/
│   └── ChunkBuildScene.ts           # 切块造句主场景
├── components/
│   ├── SentenceDisplay.ts           # 句子渲染（文字+空位槽+中文提示）
│   ├── ChunkSlot.ts                 # 句子中的块空位（带位置指示器）
│   ├── SentenceChunkPool.ts         # 选项池（可拖拽块容器+干扰项）
│   ├── DraggableSentenceChunk.ts    # 可拖拽句子块
│   └── ChineseHint.ts              # 中文提示显示（块中文/句中文）
├── models/
│   └── sentence-data.ts             # 句子数据接口定义
├── data/
│   └── time-sentences.json          # 时间相关句型数据
└── utils/
    └── sentence-chunk-helper.ts     # 句子切块辅助（验证、干扰项生成）
```

### 与 F001 共享的文件

```
src/
├── main.ts                          # 共享入口
├── config/game.config.ts            # 共享配置（增加ChunkBuild场景注册）
├── systems/
│   ├── difficulty-adapter.ts        # 共享
│   ├── event-manager.ts             # 共享
│   └── feedback-player.ts           # 扩展（增加句子完成特效）
├── storage/
│   └── word-data-store.ts           # 扩展（增加句子数据存取）
└── types/events.ts                  # 扩展（增加句子答题事件类型）
```

---

## 关键数据结构

### 句子数据 (time-sentences.json)

```json
[
  {
    "id": "what-time-get-up-monday",
    "sentence": "What time do you get up on Monday?",
    "translation": "你周一几点起床？",
    "chunks": ["What time", "do you", "get up", "on Monday"],
    "chunkTranslations": ["几点", "你", "起床", "在周一"],
    "difficulty": 0.5,
    "distractors": ["do they", "go to bed", "on Friday", "at Monday"]
  }
]
```

---

## 难度模式实现

| 难度 | 句子显示 | 提示 | 交互 | 选项 |
| ---- | ---- | ---- | ---- | ---- |
| 新手 | 完整句子，1块为空位 | 空位块中文释义 | 点击选择 | 4选1 |
| 普通 | 完整句子，1块为空位 | 整句中文翻译 | 点击选择 | 4选1 |
| 困难 | 完整句子，多块为空位 | 整句中文翻译 | 拖拽回位 | 正确块+干扰项 |
| 大师 | 无句子，空白组装区 | 整句中文翻译 | 拖拽组合 | 正确块+干扰项 |

新手/普通模式使用**点击选择**（4选1），因为只缺1块，拖拽反而多此一举。
困难/大师模式使用**拖拽**，因为需要放置多个块到特定位置。

---

## 特效设计

1. **块吸合**：拖拽块靠近空位时，空位边框高亮；放入时播放咔嗒声
2. **连接光效**：相邻两个块都正确放置后，它们之间亮起连接光线
3. **句子完成**：整句所有块正确 → 句子文字整体化为飞鸟动画飞走 → 自动播放 TTS 读音
4. **错误反馈**：块弹回原位 + 轻微震动 + 无扣分

---

## 测试策略

- **单元测试**：使用 Vitest
  - sentence-chunk-helper：切块验证、干扰项生成
  - 难度模式切换逻辑

- **集成测试**：
  - 4 个难度级别的完整答题流程
  - 中文提示在不同难度下的正确显示

- **端到端测试**：
  - 手动测试：4 个难度的完整体验
  - TTS 语音播放正确性

---

## 相关文档

- 规格：[spec.md](./spec.md)
- 决策：[decisions.md](./decisions.md)
- IndexedDB Schema：[`../../indexeddb-schema.md`](../../indexeddb-schema.md)

### 与 F001 共享的基础设施

- `DifficultyAdapter`：共享，由 F001 实现，本 Feature 扩展支持句子知识点
- `EventManager`：共享，由 F001 实现，本 Feature 订阅答对/答错事件
- `WordDataStore`：共享，由 F001 实现，本 Feature 扩展支持句子数据读写
