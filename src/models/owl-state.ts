export interface OwlState {
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

export interface EvolutionConfig {
  stage: number;
  name: string;
  starsRequired: number;
  textureKey: string;
  description: string;
}
