import Dexie, { type Table } from 'dexie';

export interface WordDataRecord {
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence';
  correctCount: number;
  totalCount: number;
  correctRate: number;
  lastSeenAt: string;
  reviewCount: number;
  avgResponseTimeMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemonRecord {
  id: string;
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence';
  stage: number;
  nextReviewDate: string;
  createdAt: string;
  lastDefeatAt: string | null;
  totalDefeats: number;
  totalFailures: number;
  purifiedAt: string | null;
  updatedAt: string;
}

export interface OwlRecord {
  id: string;
  stars: number;
  evolutionStage: number;
  abilities: string[];
  monthCorrectCount: number;
  dayCorrectCount: number;
  sentenceCorrectCount: number;
  createdAt: string;
  lastEvolutionAt: string | null;
  updatedAt: string;
}

export interface QuestRecord {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  items: QuestItem[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestItem {
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence';
  source: 'demon' | 'new';
  completed: boolean;
}

class EnglishCraftDB extends Dexie {
  wordDataStore!: Table<WordDataRecord, string>;
  demonStore!: Table<DemonRecord, string>;
  owlStore!: Table<OwlRecord, string>;
  questStore!: Table<QuestRecord, string>;

  constructor() {
    super('EnglishCraftDB');
    this.version(1).stores({
      wordDataStore: 'knowledgePointId, knowledgePointType, lastSeenAt, correctRate',
    });
    this.version(2).stores({
      wordDataStore: 'knowledgePointId, knowledgePointType, lastSeenAt, correctRate',
      demonStore: 'id, knowledgePointId, nextReviewDate',
      questStore: 'id, type, date',
    });
    this.version(3).stores({
      wordDataStore: 'knowledgePointId, knowledgePointType, lastSeenAt, correctRate',
      demonStore: 'id, knowledgePointId, nextReviewDate',
      questStore: 'id, type, date',
      owlStore: 'id',
    });
  }
}

export const db = new EnglishCraftDB();
