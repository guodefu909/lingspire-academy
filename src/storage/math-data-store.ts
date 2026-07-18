import { db, type WordDataRecord } from './db';

export class MathDataStore {
  async recordAnswer(
    knowledgePointId: string,
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
        knowledgePointType: 'math',
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

  async getWeakPoints(threshold: number = 0.6): Promise<WordDataRecord[]> {
    const all = await db.wordDataStore
      .where('knowledgePointType')
      .equals('math')
      .toArray();
    return all.filter(r => r.correctRate < threshold && r.totalCount >= 3);
  }
}