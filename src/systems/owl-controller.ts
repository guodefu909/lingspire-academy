import { eventManager } from './event-manager';
import { OwlStore } from '../storage/owl-store';
import { EvolutionEngine } from './evolution-engine';
import type { EvolutionConfig } from '../models/owl-state';

export class OwlController {
  private owlStore: OwlStore;
  private evolutionEngine: EvolutionEngine;
  private initialized: boolean = false;

  constructor(configs: EvolutionConfig[]) {
    this.owlStore = new OwlStore();
    this.evolutionEngine = new EvolutionEngine(configs);
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    eventManager.on('answer:correct', async (payload) => {
      await this.owlStore.addStars(1);

      if (payload.knowledgePointType === 'word') {
        const wordData = payload.knowledgePointId;
        const monthIds = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december',
        ];
        if (monthIds.includes(wordData)) {
          await this.owlStore.incrementMonthCorrect();
        }
      }

      const result = await this.evolutionEngine.checkEvolution();
      if (result.evolved && result.config) {
        console.log(`猫头鹰进化为：${result.config.name}！`);
      }
    });
  }
}
