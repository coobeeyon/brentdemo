import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pause panel
    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 150, 150, 300, 500, 15);

    this.add.text(GAME_WIDTH / 2, 190, 'PAUSED', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#FFF',
    }).setOrigin(0.5);

    const btnStyle = {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFF',
      backgroundColor: '#34495E',
      padding: { x: 20, y: 8 },
    };

    // Resume
    const resumeBtn = this.add.text(GAME_WIDTH / 2, 280, '  Resume  ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => this.resumeGame());

    // Menu editor
    const menuBtn = this.add.text(GAME_WIDTH / 2, 340, '  Menu Editor  ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.launch('MenuEditorScene');
    });

    // Equipment
    const equipBtn = this.add.text(GAME_WIDTH / 2, 400, '  Equipment  ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    equipBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.launch('EquipmentScene');
    });

    // Staff
    const staffBtn = this.add.text(GAME_WIDTH / 2, 460, '  Staff  ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    staffBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.launch('StaffScene');
    });

    // Marketing
    const marketingBtn = this.add.text(GAME_WIDTH / 2, 520, '  Marketing  ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    marketingBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.launch('MarketingScene');
    });

    // Main menu
    const mainMenuBtn = this.add.text(GAME_WIDTH / 2, 580, ' Main Menu ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    mainMenuBtn.on('pointerdown', () => {
      this.scene.stop('GameplayScene');
      this.scene.start('MainMenuScene');
    });

    // ESC to resume
    this.input.keyboard!.on('keydown-ESC', () => this.resumeGame());
  }

  private resumeGame(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }
}
