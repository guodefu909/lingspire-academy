import { eventManager } from './event-manager';
import { DemonStore } from '../storage/demon-store';

export class DemonSystemController {
  private demonStore: DemonStore;
  private initialized: boolean = false;

  constructor() {
    this.demonStore = new DemonStore();
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    eventManager.on('answer:wrong', async (payload) => {
      await this.demonStore.createDemon(
        payload.knowledgePointId,
        payload.knowledgePointType
      );
    });

    eventManager.on('answer:correct', async (payload) => {
      await this.demonStore.defeatDemon(payload.knowledgePointId);
    });
  }
}
