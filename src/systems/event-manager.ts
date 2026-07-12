import type { GameEvents } from '../types/events';

type EventHandler<T> = (payload: T) => void;

class EventManager {
  private handlers: Map<string, Set<EventHandler<any>>> = new Map();

  on<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

export const eventManager = new EventManager();
