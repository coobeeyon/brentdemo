import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { SaveManager } from '../systems/SaveManager';
import { getGameState } from '../systems/GameState';
import { scaledFontSize } from '../systems/UIUtils';

export class MainMenuScene extends Phaser.Scene {
  private loadPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.loadPanel = null;

    // Background gradient effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xFFB347, 0xFFB347, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 120, '🍦 Ice Cream Store', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 64),
      color: '#FFFFFF',
      stroke: '#FF6B9D',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 190, 'Simulator', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 48),
      color: '#FFFFFF',
      stroke: '#FF6B9D',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const buttonStyle = {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 28),
      color: '#FFFFFF',
      backgroundColor: '#FF6B9D',
      padding: { x: 30, y: 12 },
    };

    let nextY = 290;

    // Continue button (if auto-save exists)
    if (SaveManager.hasSave('auto')) {
      const saveData = SaveManager.getSaveData('auto');
      const continueBtn = this.add.text(GAME_WIDTH / 2, nextY, '  Continue  ', {
        ...buttonStyle,
        backgroundColor: '#3498DB',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#5DADE2' }));
      continueBtn.on('pointerout', () => continueBtn.setStyle({ backgroundColor: '#3498DB' }));
      continueBtn.on('pointerdown', () => this.loadSlot('auto'));

      if (saveData) {
        const date = new Date(saveData.timestamp);
        this.add.text(GAME_WIDTH / 2, nextY + 28, `Day ${saveData.state.day} · ${date.toLocaleDateString()}`, {
          fontFamily: 'Arial',
          fontSize: scaledFontSize(this, 13),
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
    nextY += 70;

    [storyBtn, sandboxBtn, challengeBtn].forEach(btn => {
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FF8FB1' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#FF6B9D' }));
    });

    storyBtn.on('pointerdown', () => this.startGame('story'));
    sandboxBtn.on('pointerdown', () => this.startGame('sandbox'));
    challengeBtn.on('pointerdown', () => this.scene.start('ChallengeScene'));

    // Load Game button (if any save exists)
    const saves = SaveManager.listSaves();
    const hasAnySave = saves.some(s => s.data !== null);
    if (hasAnySave) {
      const loadBtn = this.add.text(GAME_WIDTH / 2, nextY, '  Load Game  ', {
        ...buttonStyle,
        fontSize: scaledFontSize(this, 24),
        backgroundColor: '#8E44AD',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      loadBtn.on('pointerover', () => loadBtn.setStyle({ backgroundColor: '#A569BD' }));
      loadBtn.on('pointerout', () => loadBtn.setStyle({ backgroundColor: '#8E44AD' }));
      loadBtn.on('pointerdown', () => this.showLoadPanel());
    }

    // Version text
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 14),
      color: '#FFFFFF88',
    }).setOrigin(1, 1);
  }

  private startGame(mode: string): void {
    this.registry.set('gameMode', mode);
    this.registry.set('loadSave', false);
    this.scene.start('GameplayScene');
  }

  private loadSlot(slot: string): void {
    const gameState = getGameState(this);
    SaveManager.load(gameState, slot);
    const saveData = SaveManager.getSaveData(slot);
    this.registry.set('gameMode', saveData?.gameMode ?? 'story');
    this.registry.set('loadSave', true);
    this.scene.start('GameplayScene');
  }

  private showLoadPanel(): void {
    if (this.loadPanel) {
      this.loadPanel.destroy();
      this.loadPanel = null;
    }

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.loadPanel = container;

    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
    container.add(backdrop);

    const panelW = 380;
    const panelH = 320;
    const panel = this.add.graphics();
    panel.fillStyle(0x1A252F, 1);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0x8E44AD);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12);
    container.add(panel);

    container.add(this.add.text(0, -panelH / 2 + 18, 'Load Game', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5));

    const saves = SaveManager.listSaves();
    let slotY = -panelH / 2 + 55;

    for (const save of saves) {
      const slotLabel = save.slot === 'auto' ? 'Auto Save' : `Slot ${save.slot}`;
      let detail = 'Empty';
      if (save.data) {
        const date = new Date(save.data.timestamp);
        detail = `Day ${save.data.state.day} S${save.data.state.season} · ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x2C3E50, 1);
      slotBg.fillRoundedRect(-panelW / 2 + 15, slotY, panelW - 30, 48, 6);
      container.add(slotBg);

      container.add(this.add.text(-panelW / 2 + 25, slotY + 6, slotLabel, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#FFF', fontStyle: 'bold',
      }));

      container.add(this.add.text(-panelW / 2 + 25, slotY + 26, detail, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#95A5A6',
      }));

      if (save.data) {
        const loadBtn = this.add.text(panelW / 2 - 25, slotY + 24, 'Load', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
          backgroundColor: '#8E44AD', padding: { x: 10, y: 4 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        loadBtn.on('pointerdown', () => {
          this.loadPanel?.destroy();
          this.loadSlot(save.slot);
        });
        container.add(loadBtn);
      }

      slotY += 55;
    }

    const closeBtn = this.add.text(0, panelH / 2 - 20, 'Cancel', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#BDC3C7',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      container.destroy();
      this.loadPanel = null;
    });
    container.add(closeBtn);
  }
}
