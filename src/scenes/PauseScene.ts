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
    panel.fillRoundedRect(GAME_WIDTH / 2 - 150, 120, 300, 572, 15);

    this.add.text(GAME_WIDTH / 2, 150, 'PAUSED', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#FFF',
    }).setOrigin(0.5);

    const btnStyle = {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFF',
      backgroundColor: '#34495E',
      padding: { x: 20, y: 6 },
    };

    const buttons: { label: string; scene?: string; action?: () => void }[] = [
      { label: '  Resume  ', action: () => this.resumeGame() },
      { label: '  Menu Editor  ', scene: 'MenuEditorScene' },
      { label: '  Equipment  ', scene: 'EquipmentScene' },
      { label: '  Staff  ', scene: 'StaffScene' },
      { label: '  Marketing  ', scene: 'MarketingScene' },
      { label: '  Loans  ', scene: 'LoanScene' },
      { label: '  Decor  ', scene: 'DecorScene' },
      { label: '  Seating  ', scene: 'SeatingScene' },
      { label: ' Main Menu ', action: () => { this.scene.stop('GameplayScene'); this.scene.start('MainMenuScene'); } },
    ];

    let y = 210;
    for (const btn of buttons) {
      const text = this.add.text(GAME_WIDTH / 2, y, btn.label, btnStyle)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });

      if (btn.scene) {
        text.on('pointerdown', () => {
          this.scene.stop();
          this.scene.launch(btn.scene!);
        });
      } else if (btn.action) {
        text.on('pointerdown', btn.action);
      }

      y += 52;
    }

    // ESC to resume
    this.input.keyboard!.on('keydown-ESC', () => this.resumeGame());
  }

  private resumeGame(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }
}
