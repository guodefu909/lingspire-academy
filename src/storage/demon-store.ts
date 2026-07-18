import { db, type DemonRecord, type QuestRecord, type QuestItem } from '../storage/db';
import { calculateNextReview, isPurified } from '../systems/sm2-scheduler';
import { WordDataStore } from './word-data-store';

export class DemonStore {

  async createDemon(knowledgePointId: string, knowledgePointType: 'word' | 'sentence' | 'math'): Promise<DemonRecord> {
    const existing = await db.demonStore
      .where('knowledgePointId')
      .equals(knowledgePointId)
      .first();

    const now = new Date().toISOString();

    if (existing && !isPurified(existing.stage)) {
      const updated: DemonRecord = {
        ...existing,
        stage: 0,
        nextReviewDate: now,
        lastDefeatAt: null,
        totalFailures: existing.totalFailures + 1,
        updatedAt: now,
      };
      await db.demonStore.put(updated);
      return updated;
    }

    const demon: DemonRecord = {
      id: crypto.randomUUID(),
      knowledgePointId,
      knowledgePointType,
      stage: 0,
      nextReviewDate: now,
      createdAt: now,
      lastDefeatAt: null,
      totalDefeats: 0,
      totalFailures: 0,
      purifiedAt: null,
      updatedAt: now,
    };
    await db.demonStore.add(demon);
    return demon;
  }

  async defeatDemon(knowledgePointId: string): Promise<DemonRecord | null> {
    const demon = await db.demonStore
      .where('knowledgePointId')
      .equals(knowledgePointId)
      .first();

    if (!demon || isPurified(demon.stage)) return null;

    const result = calculateNextReview(demon.stage, true);
    const now = new Date().toISOString();

    const updated: DemonRecord = {
      ...demon,
      stage: result.nextStage,
      nextReviewDate: result.intervalDays === -1
        ? now
        : new Date(Date.now() + result.intervalDays * 86400000).toISOString(),
      lastDefeatAt: now,
      totalDefeats: demon.totalDefeats + 1,
      purifiedAt: result.intervalDays === -1 ? now : null,
      updatedAt: now,
    };
    await db.demonStore.put(updated);
    return updated;
  }

  async getDueDemons(): Promise<DemonRecord[]> {
    const now = new Date().toISOString();
    return db.demonStore
      .where('nextReviewDate')
      .belowOrEqual(now)
      .filter((d) => !isPurified(d.stage))
      .toArray();
  }

  async getAllActiveDemons(): Promise<DemonRecord[]> {
    return db.demonStore
      .filter((d) => !isPurified(d.stage))
      .toArray();
  }

  async getPurifiedDemons(): Promise<DemonRecord[]> {
    return db.demonStore
      .filter((d) => isPurified(d.stage))
      .toArray();
  }
}

export class QuestEngine {
  private demonStore: DemonStore;
  private wordDataStore: WordDataStore;

  constructor() {
    this.demonStore = new DemonStore();
    this.wordDataStore = new WordDataStore();
  }

  async generateDailyQuest(): Promise<QuestRecord> {
    const dueDemons = await this.demonStore.getDueDemons();
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    const existing = await db.questStore
      .where('type').equals('daily')
      .filter((q) => q.date.startsWith(today))
      .first();

    if (existing) return existing;

    const demonItems: QuestItem[] = dueDemons.slice(0, 12).map((d) => ({
      knowledgePointId: d.knowledgePointId,
      knowledgePointType: d.knowledgePointType,
      source: 'demon' as const,
      completed: false,
    }));

    const newIds = await this.wordDataStore.getLeastSeen(3);
    const newItems: QuestItem[] = newIds.map((id: string) => ({
      knowledgePointId: id,
      knowledgePointType: 'word' as const,
      source: 'new' as const,
      completed: false,
    }));

    const allItems = [...demonItems, ...newItems].slice(0, 15);

    const quest: QuestRecord = {
      id: crypto.randomUUID(),
      type: 'daily',
      date: now,
      items: allItems,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.questStore.add(quest);
    return quest;
  }

  async generateWeeklyQuest(): Promise<QuestRecord> {
    const activeDemons = await this.demonStore.getAllActiveDemons();
    const now = new Date().toISOString();

    const items: QuestItem[] = activeDemons.slice(0, 20).map((d) => ({
      knowledgePointId: d.knowledgePointId,
      knowledgePointType: d.knowledgePointType,
      source: 'demon' as const,
      completed: false,
    }));

    const quest: QuestRecord = {
      id: crypto.randomUUID(),
      type: 'weekly',
      date: now,
      items,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.questStore.add(quest);
    return quest;
  }

  async generateMonthlyQuest(): Promise<QuestRecord> {
    const allRecords = await this.wordDataStore.getAllRecords();
    const now = new Date().toISOString();

    const items: QuestItem[] = allRecords.slice(0, 30).map((r: typeof allRecords[number]) => ({
      knowledgePointId: r.knowledgePointId,
      knowledgePointType: r.knowledgePointType,
      source: 'new' as const,
      completed: false,
    }));

    const quest: QuestRecord = {
      id: crypto.randomUUID(),
      type: 'monthly',
      date: now,
      items,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.questStore.add(quest);
    return quest;
  }

  async completeQuestItem(questId: string, knowledgePointId: string): Promise<void> {
    const quest = await db.questStore.get(questId);
    if (!quest) return;

    quest.items = quest.items.map((item) =>
      item.knowledgePointId === knowledgePointId
        ? { ...item, completed: true }
        : item
    );

    const allCompleted = quest.items.every((item) => item.completed);
    if (allCompleted) {
      quest.completedAt = new Date().toISOString();
    }
    quest.updatedAt = new Date().toISOString();

    await db.questStore.put(quest);
  }
}
