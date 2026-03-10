import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

const SETTINGS_KEY = 'icecream_settings';

export type DayLengthSetting = 'short' | 'normal' | 'long';

export interface GameSettings {
  colorblindMode: boolean;
  textSize: 'small' | 'medium' | 'large';
  dayLength: DayLengthSetting;
}

export const DAY_LENGTH_MS: Record<DayLengthSetting, number> = {
  short: 3 * 60 * 1000,   // 3 minutes
  normal: 5 * 60 * 1000,  // 5 minutes
  long: 10 * 60 * 1000,   // 10 minutes
};

const DEFAULT_SETTINGS: GameSettings = {
  colorblindMode: false,
  textSize: 'medium',
  dayLength: 'normal',
};

/** Global text size multiplier based on setting */
export const TEXT_SIZE_MULTIPLIERS: Record<string, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.2,
};

/** Colorblind-friendly palette swaps for common game colors */
export const COLORBLIND_PALETTE = {
  green: 0x0072B2,   // blue instead of green
  red: 0xD55E00,     // orange instead of red
  yellow: 0xF0E442,  // kept similar
};

export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export class SettingsScene extends Phaser.Scene {
  private settings!: GameSettings;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.settings = loadSettings();

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelX = GAME_WIDTH / 2 - 250;
    const panelY = GAME_HEIGHT / 2 - 200;
    const panelW = 500;
    const panelH = 470;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    this.add.text(GAME_WIDTH / 2, panelY + 30, 'Settings', {
      fontFamily: 'Arial', fontSize: '28px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(panelX + panelW - 35, panelY + 10, 'X', {
      fontFamily: 'Arial', fontSize: '20px', color: '#E74C3C', fontStyle: 'bold',
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());

    let y = panelY + 80;
    const labelStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ECF0F1' };
    const descStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6' };

    // --- Colorblind Mode ---
    this.add.text(panelX + 30, y, 'Colorblind Mode', labelStyle);
    this.add.text(panelX + 30, y + 24, 'Uses distinct colors for better visibility', descStyle);

    const cbToggle = this.add.text(panelX + panelW - 60, y + 5, this.settings.colorblindMode ? 'ON' : 'OFF', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
      color: this.settings.colorblindMode ? '#2ECC71' : '#95A5A6',
      backgroundColor: '#34495E',
      padding: { x: 12, y: 4 },
    }).setInteractive({ useHandCursor: true });

    cbToggle.on('pointerdown', () => {
      this.settings.colorblindMode = !this.settings.colorblindMode;
      cbToggle.setText(this.settings.colorblindMode ? 'ON' : 'OFF');
      cbToggle.setColor(this.settings.colorblindMode ? '#2ECC71' : '#95A5A6');
      this.applyAndSave();
    });

    y += 70;

    // --- Text Size ---
    this.add.text(panelX + 30, y, 'Text Size', labelStyle);
    this.add.text(panelX + 30, y + 24, 'Adjust UI text size for readability', descStyle);

    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const sizeLabels = { small: 'S', medium: 'M', large: 'L' };
    let sx = panelX + panelW - 150;

    for (const size of sizes) {
      const isActive = this.settings.textSize === size;
      const sizeBtn = this.add.text(sx, y + 5, sizeLabels[size], {
        fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
        color: isActive ? '#2ECC71' : '#BDC3C7',
        backgroundColor: isActive ? '#1A5276' : '#34495E',
        padding: { x: 12, y: 4 },
      }).setInteractive({ useHandCursor: true });

      sizeBtn.on('pointerdown', () => {
        this.settings.textSize = size;
        this.applyAndSave();
        this.scene.restart();
      });
      sx += 50;
    }

    y += 70;

    // --- Day Length ---
    this.add.text(panelX + 30, y, 'Day Length', labelStyle);
    this.add.text(panelX + 30, y + 24, 'How long each in-game day lasts in real time', descStyle);

    const dayLengths: Array<DayLengthSetting> = ['short', 'normal', 'long'];
    const dayLengthLabels: Record<DayLengthSetting, string> = { short: '3m', normal: '5m', long: '10m' };
    let dx = panelX + panelW - 170;

    for (const dl of dayLengths) {
      const isActive = this.settings.dayLength === dl;
      const dlBtn = this.add.text(dx, y + 5, dayLengthLabels[dl], {
        fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold',
        color: isActive ? '#2ECC71' : '#BDC3C7',
        backgroundColor: isActive ? '#1A5276' : '#34495E',
        padding: { x: 10, y: 4 },
      }).setInteractive({ useHandCursor: true });

      dlBtn.on('pointerdown', () => {
        this.settings.dayLength = dl;
        this.applyAndSave();
        this.scene.restart();
      });
      dx += 55;
    }

    y += 70;

    // --- Preview ---
    this.add.text(panelX + 30, y, 'Preview', labelStyle);
    y += 30;

    const mult = TEXT_SIZE_MULTIPLIERS[this.settings.textSize];
    const previewSize = Math.round(16 * mult);
    this.add.text(panelX + 30, y, `This is ${this.settings.textSize} text (${previewSize}px)`, {
      fontFamily: 'Arial', fontSize: `${previewSize}px`, color: '#ECF0F1',
    });

    y += 40;

    if (this.settings.colorblindMode) {
      const cbPreview = this.add.graphics();
      const bx = panelX + 30;
      cbPreview.fillStyle(COLORBLIND_PALETTE.green, 1);
      cbPreview.fillRect(bx, y, 30, 20);
      this.add.text(bx + 35, y + 2, 'Good', { fontFamily: 'Arial', fontSize: '14px', color: '#ECF0F1' });

      cbPreview.fillStyle(COLORBLIND_PALETTE.red, 1);
      cbPreview.fillRect(bx + 100, y, 30, 20);
      this.add.text(bx + 135, y + 2, 'Warning', { fontFamily: 'Arial', fontSize: '14px', color: '#ECF0F1' });

      cbPreview.fillStyle(COLORBLIND_PALETTE.yellow, 1);
      cbPreview.fillRect(bx + 220, y, 30, 20);
      this.add.text(bx + 255, y + 2, 'Caution', { fontFamily: 'Arial', fontSize: '14px', color: '#ECF0F1' });
    } else {
      const normPreview = this.add.graphics();
      const bx = panelX + 30;
      normPreview.fillStyle(0x2ECC71, 1);
      normPreview.fillRect(bx, y, 30, 20);
      this.add.text(bx + 35, y + 2, 'Good', { fontFamily: 'Arial', fontSize: '14px', color: '#ECF0F1' });

      normPreview.fillStyle(0xE74C3C, 1);
      normPreview.fillRect(bx + 100, y, 30, 20);
      this.add.text(bx + 135, y + 2, 'Warning', { fontFamily: 'Arial', fontSize: '14px', color: '#ECF0F1' });

      normPreview.fillStyle(0xF1C40F, 1);
      normPreview.fillRect(bx + 220, y, 30, 20);
      this.add.text(bx + 255, y + 2, 'Caution', { fontFamily: 'Arial', fontSize: '14px', color: '#ECF0F1' });
    }

    // ESC to close
    this.input.keyboard!.on('keydown-ESC', () => this.close());
  }

  private applyAndSave(): void {
    saveSettings(this.settings);
    // Store in registry for other scenes to read
    this.registry.set('gameSettings', this.settings);
  }

  private close(): void {
    this.scene.stop();
    this.scene.launch('PauseScene');
  }
}
