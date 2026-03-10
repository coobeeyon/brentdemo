import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getGameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';

export class PauseScene extends Phaser.Scene {
  private slotPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    this.slotPanel = null;

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pause panel
    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 150, 50, 300, 760, 15);

    this.add.text(GAME_WIDTH / 2, 80, 'PAUSED', {
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

    const gameState = getGameState(this);
    const gameMode = this.registry.get('gameMode') as string ?? 'story';
    const buttons: { label: string; scene?: string; action?: () => void }[] = [
      { label: '  Resume  ', action: () => this.resumeGame() },
      ...(gameState.franchiseMode ? [{ label: '  Franchise  ', scene: 'FranchiseScene' }] : []),
      { label: '  Menu Editor  ', scene: 'MenuEditorScene' },
      { label: '  Equipment  ', scene: 'EquipmentScene' },
      { label: '  Staff  ', scene: 'StaffScene' },
      { label: '  Marketing  ', scene: 'MarketingScene' },
      { label: '  Loans  ', scene: 'LoanScene' },
      { label: '  Decor  ', scene: 'DecorScene' },
      { label: '  Seating  ', scene: 'SeatingScene' },
      { label: '  Signage  ', scene: 'SignageScene' },
      { label: '  Research  ', scene: 'ResearchScene' },
      { label: '  Recipes  ', scene: 'RecipeScene' },
      { label: '  Save Game  ', action: () => this.showSlotPanel('save', gameState, gameMode) },
      { label: '  Load Game  ', action: () => this.showSlotPanel('load', gameState, gameMode) },
      { label: '  Settings  ', scene: 'SettingsScene' },
      { label: ' Main Menu ', action: () => { this.scene.stop('GameplayScene'); this.scene.start('MainMenuScene'); } },
    ];

    let y = 120;
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

      y += 44;
    }

    // ESC to resume
    this.input.keyboard!.on('keydown-ESC', () => this.resumeGame());
  }

  private showSlotPanel(mode: 'save' | 'load', gameState: ReturnType<typeof getGameState>, gameMode: string): void {
    if (this.slotPanel) {
      this.slotPanel.destroy();
      this.slotPanel = null;
    }

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.slotPanel = container;

    // Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
    container.add(backdrop);

    const panelW = 360;
    const panelH = 280;
    const panel = this.add.graphics();
    panel.fillStyle(0x1A252F, 1);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0x3498DB);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12);
    container.add(panel);

    const title = mode === 'save' ? 'Save Game' : 'Load Game';
    container.add(this.add.text(0, -panelH / 2 + 18, title, {
      fontFamily: 'Arial', fontSize: '22px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5));

    const saves = SaveManager.listSaves();
    let slotY = -panelH / 2 + 60;

    for (const save of saves) {
      if (save.slot === 'auto' && mode === 'save') continue; // Can't overwrite auto save manually

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
        fontFamily: 'Arial', fontSize: '15px', color: '#FFF', fontStyle: 'bold',
      }));

      container.add(this.add.text(-panelW / 2 + 25, slotY + 26, detail, {
        fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6',
      }));

      // Action button
      if (mode === 'save' && save.slot !== 'auto') {
        const saveBtn = this.add.text(panelW / 2 - 25, slotY + 24, 'Save', {
          fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
          backgroundColor: '#27AE60', padding: { x: 10, y: 4 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        saveBtn.on('pointerdown', () => {
          SaveManager.save(gameState, save.slot, gameMode);
          this.showSlotPanel('save', gameState, gameMode); // Refresh
        });
        container.add(saveBtn);
      } else if (mode === 'load' && save.data) {
        const loadBtn = this.add.text(panelW / 2 - 25, slotY + 24, 'Load', {
          fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
          backgroundColor: '#3498DB', padding: { x: 10, y: 4 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        loadBtn.on('pointerdown', () => {
          const saveData = SaveManager.getSaveData(save.slot);
          SaveManager.load(gameState, save.slot);
          this.registry.set('gameMode', saveData?.gameMode ?? 'story');
          this.registry.set('loadSave', true);
          this.slotPanel?.destroy();
          this.scene.stop();
          this.scene.stop('GameplayScene');
          this.scene.start('GameplayScene');
        });
        container.add(loadBtn);
      }

      slotY += 55;
    }

    // Close button
    const closeBtn = this.add.text(0, panelH / 2 - 20, 'Cancel', {
      fontFamily: 'Arial', fontSize: '16px', color: '#BDC3C7',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      container.destroy();
      this.slotPanel = null;
    });
    container.add(closeBtn);
  }

  private resumeGame(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }
}
