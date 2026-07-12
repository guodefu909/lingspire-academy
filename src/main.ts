import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { DifficultySelectScene } from './scenes/DifficultySelectScene';
import { ChunkSpellScene } from './scenes/ChunkSpellScene';
import { ChunkBuildScene } from './scenes/ChunkBuildScene';
import { ListenPickScene } from './scenes/ListenPickScene';
import { TimeMatchScene } from './scenes/TimeMatchScene';
import { QuestScene } from './scenes/QuestScene';
import { OwlProfileScene } from './scenes/OwlProfileScene';
import { ResultScene } from './scenes/ResultScene';
import { DemonSystemController } from './systems/demon-controller';
import { OwlController } from './systems/owl-controller';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 768,
  height: 1024,
  backgroundColor: '#2a1a3a',
  input: {
    touch: true,
    activePointers: 3,
  },
  scene: [BootScene, MenuScene, DifficultySelectScene, ChunkSpellScene, ChunkBuildScene, ListenPickScene, TimeMatchScene, QuestScene, OwlProfileScene, ResultScene],
};

const game = new Phaser.Game(config);

game.events.once('ready', () => {
  const evolutionConfigs = game.cache.json.get('owl-evolution') ?? [];
  const demonController = new DemonSystemController();
  demonController.init();
  const owlController = new OwlController(evolutionConfigs);
  owlController.init();
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker 注册失败:', err);
    });
  });
}
