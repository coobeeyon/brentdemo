import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameplayScene } from './scenes/GameplayScene';
import { PauseScene } from './scenes/PauseScene';
import { ShopScene } from './scenes/ShopScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scene: [BootScene, MainMenuScene, GameplayScene, PauseScene, ShopScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
