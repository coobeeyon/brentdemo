import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { SaveManager } from '../systems/SaveManager';
import { getGameState } from '../systems/GameState';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // Background gradient effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xFFB347, 0xFFB347, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 120, '🍦 Ice Cream Store', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#FFFFFF',
      stroke: '#FF6B9D',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 190, 'Simulator', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#FFFFFF',
      stroke: '#FF6B9D',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const buttonStyle = {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFFFFF',
      backgroundColor: '#FF6B9D',
      padding: { x: 30, y: 12 },
    };

    let nextY = 290;

    // Continue button (if save exists)
    if (SaveManager.hasSave('auto')) {
      const saveData = SaveManager.getSaveData('auto');
      const continueBtn = this.add.text(GAME_WIDTH / 2, nextY, '  Continue  ', {
        ...buttonStyle,
        backgroundColor: '#3498DB',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#5DADE2' }));
      continueBtn.on('pointerout', () => continueBtn.setStyle({ backgroundColor: '#3498DB' }));
      continueBtn.on('pointerdown', () => this.continueGame());

      if (saveData) {
        const date = new Date(saveData.timestamp);
        this.add.text(GAME_WIDTH / 2, nextY + 28, `Day ${saveData.state.day} · ${date.toLocaleDateString()}`, {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#FFFFFFAA',
        }).setOrigin(0.5);
      }

      nextY += 75;
    }

    const storyBtn = this.add.text(GAME_WIDTH / 2, nextY, '  Story Mode  ', buttonStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextY += 70;

    const sandboxBtn = this.add.text(GAME_WIDTH / 2, nextY, ' Sandbox Mode ', buttonStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextY += 70;

    const challengeBtn = this.add.text(GAME_WIDTH / 2, nextY, 'Challenge Mode', buttonStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    [storyBtn, sandboxBtn, challengeBtn].forEach(btn => {
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FF8FB1' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#FF6B9D' }));
    });

    storyBtn.on('pointerdown', () => this.startGame('story'));
    sandboxBtn.on('pointerdown', () => this.startGame('sandbox'));
    challengeBtn.on('pointerdown', () => this.scene.start('ChallengeScene'));

    // Version text
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFFFFF88',
    }).setOrigin(1, 1);
  }

  private startGame(mode: string): void {
    this.registry.set('gameMode', mode);
    this.registry.set('loadSave', false);
    this.scene.start('GameplayScene');
  }

  private continueGame(): void {
    const gameState = getGameState(this);
    SaveManager.load(gameState);
    const saveData = SaveManager.getSaveData('auto');
    this.registry.set('gameMode', saveData?.gameMode ?? 'story');
    this.registry.set('loadSave', true);
    this.scene.start('GameplayScene');
  }
}
