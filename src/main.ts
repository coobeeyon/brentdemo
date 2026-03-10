import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameplayScene } from './scenes/GameplayScene';
import { PauseScene } from './scenes/PauseScene';
import { ShopScene } from './scenes/ShopScene';
import { EquipmentScene } from './scenes/EquipmentScene';
import { StaffScene } from './scenes/StaffScene';
import { MenuEditorScene } from './scenes/MenuEditorScene';
import { MarketingScene } from './scenes/MarketingScene';
import { LoanScene } from './scenes/LoanScene';
import { DecorScene } from './scenes/DecorScene';
import { SeatingScene } from './scenes/SeatingScene';
import { ResearchScene } from './scenes/ResearchScene';
import { RecipeScene } from './scenes/RecipeScene';
import { PopUpBoothScene } from './scenes/PopUpBoothScene';
import { ChallengeScene } from './scenes/ChallengeScene';
import { SignageScene } from './scenes/SignageScene';
import { TutorialScene } from './scenes/TutorialScene';
import { FranchiseScene } from './scenes/FranchiseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { VictoryScene } from './scenes/VictoryScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  roundPixels: true,
  antialias: true,
  scene: [BootScene, MainMenuScene, GameplayScene, PauseScene, ShopScene, EquipmentScene, StaffScene, MenuEditorScene, MarketingScene, LoanScene, DecorScene, SeatingScene, ResearchScene, RecipeScene, PopUpBoothScene, ChallengeScene, LeaderboardScene, SignageScene, TutorialScene, FranchiseScene, SettingsScene, VictoryScene, GameOverScene],
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
  input: {
    activePointers: 3,
    touch: {
      capture: true,
    },
  },
};

const game = new Phaser.Game(config);

// Prevent default touch gestures on the game canvas to avoid scroll/zoom interference
game.events.once('ready', () => {
  const canvas = game.canvas;
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
});
