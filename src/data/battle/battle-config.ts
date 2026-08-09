export interface BattleConfig {
  crystal: {
    initialHealth: number;
    maxHealth: number;
  };
  soldier: {
    initialHealth: number;
    maxHealth: number;
    speed: number;
  };
  spawn: {
    initialInterval: number;
    finalInterval: number;
  };
  word: {
    imageBaseUrl: string;
  };
  bullet: {
    speed: number;
    maxDisplayCount: number;
    maxCapacity: number;
  };
  game: {
    duration: number;
  };
  ai: {
    errorRate: number;
  };
}

export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  crystal: {
    initialHealth: 20,
    maxHealth: 20,
  },
  soldier: {
    initialHealth: 1,
    maxHealth: 5,
    speed: 60,
  },
  spawn: {
    initialInterval: 8000,
    finalInterval: 1000,
  },
  word: {
    imageBaseUrl: "/words/",
  },
  bullet: {
    speed: 300,
    maxDisplayCount: 10,
    maxCapacity: 100,
  },
  game: {
    duration: 5 * 60 * 1000,
  },
  ai: {
    errorRate: 0.2,
  },
};
