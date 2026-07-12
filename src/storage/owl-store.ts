import { db, type OwlRecord } from './db';

const OWL_ID = 'owl';

export class OwlStore {
  async getOwl(): Promise<OwlRecord> {
    let owl = await db.owlStore.get(OWL_ID);
    if (!owl) {
      const now = new Date().toISOString();
      owl = {
        id: OWL_ID,
        stars: 0,
        evolutionStage: 0,
        abilities: [],
        monthCorrectCount: 0,
        dayCorrectCount: 0,
        sentenceCorrectCount: 0,
        createdAt: now,
        lastEvolutionAt: null,
        updatedAt: now,
      };
      await db.owlStore.put(owl);
    }
    return owl;
  }

  async addStars(count: number): Promise<OwlRecord> {
    const owl = await this.getOwl();
    owl.stars += count;
    owl.updatedAt = new Date().toISOString();
    await db.owlStore.put(owl);
    return owl;
  }

  async incrementMonthCorrect(): Promise<OwlRecord> {
    const owl = await this.getOwl();
    owl.monthCorrectCount++;
    if (owl.monthCorrectCount >= 10 && !owl.abilities.includes('month-song')) {
      owl.abilities.push('month-song');
    }
    owl.updatedAt = new Date().toISOString();
    await db.owlStore.put(owl);
    return owl;
  }

  async setEvolutionStage(stage: number): Promise<OwlRecord> {
    const owl = await this.getOwl();
    owl.evolutionStage = stage;
    owl.lastEvolutionAt = new Date().toISOString();
    owl.updatedAt = new Date().toISOString();
    await db.owlStore.put(owl);
    return owl;
  }
}
