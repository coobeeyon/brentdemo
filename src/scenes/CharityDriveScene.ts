import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { scaledFontSize } from '../systems/UIUtils';
import { getAudioManager } from '../systems/AudioManager';

interface DonationTier {
  label: string;
  percent: number;
  repBonus: number;
  description: string;
  color: number;
}

const DONATION_TIERS: DonationTier[] = [
  {
    label: '10%',
    percent: 0.10,
    repBonus: 0.15,
    description: 'Small but meaningful contribution',
    color: 0x3498DB,
  },
  {
    label: '25%',
    percent: 0.25,
    repBonus: 0.30,
    description: 'Generous donation — the community notices!',
    color: 0x27AE60,
  },
  {
    label: '50%',
    percent: 0.50,
    repBonus: 0.50,
    description: 'Incredible generosity — you\'re a local hero!',
    color: 0xF1C40F,
  },
];

export class CharityDriveScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: 'CharityDriveScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 500;
    const panelH = 420;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 15);
    panel.lineStyle(3, 0xE74C3C);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 15);

    // Title
    this.add.text(cx, cy - panelH / 2 + 30, '💝 Charity Drive', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 28),
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Description
    this.add.text(cx, cy - panelH / 2 + 70, 'A local charity is asking for donations.\nChoose how much of today\'s revenue to donate:', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 15),
      color: '#BDC3C7',
      align: 'center',
    }).setOrigin(0.5);

    // Yesterday's revenue as estimate reference
    const lastDayRevenue = this.getLastDayRevenue();
    if (lastDayRevenue > 0) {
      this.add.text(cx, cy - panelH / 2 + 110, `(Yesterday's revenue: $${lastDayRevenue.toFixed(2)})`, {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 13),
        color: '#7F8C8D',
      }).setOrigin(0.5);
    }

    // Donation tier buttons
    let btnY = cy - 50;
    for (const tier of DONATION_TIERS) {
      this.createTierButton(cx, btnY, tier, panelW - 80);
      btnY += 75;
    }

    // Decline button
    const declineBtn = this.add.text(cx, cy + panelH / 2 - 40, 'Decline — No Donation', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 16),
      color: '#95A5A6',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    declineBtn.on('pointerover', () => declineBtn.setColor('#E74C3C'));
    declineBtn.on('pointerout', () => declineBtn.setColor('#95A5A6'));
    declineBtn.on('pointerdown', () => {
      // No donation — clear any previous donation data
      this.registry.set('charityDonationPercent', 0);
      this.registry.set('charityRepBonus', 0);
      this.closeScene();
    });
  }

  private createTierButton(x: number, y: number, tier: DonationTier, width: number): void {
    const btnH = 60;
    const bg = this.add.graphics();
    bg.fillStyle(tier.color, 0.2);
    bg.fillRoundedRect(x - width / 2, y - btnH / 2, width, btnH, 8);
    bg.lineStyle(2, tier.color, 0.6);
    bg.strokeRoundedRect(x - width / 2, y - btnH / 2, width, btnH, 8);

    // Donate label
    this.add.text(x - width / 2 + 20, y - 12, `Donate ${tier.label}`, {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 20),
      color: '#FFF',
      fontStyle: 'bold',
    });

    // Description
    this.add.text(x - width / 2 + 20, y + 10, tier.description, {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 12),
      color: '#BDC3C7',
    });

    // Rep bonus on right
    this.add.text(x + width / 2 - 20, y - 5, `+${tier.repBonus.toFixed(2)} ★`, {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 18),
      color: '#F1C40F',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // Estimated donation amount
    const lastRev = this.getLastDayRevenue();
    if (lastRev > 0) {
      this.add.text(x + width / 2 - 20, y + 14, `~$${(lastRev * tier.percent).toFixed(2)}`, {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 12),
        color: '#7F8C8D',
      }).setOrigin(1, 0.5);
    }

    // Hit zone
    const hitZone = this.add.zone(x, y, width, btnH).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(tier.color, 0.4);
      bg.fillRoundedRect(x - width / 2, y - btnH / 2, width, btnH, 8);
      bg.lineStyle(2, tier.color, 1);
      bg.strokeRoundedRect(x - width / 2, y - btnH / 2, width, btnH, 8);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(tier.color, 0.2);
      bg.fillRoundedRect(x - width / 2, y - btnH / 2, width, btnH, 8);
      bg.lineStyle(2, tier.color, 0.6);
      bg.strokeRoundedRect(x - width / 2, y - btnH / 2, width, btnH, 8);
    });

    hitZone.on('pointerdown', () => {
      getAudioManager(this).purchase();
      this.registry.set('charityDonationPercent', tier.percent);
      this.registry.set('charityRepBonus', tier.repBonus);
      this.closeScene();
    });
  }

  private getLastDayRevenue(): number {
    const reports = this.gameState.loc.dayReports;
    if (reports.length === 0) return 0;
    return reports[reports.length - 1].revenue ?? 0;
  }

  private closeScene(): void {
    this.scene.stop();
    this.scene.resume('GameplayScene');
  }
}
