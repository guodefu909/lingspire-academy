import type { DemonRecord, QuestItem } from '../storage/db';

export interface Demon extends DemonRecord {}

export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  items: QuestItem[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
