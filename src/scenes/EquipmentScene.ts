import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, EQUIPMENT_CATALOG, EquipmentDef, EquipmentId, EquipmentEffects } from '../config/constants';
import { GameState, getGameState, OwnedEquipment } from '../systems/GameState';

export class EquipmentScene extends Phaser.Scene {
  private gameState!: GameState;
  private moneyText!: Phaser.GameObjects.Text;
  private maintenanceText!: Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'EquipmentScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelX = GAME_WIDTH / 2 - 340;
    const panelY = 30;
    const panelW = 680;
    const panelH = 640;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    const titleSuffix = this.gameState.franchiseMode ? ` — ${this.gameState.locationName}` : '';
    this.add.text(GAME_WIDTH / 2, panelY + 25, `Equipment & Upgrades${titleSuffix}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFF',
    }).setOrigin(0.5);

    // Balance display
    this.moneyText = this.add.text(GAME_WIDTH / 2 - 120, panelY + 60, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#2ECC40',
    }).setOrigin(0, 0.5);

    this.maintenanceText = this.add.text(GAME_WIDTH / 2 + 120, panelY + 60, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#E67E22',
    }).setOrigin(1, 0.5);

    // Scrollable content area
    this.contentContainer = this.add.container(0, 0);
    this.createEquipmentRows(panelX, panelY + 85);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, '← Back', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFF',
      backgroundColor: '#E74C3C',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeScene());

    this.input.keyboard!.on('keydown-ESC', () => this.closeScene());

    this.updateDisplay();
  }

  private closeScene(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }

  private createEquipmentRows(panelX: number, startY: number): void {
    EQUIPMENT_CATALOG.forEach((def, i) => {
      this.createEquipmentRow(def, i, panelX, startY);
    });
  }

  private createEquipmentRow(
    def: EquipmentDef,
    index: number,
    panelX: number,
    startY: number,
  ): void {
    const y = startY + index * 85;
    const rowW = 660;

    // Row background
    const rowBg = this.add.graphics();
    rowBg.fillStyle(index % 2 === 0 ? 0x34495E : 0x2C3E50, 1);
    rowBg.fillRect(panelX + 10, y, rowW, 78);
    this.contentContainer.add(rowBg);

    const owned = this.gameState.getEquipment(def.id);
    const currentTier = owned?.tier ?? 0;
    const nextTier = def.tiers.find(t => t.tier === currentTier + 1);
    const currentTierDef = def.tiers.find(t => t.tier === currentTier);

    // Equipment name and description
    this.contentContainer.add(
      this.add.text(panelX + 20, y + 8, def.name, {
        fontFamily: 'Arial', fontSize: '17px', color: '#FFF', fontStyle: 'bold',
      })
    );

    this.contentContainer.add(
      this.add.text(panelX + 20, y + 30, def.description, {
        fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6',
      })
    );

    // Current tier info
    const tierLabel = currentTier === 0 ? 'Not owned' : `Tier ${currentTier}: ${currentTierDef?.name ?? ''}`;
    const tierText = this.add.text(panelX + 20, y + 52, tierLabel, {
      fontFamily: 'Arial', fontSize: '13px', color: currentTier === 0 ? '#7F8C8D' : '#3498DB',
    });
    this.contentContainer.add(tierText);

    // Condition bar (only for owned equipment)
    if (owned && owned.tier > 0) {
      this.createConditionBar(panelX + 320, y + 50, owned);
    }

    // Repair button (if broken)
    if (owned?.broken) {
      const repairCost = this.getRepairCost(def.id);
      const repairBtn = this.add.text(panelX + 450, y + 48, `Repair $${repairCost}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#FFF',
        backgroundColor: '#E67E22', padding: { x: 8, y: 3 },
      }).setInteractive({ useHandCursor: true });

      repairBtn.on('pointerdown', () => {
        if (this.gameState.loc.money >= repairCost) {
          this.gameState.loc.money -= repairCost;
          this.gameState.loc.dailyExpenses += repairCost;
          owned.broken = false;
          owned.condition = 80;
          this.refreshUI();
        } else {
          this.flashRed(repairBtn);
        }
      });
      this.contentContainer.add(repairBtn);

      // Broken indicator
      this.contentContainer.add(
        this.add.text(panelX + 440, y + 10, 'BROKEN', {
          fontFamily: 'Arial', fontSize: '14px', color: '#E74C3C', fontStyle: 'bold',
        })
      );
    }

    // Upgrade/Buy button
    if (nextTier) {
      const researchFx = this.gameState.getResearchEffects();
      const discountedCost = Math.round(nextTier.cost * (1 - (researchFx.equipmentDiscount ?? 0)));
      const btnLabel = currentTier === 0 ? `Buy $${discountedCost}` : `Upgrade $${discountedCost}`;
      const upgradeBtn = this.add.text(panelX + rowW - 20, y + 15, btnLabel, {
        fontFamily: 'Arial', fontSize: '15px', color: '#FFF',
        backgroundColor: '#27AE60', padding: { x: 12, y: 5 },
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      upgradeBtn.on('pointerdown', () => {
        if (this.gameState.loc.money >= discountedCost) {
          this.purchaseUpgrade(def.id, nextTier.tier, discountedCost);
          this.refreshUI();
        } else {
          this.flashRed(upgradeBtn);
        }
      });

      // Next tier info tooltip
      const nextInfo = this.formatEffects(nextTier.effects);
      if (nextInfo) {
        this.contentContainer.add(
          this.add.text(panelX + rowW - 20, y + 50, `Next: ${nextTier.name} — ${nextInfo}`, {
            fontFamily: 'Arial', fontSize: '11px', color: '#7F8C8D',
          }).setOrigin(1, 0)
        );
      }

      this.contentContainer.add(upgradeBtn);
    } else if (currentTier > 0) {
      this.contentContainer.add(
        this.add.text(panelX + rowW - 20, y + 20, 'MAX TIER', {
          fontFamily: 'Arial', fontSize: '14px', color: '#F39C12', fontStyle: 'bold',
        }).setOrigin(1, 0)
      );
    }
  }

  private createConditionBar(x: number, y: number, owned: OwnedEquipment): void {
    const barW = 100;
    const barH = 10;

    const bg = this.add.graphics();
    bg.fillStyle(0x1A252F, 1);
    bg.fillRoundedRect(x, y, barW, barH, 3);
    this.contentContainer.add(bg);

    const ratio = owned.condition / 100;
    const color = ratio > 0.6 ? 0x2ECC71 : ratio > 0.3 ? 0xF39C12 : 0xE74C3C;
    const fill = this.add.graphics();
    fill.fillStyle(color, 1);
    fill.fillRoundedRect(x, y, barW * ratio, barH, 3);
    this.contentContainer.add(fill);

    this.contentContainer.add(
      this.add.text(x + barW + 5, y - 1, `${Math.round(owned.condition)}%`, {
        fontFamily: 'Arial', fontSize: '11px', color: '#95A5A6',
      })
    );
  }

  private purchaseUpgrade(equipmentId: EquipmentId, newTier: number, cost: number): void {
    this.gameState.loc.money -= cost;
    this.gameState.loc.dailyExpenses += cost;

    const existing = this.gameState.getEquipment(equipmentId);
    if (existing) {
      existing.tier = newTier;
      existing.condition = 100;
      existing.broken = false;
    } else {
      this.gameState.loc.equipment.push({
        id: equipmentId,
        tier: newTier,
        condition: 100,
        broken: false,
      });
    }
  }

  private getRepairCost(equipmentId: EquipmentId): number {
    const def = EQUIPMENT_CATALOG.find(e => e.id === equipmentId);
    if (!def) return 50;
    const owned = this.gameState.getEquipment(equipmentId);
    if (!owned) return 50;
    const tierDef = def.tiers.find(t => t.tier === owned.tier);
    // Repair costs 30% of the tier's purchase price, minimum $25
    return Math.max(25, Math.round((tierDef?.cost ?? 100) * 0.3));
  }

  private formatEffects(effects: EquipmentEffects): string {
    const parts: string[] = [];
    if (effects.serveSpeedMult !== undefined && effects.serveSpeedMult !== 1.0) {
      const pct = Math.round((1 - effects.serveSpeedMult) * 100);
      if (pct > 0) parts.push(`${pct}% faster`);
    }
    if (effects.capacityBonus) parts.push(`+${effects.capacityBonus} queue`);
    if (effects.qualityBonus) parts.push(`+${Math.round(effects.qualityBonus * 100)}% quality`);
    return parts.join(', ');
  }

  private flashRed(target: Phaser.GameObjects.Text): void {
    target.setStyle({ backgroundColor: '#C0392B' });
    this.time.delayedCall(300, () => target.setStyle({ backgroundColor: '#27AE60' }));
  }

  private refreshUI(): void {
    this.contentContainer.destroy();
    this.contentContainer = this.add.container(0, 0);
    this.createEquipmentRows(GAME_WIDTH / 2 - 340, 115);
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.moneyText.setText(`Balance: $${this.gameState.loc.money.toFixed(2)}`);
    this.maintenanceText.setText(`Maint: $${this.gameState.getMaintenanceCost()}/day`);
  }
}
