export class ComboTracker {
  private combo: number = 0;

  onCorrect(): number {
    this.combo++;
    return this.combo;
  }

  onWrong(): void {
    this.combo = 0;
  }

  getCombo(): number {
    return this.combo;
  }

  isMilestone(): false | 3 | 5 {
    if (this.combo === 3) return 3;
    if (this.combo === 5) return 5;
    return false;
  }

  reset(): void {
    this.combo = 0;
  }
}
