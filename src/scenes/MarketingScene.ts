import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, CAMPAIGN_CATALOG, CampaignId } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';

export class MarketingScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: 'MarketingScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 600;
    const panelH = 500;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    this.add.text(GAME_WIDTH / 2, panelY + 25, 'Marketing Campaigns', {
      fontFamily: 'Arial', fontSize: '26px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Balance
    this.add.text(GAME_WIDTH / 2, panelY + 60, `Balance: $${this.gameState.money.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: '16px', color: '#2ECC40',
    }).setOrigin(0.5, 0);

    // Campaign cards
    let y = panelY + 100;
    for (const def of CAMPAIGN_CATALOG) {
      this.createCampaignCard(panelX + 30, y, panelW - 60, def.id);
      y += 110;
    }

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 40, '← Back', {
      fontFamily: 'Arial', fontSize: '20px', color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });

    // ESC to go back
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });
  }

  private createCampaignCard(x: number, y: number, width: number, campaignId: CampaignId): void {
    const def = CAMPAIGN_CATALOG.find(c => c.id === campaignId)!;
    const active = this.gameState.activeCampaigns.find(c => c.id === campaignId);
    const canAfford = this.gameState.money >= def.cost;
    const isActive = !!active;

    // Card background
    const card = this.add.graphics();
    const bgColor = isActive ? 0x1A5276 : 0x34495E;
    card.fillStyle(bgColor, 1);
    card.fillRoundedRect(x, y, width, 95, 8);

    if (isActive) {
      card.lineStyle(2, 0x3498DB);
      card.strokeRoundedRect(x, y, width, 95, 8);
    }

    // Icon + name
    this.add.text(x + 15, y + 10, `${def.icon} ${def.name}`, {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFF', fontStyle: 'bold',
    });

    // Description
    this.add.text(x + 15, y + 35, def.description, {
      fontFamily: 'Arial', fontSize: '13px', color: '#BDC3C7',
      wordWrap: { width: width - 170 },
    });

    // Effects summary
    const effectParts: string[] = [];
    if (def.effects.customerSpawnMult !== undefined && def.effects.customerSpawnMult < 1) {
      const pct = Math.round((1 - def.effects.customerSpawnMult) * 100);
      effectParts.push(`+${pct}% customers`);
    }
    if (def.effects.reputationBonus) {
      effectParts.push(`+${def.effects.reputationBonus} rep/day`);
    }
    if (def.effects.tipBonus) {
      effectParts.push(`+${Math.round(def.effects.tipBonus * 100)}% tips`);
    }

    this.add.text(x + 15, y + 65, effectParts.join(' | '), {
      fontFamily: 'Arial', fontSize: '11px', color: '#7FDBFF',
    });

    // Duration
    this.add.text(x + 15, y + 78, `Duration: ${def.durationDays} days`, {
      fontFamily: 'Arial', fontSize: '11px', color: '#95A5A6',
    });

    // Right side: cost/status + button
    if (isActive) {
      this.add.text(x + width - 15, y + 15, 'ACTIVE', {
        fontFamily: 'Arial', fontSize: '14px', color: '#2ECC71', fontStyle: 'bold',
      }).setOrigin(1, 0);

      this.add.text(x + width - 15, y + 40, `${active!.daysRemaining} days left`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#BDC3C7',
      }).setOrigin(1, 0);
    } else {
      const btnColor = canAfford ? '#27AE60' : '#7F8C8D';
      const btn = this.add.text(x + width - 15, y + 20, `$${def.cost}`, {
        fontFamily: 'Arial', fontSize: '18px', color: '#FFF',
        backgroundColor: btnColor, padding: { x: 12, y: 6 },
      }).setOrigin(1, 0);

      if (canAfford) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          if (this.gameState.launchCampaign(campaignId)) {
            // Refresh the scene to show updated state
            this.scene.restart();
          }
        });
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2ECC71' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#27AE60' }));
      }
    }
  }
}
