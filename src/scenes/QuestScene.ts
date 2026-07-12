import * as Phaser from 'phaser';
import { QuestEngine } from '../storage/demon-store';

type QuestTab = 'daily' | 'weekly' | 'monthly';

export class QuestScene extends Phaser.Scene {
  private questEngine: QuestEngine;
  private currentTab: QuestTab = 'daily';
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private questList: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'QuestScene' });
    this.questEngine = new QuestEngine();
  }

  async create(): Promise<void> {
    const width = this.cameras.main.width;

    this.add.text(30, 30, '← 返回', {
      fontSize: '20px', color: '#c0a0e0', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.text(width / 2, 60, '日常任务', {
      fontSize: '32px', color: '#f0e0ff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.createTabs(width / 2, 110);

    await this.loadQuest(this.currentTab);
  }

  private createTabs(centerX: number, y: number): void {
    const tabs: { key: QuestTab; name: string }[] = [
      { key: 'daily', name: '今日任务' },
      { key: 'weekly', name: '本周任务' },
      { key: 'monthly', name: '本月任务' },
    ];

    const tabWidth = 160;
    const gap = 10;
    const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * gap;
    const startX = centerX - totalWidth / 2;

    tabs.forEach((tab, i) => {
      const x = startX + i * (tabWidth + gap) + tabWidth / 2;
      const container = this.add.container(x, y);
      const isSelected = tab.key === this.currentTab;
      const bg = this.add.rectangle(0, 0, tabWidth, 45,
        isSelected ? 0x6b4e8a : 0x3a2a4a, 0.9)
        .setStrokeStyle(2, isSelected ? 0xffcc00 : 0x6b4e8a);
      const text = this.add.text(0, 0, tab.name, {
        fontSize: '18px',
        color: isSelected ? '#ffcc00' : '#c0a0e0',
        fontFamily: 'Arial',
        fontStyle: isSelected ? 'bold' : 'normal',
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setSize(tabWidth, 45);
      container.setInteractive({ useHandCursor: true });
      container.setData('tab', tab.key);
      container.setData('bg', bg);
      container.setData('label', text);

      container.on('pointerdown', async () => {
        this.currentTab = tab.key;
        this.refreshTabs();
        await this.loadQuest(this.currentTab);
      });

      this.tabButtons.push(container);
    });
  }

  private refreshTabs(): void {
    for (const btn of this.tabButtons) {
      const tab = btn.getData('tab') as QuestTab;
      const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
      const label = btn.getData('label') as Phaser.GameObjects.Text;
      const isSelected = tab === this.currentTab;
      bg.setFillStyle(isSelected ? 0x6b4e8a : 0x3a2a4a, 0.9)
        .setStrokeStyle(2, isSelected ? 0xffcc00 : 0x6b4e8a);
      label.setColor(isSelected ? '#ffcc00' : '#c0a0e0');
      label.setFontStyle(isSelected ? 'bold' : 'normal');
    }
  }

  private async loadQuest(type: QuestTab): Promise<void> {
    this.questList.forEach((c) => c.destroy());
    this.questList = [];

    const width = this.cameras.main.width;
    const startY = 180;

    try {
      let quest;
      if (type === 'daily') {
        quest = await this.questEngine.generateDailyQuest();
      } else if (type === 'weekly') {
        quest = await this.questEngine.generateWeeklyQuest();
      } else {
        quest = await this.questEngine.generateMonthlyQuest();
      }

      if (!quest || quest.items.length === 0) {
        this.add.text(width / 2, startY + 50, '暂无任务，去答题挑战心魔吧！', {
          fontSize: '20px', color: '#8070a0', fontFamily: 'Arial',
        }).setOrigin(0.5);
        return;
      }

      const demonCount = quest.items.filter((i) => i.source === 'demon').length;
      const newCount = quest.items.filter((i) => i.source === 'new').length;

      this.add.text(width / 2, startY - 30,
        `心魔 ${demonCount} 题 | 新知识 ${newCount} 题 | 共 ${quest.items.length} 题`,
        { fontSize: '16px', color: '#c0a0e0', fontFamily: 'Arial' }
      ).setOrigin(0.5);

      const itemHeight = 55;
      const maxItems = Math.min(quest.items.length, 12);

      quest.items.slice(0, maxItems).forEach((item, index) => {
        const y = startY + index * (itemHeight + 5);
        const container = this.add.container(width / 2, y);

        const isDemon = item.source === 'demon';
        const bgColor = isDemon ? 0x4a1a2a : 0x1a2a4a;
        const borderColor = isDemon ? 0xaa3a3a : 0x3a5a8a;

        const bg = this.add.rectangle(0, 0, width - 60, itemHeight - 5, bgColor, 0.9)
          .setStrokeStyle(2, borderColor);

        const icon = isDemon ? '👹' : '✨';
        const label = isDemon ? '心魔' : '新题';
        const typeLabel = item.knowledgePointType === 'word' ? '词汇' : '句型';

        const iconText = this.add.text(-(width / 2 - 40), 0, icon, {
          fontSize: '22px', fontFamily: 'Arial',
        }).setOrigin(0.5);

        const typeText = this.add.text(-(width / 2 - 75), 0, `${label} ${typeLabel}`, {
          fontSize: '14px', color: isDemon ? '#ff8888' : '#88aaff', fontFamily: 'Arial',
        }).setOrigin(0, 0.5);

        const idText = this.add.text(0, 0, item.knowledgePointId, {
          fontSize: '16px', color: '#e0d0f0', fontFamily: 'Arial',
        }).setOrigin(0.5);

        const status = item.completed ? '✓' : '○';
        const statusText = this.add.text(width / 2 - 40, 0, status, {
          fontSize: '22px', color: item.completed ? '#88ff88' : '#888888', fontFamily: 'Arial',
        }).setOrigin(0.5);

        container.add([bg, iconText, typeText, idText, statusText]);
        container.setSize(width - 60, itemHeight - 5);

        if (!item.completed) {
          container.setInteractive({ useHandCursor: true });
          container.on('pointerdown', () => {
            if (item.knowledgePointType === 'word') {
              this.scene.start('DifficultySelectScene', { gameMode: 'chunk-spell' });
            } else {
              this.scene.start('DifficultySelectScene', { gameMode: 'chunk-build' });
            }
          });
        }

        this.questList.push(container);
      });
    } catch (err) {
      console.error('Failed to load quest:', err);
      this.add.text(width / 2, startY + 50, '加载失败', {
        fontSize: '20px', color: '#ff6666', fontFamily: 'Arial',
      }).setOrigin(0.5);
    }
  }
}
