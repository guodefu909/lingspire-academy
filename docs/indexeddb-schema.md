# IndexedDB 数据库架构

EnglishCraft 使用单一 IndexedDB 数据库，按版本管理 schema，支持多 Feature 共享数据。

---

## 数据库名称

```
EnglishCraftDB
```

---

## 版本控制

| 版本 | 变更说明 |
| ---- | ---- |
| 1 | 初始版本，包含 wordDataStore |

---

## Schema

### Stores

#### 1. wordDataStore

存储单词数据和句子数据的答题记录。

**Key Path**: `knowledgePointId`

**Indexes**:
- `knowledgePointType` - 知识点类型：'word' | 'sentence'
- `lastSeenAt` - 上次出现时间
- `correctRate` - 正确率

**Data Model**:

```typescript
interface WordDataRecord {
  knowledgePointId: string;        // 唯一标识，如 "september", "what-time-get-up-monday"
  knowledgePointType: 'word' | 'sentence';
  correctCount: number;            // 正确次数
  totalCount: number;              // 总答题次数
  correctRate: number;             // 正确率 0-1
  lastSeenAt: string;              // ISO 日期时间
  reviewCount: number;             // 复习次数
  avgResponseTimeMs: number;       // 平均反应时间（毫秒）
  createdAt: string;
  updatedAt: string;
}
```

#### 2. demonStore

存储心魔数据。

**Key Path**: `id`

**Indexes**:
- `knowledgePointId` - 关联知识点ID
- `nextReviewDate` - 下次复习日期

**Data Model**:

```typescript
interface DemonRecord {
  id: string;                      // UUID
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence';
  stage: number;                   // 0-3，3为净化
  nextReviewDate: string;          // ISO 日期时间
  createdAt: string;
  lastDefeatAt: string | null;     // 最后击败时间
  totalDefeats: number;
  totalFailures: number;
  purifiedAt: string | null;       // 净化时间
}
```

#### 3. owlStore

存储猫头鹰状态。

**Key Path**: `'owl'` (单例)

**Data Model**:

```typescript
interface OwlRecord {
  id: string;                      // 固定为 'owl'
  stars: number;
  evolutionStage: number;          // 0-4
  abilities: string[];             // 已解锁能力列表
  monthCorrectCount: number;
  dayCorrectCount: number;         // 预留
  sentenceCorrectCount: number;    // 预留
  createdAt: string;
  lastEvolutionAt: string | null;
  updatedAt: string;
}
```

#### 4. questStore

存储任务数据。

**Key Path**: `id`

**Indexes**:
- `type` - 任务类型：'daily' | 'weekly' | 'monthly'
- `date` - 任务日期

**Data Model**:

```typescript
interface QuestRecord {
  id: string;                      // UUID
  type: 'daily' | 'weekly' | 'monthly';
  date: string;                    // ISO 日期
  items: QuestItem[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface QuestItem {
  knowledgePointId: string;
  source: 'demon' | 'new';
  completed: boolean;
}
```

---

## 跨 Feature 数据访问约定

| Store | 主要负责 Feature | 其他 Feature 可读写 |
| ----- | ----- | ----- |
| wordDataStore | F001 (读) | F001 (写), F002 (读+写), F003 (读) |
| demonStore | F003 | 仅 F003 |
| owlStore | F004 | 仅 F004 |
| questStore | F003 | 仅 F003 |

---

## 版本迁移策略

- F001 初始化数据库（版本 1）
- F003 扩展数据库（版本 2，增加 demonStore, questStore）
- F004 扩展数据库（版本 3，增加 owlStore）

迁移使用 Dexie 的 `version(x).stores(...)` API，自动处理新增 store。