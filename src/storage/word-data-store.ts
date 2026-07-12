import { db, type WordDataRecord } from './db';

export class WordDataStore {
  async recordAnswer(
    knowledgePointId: string,
    knowledgePointType: 'word' | 'sentence',
    correct: boolean,
    responseTimeMs: number
  ): Promise<void> {
    const existing = await db.wordDataStore.get(knowledgePointId);
    const now = new Date().toISOString();

    if (existing) {
      const newTotalCount = existing.totalCount + 1;
      const newCorrectCount = existing.correctCount + (correct ? 1 : 0);
      const newAvgResponseTime =
        (existing.avgResponseTimeMs * existing.totalCount + responseTimeMs) / newTotalCount;

      const updated: WordDataRecord = {
        ...existing,
        correctCount: newCorrectCount,
        totalCount: newTotalCount,
        correctRate: newCorrectCount / newTotalCount,
        lastSeenAt: now,
        reviewCount: existing.reviewCount + 1,
        avgResponseTimeMs: newAvgResponseTime,
        updatedAt: now,
      };
      await db.wordDataStore.put(updated);
    } else {
      const record: WordDataRecord = {
        knowledgePointId,
        knowledgePointType,
        correctCount: correct ? 1 : 0,
        totalCount: 1,
        correctRate: correct ? 1 : 0,
        lastSeenAt: now,
        reviewCount: 1,
        avgResponseTimeMs: responseTimeMs,
        createdAt: now,
        updatedAt: now,
      };
      await db.wordDataStore.put(record);
    }
  }

  async getAccuracy(knowledgePointId: string): Promise<number | null> {
    const record = await db.wordDataStore.get(knowledgePointId);
    return record?.correctRate ?? null;
  }

  async getAllRecords(): Promise<WordDataRecord[]> {
    return db.wordDataStore.toArray();
  }

  async getLeastSeen(count: number, type?: 'word' | 'sentence'): Promise<string[]> {
    let collection = db.wordDataStore.orderBy('lastSeenAt');
    if (type) {
      collection = db.wordDataStore.where('knowledgePointType').equals(type);
    }
    const records = await collection.limit(count).toArray();
    return records.map((r) => r.knowledgePointId);
  }

  private wrongCountMap: Map<string, number> = new Map();

  async incrementWrongCount(knowledgePointId: string): Promise<void> {
    const current = this.wrongCountMap.get(knowledgePointId) ?? 0;
    this.wrongCountMap.set(knowledgePointId, current + 1);
  }

  async getWrongCount(knowledgePointId: string): Promise<number> {
    return this.wrongCountMap.get(knowledgePointId) ?? 0;
  }

  async resetWrongCount(knowledgePointId: string): Promise<void> {
    this.wrongCountMap.delete(knowledgePointId);
  }
}
