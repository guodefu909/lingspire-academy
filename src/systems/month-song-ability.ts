export class MonthSongAbility {
  async play(): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API 不支持，跳过月份之歌');
      return;
    }

    const months = [
      'January', 'February', 'March', 'April',
      'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December',
    ];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const month of months) {
      const utterance = new SpeechSynthesisUtterance(month);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;

      await new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        speechSynthesis.speak(utterance);
      });

      await delay(500);
    }
  }
}
