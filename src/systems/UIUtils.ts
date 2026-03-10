import Phaser from 'phaser';
import { GameSettings, TEXT_SIZE_MULTIPLIERS, COLORBLIND_PALETTE } from '../scenes/SettingsScene';

/** Standard color names used throughout the UI */
type UIColorName = 'green' | 'red' | 'yellow';

/** Normal-mode hex string colors for each UI color name */
const NORMAL_COLORS_HEX: Record<UIColorName, string> = {
  green: '#2ECC71',
  red: '#E74C3C',
  yellow: '#F1C40F',
};

/** Colorblind-mode hex string colors */
const CB_COLORS_HEX: Record<UIColorName, string> = {
  green: '#0072B2',   // blue
  red: '#D55E00',     // orange
  yellow: '#F0E442',
};

/** Normal-mode numeric colors */
const NORMAL_COLORS_NUM: Record<UIColorName, number> = {
  green: 0x2ECC71,
  red: 0xE74C3C,
  yellow: 0xF1C40F,
};

function getSettings(scene: Phaser.Scene): GameSettings {
  return scene.registry.get('gameSettings') ?? { colorblindMode: false, textSize: 'medium' };
}

/**
 * Get a colorblind-aware hex string color (e.g. '#2ECC71').
 * Falls back to the provided fallback or the standard color.
 */
export function uiColor(scene: Phaser.Scene, name: UIColorName): string {
  const settings = getSettings(scene);
  return settings.colorblindMode ? CB_COLORS_HEX[name] : NORMAL_COLORS_HEX[name];
}

/**
 * Get a colorblind-aware numeric color (e.g. 0x2ECC71) for graphics fills.
 */
export function uiColorNum(scene: Phaser.Scene, name: UIColorName): number {
  const settings = getSettings(scene);
  return settings.colorblindMode ? COLORBLIND_PALETTE[name] : NORMAL_COLORS_NUM[name];
}

/**
 * Scale a font size string (e.g. '16px') by the text size setting.
 */
export function scaledFontSize(scene: Phaser.Scene, basePx: number): string {
  const settings = getSettings(scene);
  const mult = TEXT_SIZE_MULTIPLIERS[settings.textSize] ?? 1;
  return `${Math.round(basePx * mult)}px`;
}

/**
 * Create a fullscreen toggle button. Returns the text object.
 * Only shown when the Fullscreen API is available.
 */
export function createFullscreenButton(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Text | null {
  if (!document.fullscreenEnabled) return null;

  const label = () => document.fullscreenElement ? 'Exit Fullscreen' : '  Fullscreen  ';

  const btn = scene.add.text(x, y, label(), {
    fontFamily: 'Arial',
    fontSize: scaledFontSize(scene, 20),
    color: '#FFF',
    backgroundColor: '#566573',
    padding: { x: 16, y: 6 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#6C7A89' }));
  btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#566573' }));
  btn.on('pointerdown', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    // Update label after a brief delay for the state to change
    scene.time.delayedCall(100, () => {
      if (btn.active) btn.setText(label());
    });
  });

  return btn;
}
