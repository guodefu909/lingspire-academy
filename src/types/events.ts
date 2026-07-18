export interface AnswerCorrectEvent {
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence' | 'math';
  responseTimeMs: number;
}

export interface AnswerWrongEvent {
  knowledgePointId: string;
  knowledgePointType: 'word' | 'sentence' | 'math';
}

export interface ComboMilestoneEvent {
  level: 3 | 5;
  count: number;
}

export type GameEvents = {
  'answer:correct': AnswerCorrectEvent;
  'answer:wrong': AnswerWrongEvent;
  'combo:milestone': ComboMilestoneEvent;
};
