import type { EvolutionConfig } from '../models/owl-state';
import { OwlStore } from '../storage/owl-store';

const EVOLUTION_THRESHOLDS = [0, 10, 30, 60, 100];

export class EvolutionEngine {
  private owlStore: OwlStore;
  private configs: EvolutionConfig[] = [];

  constructor(configs: EvolutionConfig[]) {
    this.owlStore = new OwlStore();
    this.configs = configs;
  }

  async checkEvolution(): Promise<{ evolved: boolean; newStage: number; config?: EvolutionConfig }> {
    const owl = await this.owlStore.getOwl();

    let newStage = owl.evolutionStage;
    for (let i = this.configs.length - 1; i >= 0; i--) {
      if (owl.stars >= this.configs[i].starsRequired) {
        newStage = this.configs[i].stage;
        break;
      }
    }

    if (newStage > owl.evolutionStage) {
      await this.owlStore.setEvolutionStage(newStage);
      return { evolved: true, newStage, config: this.configs[newStage] };
    }

    return { evolved: false, newStage };
  }

  getThresholds(): number[] {
    return EVOLUTION_THRESHOLDS;
  }
}
