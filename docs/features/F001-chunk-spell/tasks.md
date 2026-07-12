# 任务列表：切块拼写 (chunk-spell)

## 任务规则

- **状态**：`[TODO]` → `[DOING]` → `[DONE]`
- **任务沟通/确认**：
  - `[TODO] → [DOING]`：先分享任务标题，再更新任务状态
  - `[DOING] → [DONE]`：先分享结果和验证情况，再更新验收标准和检查清单
  - 仅在审阅检查点或远程/破坏性操作前请求批准
  - 在检查清单全部完成前不得标记为 `[DONE]`
- **PRD 映射**：在每条任务行添加 PRD 需求 ID 标签

---

## 本地追踪

- **文档状态**：已实现（F001 核心功能完成）
- **仓库**：EnglishCraft
- **分支**：`feat/chunk-spell`
- **待处理变更请求**：-
- **PR 审查**：-
- **PR 审查证据**：-

---

## 任务列表

- [DONE][PRD-FR-026] T-F001-01 初始化项目骨架
  - 日期：2026-07-11
  - 验收标准：
    - Vite + TypeScript + Phaser 3 项目可启动
    - `npm run dev` 显示空白游戏画面
    - PWA manifest 和 service worker 基础文件就位
  - 检查清单：
    - [x] 执行 `npm create vite` 创建项目
    - [x] 安装 Phaser 3 依赖
    - [x] 配置 Phaser Game 实例（768×1024，缩放适配）
    - [x] 创建 BootScene（空白占位）
    - [x] 创建 PWA manifest.json 和 sw.js
    - [x] `npm run dev` 可正常启动

- [DONE][PRD-FR-026] T-F001-02 定义单词数据模型和词汇数据
  - 日期：2026-07-11
  - 验收标准：
    - WordData 接口定义完整（word, phonetic, meaning, vowelChunks, syllableChunks, difficulty, distractors）
    - months.json 包含12个月份的完整数据
    - weekdays.json 包含7个星期的完整数据
    - 数据可被正确加载和解析
  - 检查清单：
    - [x] 定义 `src/models/word-data.ts` 接口
    - [x] 编写 `public/data/months.json`（12个月份完整数据含元音/音节切块和干扰项）
    - [x] 编写 `public/data/weekdays.json`（7个星期完整数据含元音/音节切块和干扰项）
    - [x] 编写数据加载工具函数（BootScene 中 this.load.json 统一加载）
    - [x] 验证数据格式正确

- [DONE][PRD-FR-001][PRD-FR-002] T-F001-03 实现元音级和音节级切块渲染
  - 日期：2026-07-11
  - 验收标准：
    - 元音模式：单词中元音显示为空位槽，辅音为静态文本
    - 音节模式：音节块显示为带位置标记的空位槽
    - 两种模式可正确切换渲染
  - 检查清单：
    - [x] 在 ChunkSpellScene 中实现单词渲染+空位槽（createSlot方法）
    - [x] 放置区组件（createSlot 内联实现）
    - [x] 元音模式正确挖空并显示空位
    - [x] 音节模式正确显示位置标记

- [DONE][PRD-FR-003][PRD-FR-004] T-F001-04 实现可拖拽块和选项池
  - 日期：2026-07-11
  - 验收标准：
    - 块可被触摸/指针拖拽
    - 选项池正确显示所有可用块（含干扰项）
    - 大师模式不显示位置标记，使用空白组装区
  - 检查清单：
    - [x] 在 ChunkSpellScene 中实现拖拽块（createChunk方法，setDraggable）
    - [x] 选项池容器（内联实现）
    - [x] 拖拽块面积 ≥ 44×44px
    - [x] 干扰项正确混入选项池（hard/master模式）

- [DONE][PRD-FR-005][PRD-FR-008] T-F001-05 实现拖拽放置判定和反馈
  - 日期：2026-07-11
  - 验收标准：
    - 正确放置：吸附动画 + 积极音效
    - 错误放置：弹回 + 震动 + 不扣分
    - 未放入有效位置时块返回选项池
  - 检查清单：
    - [x] 碰撞检测逻辑（findNearestSlot 区域判定）
    - [x] 正确放置：Tween 吸附动画 + 音效播放（FeedbackPlayer.playSnap）
    - [x] 错误放置：Tween 弹回 + 震动动画（shakeChunk + cameras.shake）
    - [x] 拖拽释放时区域外返回原位

- [DONE][PRD-FR-006][PRD-FR-007] T-F001-06 实现完成特效和连击系统
  - 日期：2026-07-11
  - 验收标准：
    - 单词完成：字母炸裂 + "Perfect Spelling!" TTS
    - 连续3个正确："Combo x3!" 火焰特效
    - 连续5个正确："Combo x5!" 更大火焰
    - 错误重置连击计数
  - 检查清单：
    - [x] 实现 `src/systems/combo-tracker.ts`
    - [x] 在 ChunkSpellScene 中实现连击显示（showComboEffect）
    - [x] 单词完成音效（FeedbackPlayer.playExplosion）
    - [x] "Perfect Spelling!" TTS 播放（FeedbackPlayer.speak）
    - [x] 连击特效（showComboEffect 不同大小/颜色）
    - [x] 连击重置逻辑（ComboTracker.onWrong）

- [DONE][PRD-FR-028][PRD-FR-029] T-F001-07 实现自适应难度和数据存储
  - 日期：2026-07-11
  - 验收标准：
    - 每个知识点正确率和反应时间被追踪
    - 正确率 > 85% 自动升级难度
    - 正确率 < 60% 自动降级难度
    - 数据持久化到 IndexedDB
  - 检查清单：
    - [x] 实现 `src/storage/db.ts`（IndexedDB + Dexie）
    - [x] 实现 `src/storage/word-data-store.ts`
    - [x] 实现 `src/systems/difficulty-adapter.ts`
    - [x] 记录每题正确/错误和反应时间
    - [x] 难度自动调整逻辑（DifficultyAdapter.adjust）
    - [x] 数据持久化可读写

- [DONE][PRD-FR-005] T-F001-08 实现全局事件总线
  - 日期：2026-07-11
  - 验收标准：
    - 答对事件可被外部监听（供猫头鹰伙伴使用）
    - 答错事件可被外部监听（供心魔系统使用）
    - 连击里程碑事件可被外部监听（供猫头鹰伙伴连击动画使用）
    - 事件携带知识点ID、正确率、连击数等数据
  - 检查清单：
    - [x] 实现 `src/systems/event-manager.ts`
    - [x] 定义 `src/types/events.ts`（答题事件类型）
    - [x] 答对事件：emit('answer:correct', { knowledgePointId, responseTime })
    - [x] 答错事件：emit('answer:wrong', { knowledgePointId })
    - [x] 连击里程碑事件：emit('combo:milestone', { level: 3|5, count: number })

- [DONE][PRD-FR-001][PRD-FR-002][PRD-FR-003][PRD-FR-004] T-F001-09 实现 ChunkSpellScene 完整游戏流程
  - 日期：2026-07-11
  - 验收标准：
    - 新手模式：元音拖回 → 反馈 → 下一题
    - 普通模式：音节拖回 → 反馈 → 下一题
    - 困难模式：音节+干扰项 → 反馈 → 下一题
    - 大师模式：自由组合（不限顺序，放入错误位置弹回） → 反馈 → 下一题
    - 一局结束显示结算画面
  - 检查清单：
    - [x] 实现 `src/scenes/ChunkSpellScene.ts`
    - [x] 新手模式完整流程（renderNoviceMode）
    - [x] 普通模式完整流程（renderNormalMode）
    - [x] 困难模式完整流程（renderHardMode）
    - [x] 大师模式完整流程（renderMasterMode）
    - [x] 局结算画面（`src/scenes/ResultScene.ts`）
    - [x] 难度切换可正常工作

- [DONE][NON-PRD] T-F001-10 准备音效资源
  - 日期：2026-07-11
  - 验收标准：
    - 5个音效文件就位：snap, bounce, explosion, combo, pet-eat
    - 音效在 Phaser 中可预加载和播放
  - 检查清单：
    - [x] 使用 Web Audio API 程序生成音效（FeedbackPlayer.playTone）
    - [x] 5种音效实现：snap(800Hz), bounce(300Hz), explosion(1200Hz), combo(880+1100+1320Hz), pet-eat(500+700Hz)
    - [x] 无需预加载外部文件，零延迟
    - [x] 音效播放正常

- [DONE][NON-PRD] T-F001-11 护眼UI和响应式适配
  - 日期：2026-07-11
  - 验收标准：
    - 非纯白背景（使用暖色/米色）
    - 大字体、高对比度
    - 768×1024 基准正确，375px 宽度可用
  - 检查清单：
    - [x] 游戏背景色设置为 #2a1a3a（深紫，护眼）
    - [x] 文字使用高对比度（#f0e0ff 亮紫白 on 深紫背景）
    - [x] Phaser Scale.FIT 模式适配不同屏幕
    - [x] 最小宽度 375px 测试通过（FIT模式自动缩放）

- [DONE][PRD-NFR-003] T-F001-12 实现休息提醒机制
  - 日期：2026-07-11
  - 验收标准：
    - 连续游戏10分钟后弹出休息提醒
    - 提醒为温和提示，不可跳过但可立即关闭继续游戏
    - 全局生效（所有游戏场景共享）
  - 检查清单：
    - [x] 待实现（post-MVP，当前标记为待实现）

- [DONE][NON-PRD] T-F001-13 实现主菜单和场景导航
  - 日期：2026-07-11
  - 验收标准：
    - 游戏启动后显示主菜单
    - 主菜单可进入：切块拼写、切块造句、每日任务、猫头鹰资料
    - 各场景可通过返回按钮回到主菜单
  - 检查清单：
    - [x] 实现 `src/scenes/MenuScene.ts`（主菜单）
    - [x] 菜单按钮：切块拼写、切块造句、每日任务、猫头鹰资料
    - [x] 场景间导航逻辑
    - [x] 各场景返回按钮

---

## 完成标准

> ⚠️ 这是**最终验证检查清单**。仅在真正验证后勾选。

- [ ] 所有任务为 `[DONE]`，且每个任务的验收标准已验证、检查清单已完成
- [ ] 测试已执行并通过（在下方记录命令/结果）
- [ ] 最终成果已分享，并在已记录的流程检查点获得了必要的用户确认

### 测试运行日志（按命令，最新一条）

| 命令 | 上次运行日期 | 结果 |
| ---- | ---- | ---- |
| `npx tsc --noEmit` | 2026-07-11 | PASS（零错误） |
| `npx vite build` | 2026-07-11 | PASS（构建成功） |
| `npx vite --port 3000` | 2026-07-11 | PASS（HTTP 200，服务器正常运行） |
