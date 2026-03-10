import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LOW_STOCK_THRESHOLD } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { uiColor, scaledFontSize } from '../systems/UIUtils';

export class FranchiseScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'FranchiseScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelX = GAME_WIDTH / 2 - 380;
    const panelY = 20;
    const panelW = 760;
    const panelH = 680;

    const panel = this.add.graphics();
    panel.fillStyle(0x1A2530, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);
    panel.lineStyle(2, 0x3498DB);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    this.add.text(GAME_WIDTH / 2, panelY + 25, 'Franchise Overview', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 28), color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Aggregate stats bar
    const stats = this.gameState.getFranchiseStats();
    const statsY = panelY + 60;
    const statsStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#BDC3C7' };

    const consistency = this.gameState.getBrandConsistency();
    const consistencyLabel = consistency.score === 1 ? '✓ Consistent'
      : consistency.score > 0 ? '~ Partial' : '✗ Inconsistent';
    const consistencyColor = consistency.score === 1 ? uiColor(this, 'green')
      : consistency.score > 0 ? uiColor(this, 'yellow') : uiColor(this, 'red');

    this.add.text(panelX + 30, statsY,
      `Locations: ${stats.locationCount}  |  Total Staff: ${stats.totalStaff}  |  Avg Reputation: ${stats.totalReputation.toFixed(1)}★`,
      statsStyle
    );

    // Brand consistency indicator
    if (stats.locationCount > 1) {
      const brandY = statsY + 20;
      const details: string[] = [];
      if (!consistency.decor) details.push('Decor');
      if (!consistency.seating) details.push('Seating');
      if (!consistency.signage) details.push('Signage');
      const detailStr = details.length > 0 ? ` (mismatched: ${details.join(', ')})` : ' (+0.06★/day bonus)';
      this.add.text(panelX + 30, brandY, `Brand: ${consistencyLabel}${detailStr}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: consistencyColor,
      });
    }

    // Season targets
    const seasonDef = this.gameState.getSeasonDef();
    if (seasonDef?.locationTarget) {
      const targetMet = stats.locationCount >= seasonDef.locationTarget;
      this.add.text(panelX + panelW - 30, statsY,
        `Target: ${stats.locationCount}/${seasonDef.locationTarget} locations`,
        { ...statsStyle, color: targetMet ? uiColor(this, 'green') : uiColor(this, 'yellow') }
      ).setOrigin(1, 0);
    }

    // Content area
    this.contentContainer = this.add.container(0, 0);
    const gridStartY = stats.locationCount > 1 ? panelY + 110 : panelY + 90;
    this.buildLocationGrid(panelX, gridStartY, panelW);

    // New location button
    if (seasonDef?.locationSetupCost) {
      const cost = seasonDef.locationSetupCost;
      const canAfford = this.gameState.loc.money >= cost;
      const newLocBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 80, `+ Open New Location ($${cost})`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
        backgroundColor: canAfford ? '#27AE60' : '#7F8C8D',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      newLocBtn.on('pointerdown', () => {
        if (this.gameState.loc.money >= cost) {
          const locationNames = ['Beach Town', 'City Center', 'Mall Plaza', 'University District', 'Waterfront'];
          const usedNames = new Set(this.gameState.locations.map(l => l.name));
          const name = locationNames.find(n => !usedNames.has(n)) ?? `Location ${this.gameState.locations.length + 1}`;
          const newLoc = this.gameState.addLocation(name, cost);
          if (newLoc) {
            this.scene.restart();
          }
        } else {
          newLocBtn.setStyle({ backgroundColor: '#C0392B' });
          this.time.delayedCall(300, () => newLocBtn.setStyle({ backgroundColor: '#7F8C8D' }));
        }
      });
    }

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, '← Back', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
      backgroundColor: '#E74C3C', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeScene());
    this.input.keyboard!.on('keydown-ESC', () => this.closeScene());
  }

  private closeScene(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }

  private buildLocationGrid(panelX: number, startY: number, panelW: number): void {
    const locations = this.gameState.locations;
    const cardW = panelW - 60;
    const cardH = 100;
    const gap = 10;

    locations.forEach((loc, i) => {
      const y = startY + i * (cardH + gap);
      const isActive = i === this.gameState.currentLocationId;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(isActive ? 0x2C3E50 : 0x1E2D3D, 1);
      card.fillRoundedRect(panelX + 30, y, cardW, cardH, 10);
      if (isActive) {
        card.lineStyle(2, 0x3498DB);
        card.strokeRoundedRect(panelX + 30, y, cardW, cardH, 10);
      }
      this.contentContainer.add(card);

      // Location name + active badge
      const nameLabel = isActive ? `📍 ${loc.name} (Active)` : loc.name;
      this.contentContainer.add(
        this.add.text(panelX + 45, y + 10, nameLabel, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: isActive ? '#3498DB' : '#FFF', fontStyle: 'bold',
        })
      );

      // Stats row 1: money, revenue, expenses
      const row1Y = y + 38;
      const statStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#BDC3C7' };
      this.contentContainer.add(
        this.add.text(panelX + 45, row1Y,
          `Balance: $${loc.money.toFixed(0)}  |  Revenue: $${loc.dailyRevenue.toFixed(0)}  |  Expenses: $${loc.dailyExpenses.toFixed(0)}`,
          statStyle
        )
      );

      // Stats row 2: reputation, staff, equipment
      const row2Y = y + 58;
      const repStars = '★'.repeat(Math.round(loc.reputation)) + '☆'.repeat(5 - Math.round(loc.reputation));
      const staffCount = loc.staff.length;
      const equipCount = loc.equipment.filter(e => e.tier > 0).length;
      const brokenCount = loc.equipment.filter(e => e.broken).length;
      const brokenAlert = brokenCount > 0 ? ` (${brokenCount} broken!)` : '';

      this.contentContainer.add(
        this.add.text(panelX + 45, row2Y,
          `${repStars} (${loc.reputation.toFixed(1)})  |  Staff: ${staffCount}  |  Equipment: ${equipCount}${brokenAlert}`,
          { ...statStyle, color: brokenCount > 0 ? '#E74C3C' : '#BDC3C7' }
        )
      );

      // Alerts
      const alerts: string[] = [];
      if (loc.closureDaysRemaining > 0) alerts.push(`CLOSED (${loc.closureDaysRemaining}d)`);
      if (loc.loanAmount > 0) alerts.push(`Loan: $${loc.loanAmount.toFixed(0)}`);
      const lowStock = loc.ingredients.filter(ing => ing.quantity < LOW_STOCK_THRESHOLD).length;
      if (lowStock > 0) alerts.push(`${lowStock} low stock`);

      if (alerts.length > 0) {
        this.contentContainer.add(
          this.add.text(panelX + 45, y + 78, `⚠ ${alerts.join('  •  ')}`, {
            fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#F39C12',
          })
        );
      }

      // Switch button (only for non-active locations)
      if (!isActive) {
        const switchBtn = this.add.text(panelX + cardW - 10, y + 15, 'Switch →', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#FFF',
          backgroundColor: '#3498DB', padding: { x: 12, y: 6 },
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        switchBtn.on('pointerdown', () => {
          this.gameState.switchLocation(i);
          this.scene.restart();
        });
        this.contentContainer.add(switchBtn);

        // Transfer staff button: send one staff from active location to this one
        const activeLoc = this.gameState.locations[this.gameState.currentLocationId];
        if (activeLoc.staff.length > 1) {
          const transferBtn = this.add.text(panelX + cardW - 10, y + 55, 'Send Staff →', {
            fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#FFF',
            backgroundColor: '#8E44AD', padding: { x: 10, y: 4 },
          }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

          transferBtn.on('pointerdown', () => {
            // Transfer the first unassigned (or last) staff member
            const candidate = activeLoc.staff.find(s => !s.assigned) ?? activeLoc.staff[activeLoc.staff.length - 1];
            if (candidate && this.gameState.transferStaff(candidate.id, this.gameState.currentLocationId, i)) {
              this.scene.restart();
            }
          });
          this.contentContainer.add(transferBtn);
        }
      }
    });
  }
}
