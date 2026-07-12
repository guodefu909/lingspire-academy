export interface SM2Result {
  nextStage: number;
  intervalDays: number;
}

export function calculateNextReview(stage: number, wasCorrect: boolean): SM2Result {
  if (!wasCorrect) {
    return { nextStage: 0, intervalDays: 1 };
  }

  switch (stage) {
    case 0:
      return { nextStage: 1, intervalDays: 3 };
    case 1:
      return { nextStage: 2, intervalDays: 7 };
    case 2:
      return { nextStage: 3, intervalDays: -1 };
    default:
      return { nextStage: 3, intervalDays: -1 };
  }
}

export function isPurified(stage: number): boolean {
  return stage >= 3;
}

export function getStageLabel(stage: number): string {
  switch (stage) {
    case 0:
      return '新生心魔';
    case 1:
      return '裂痕心魔';
    case 2:
      return '将灭心魔';
    case 3:
      return '已净化';
    default:
      return '未知';
  }
}
