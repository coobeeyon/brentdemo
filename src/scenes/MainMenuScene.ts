import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

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
    this.add.text(GAME_WIDTH / 2, 150, '🍦 Ice Cream Store', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#FFFFFF',
      stroke: '#FF6B9D',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 220, 'Simulator', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#FFFFFF',
      stroke: '#FF6B9D',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Menu buttons
    const buttonStyle = {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFFFFF',
      backgroundColor: '#FF6B9D',
      padding: { x: 30, y: 12 },
    };

    const storyBtn = this.add.text(GAME_WIDTH / 2, 360, '  Story Mode  ', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const sandboxBtn = this.add.text(GAME_WIDTH / 2, 430, ' Sandbox Mode ', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const challengeBtn = this.add.text(GAME_WIDTH / 2, 500, 'Challenge Mode', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button hover effects
    [storyBtn, sandboxBtn, challengeBtn].forEach(btn => {
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FF8FB1' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#FF6B9D' }));
    });

    // Start game on click
    storyBtn.on('pointerdown', () => this.startGame('story'));
    sandboxBtn.on('pointerdown', () => this.startGame('sandbox'));
    challengeBtn.on('pointerdown', () => this.startGame('challenge'));

    // Version text
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFFFFF88',
    }).setOrigin(1, 1);
  }

  private startGame(mode: string): void {
    this.registry.set('gameMode', mode);
    this.scene.start('GameplayScene');
  }
}
