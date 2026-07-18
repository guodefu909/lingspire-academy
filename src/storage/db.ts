import Dexie, { type Table } from 'dexie';

export interface WordDataRecord {
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence' | 'math';
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
  knowledgePointType: 'word' | 'sentence' | 'math';
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
  knowledgePointType: 'word' | 'sentence' | 'math';
  source: 'demon' | 'new';
  completed: boolean;
}

export interface CalcLevelProgressRecord {
  levelKey: string;
  bestStars: number;
  bestTimeMs: number | null;
  playCount: number;
  lastPlayedAt: string;
}

export interface CalcDemonRecord {
  id: string;
  knowledgePointId: string;
  demonLevel: number;
  totalWrongCount: number;
  consecutiveCorrectCount: number;
  requiredCorrectCount: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalcAccuracySnapshotRecord {
  knowledgePointId: string;
  lastMilestonePercent: number;
  updatedAt: string;
}

class EnglishCraftDB extends Dexie {
  wordDataStore!: Table<WordDataRecord, string>;
  demonStore!: Table<DemonRecord, string>;
  owlStore!: Table<OwlRecord, string>;
  questStore!: Table<QuestRecord, string>;
  calcLevelProgressStore!: Table<CalcLevelProgressRecord, string>;
  calcDemonStore!: Table<CalcDemonRecord, string>;
  calcAccuracySnapshotStore!: Table<CalcAccuracySnapshotRecord, string>;

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
    this.version(4).stores({
      wordDataStore: 'knowledgePointId, knowledgePointType, lastSeenAt, correctRate',
      demonStore: 'id, knowledgePointId, nextReviewDate',
      questStore: 'id, type, date',
      owlStore: 'id',
      calcLevelProgressStore: 'levelKey',
      calcDemonStore: 'id, knowledgePointId, isResolved',
      calcAccuracySnapshotStore: 'knowledgePointId',
    });
  }
}

export const db = new EnglishCraftDB();
