import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SEATING_CATALOG, MAX_QUEUE_LENGTH } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';

export class SeatingScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'SeatingScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 580;
    const panelH = 560;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    this.add.text(GAME_WIDTH / 2, panelY + 25, 'Seating Arrangement', {
      fontFamily: 'Arial', fontSize: '28px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    const currentDef = this.gameState.getSeatingDef();
    const eqEffects = this.gameState.getEquipmentEffects();
    const totalCapacity = MAX_QUEUE_LENGTH + (eqEffects.capacityBonus ?? 0) + currentDef.capacityBonus;
    this.add.text(GAME_WIDTH / 2, panelY + 60, `Current: ${currentDef.icon} ${currentDef.name} | Capacity: ${totalCapacity} customers`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#F1C40F',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2, panelY + 80, `Balance: $${this.gameState.loc.money.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#2ECC40',
    }).setOrigin(0.5, 0);

    this.contentContainer = this.add.container(0, 0);
    this.renderSeating(panelX, panelY, panelW);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, 'Close', {
      fontFamily: 'Arial', fontSize: '20px', color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });
  }

  private renderSeating(panelX: number, panelY: number, panelW: number): void {
    this.contentContainer.removeAll(true);
    let y = panelY + 105;

    for (const seating of SEATING_CATALOG) {
      const isOwned = this.gameState.loc.unlockedSeating.includes(seating.id);
      const isCurrent = this.gameState.loc.currentSeating === seating.id;
      const canAfford = this.gameState.loc.money >= seating.cost;

      // Card background
      const cardBg = this.add.graphics();
      const borderColor = isCurrent ? 0xF1C40F : isOwned ? 0x2ECC71 : 0x34495E;
      cardBg.fillStyle(0x34495E, 1);
      cardBg.fillRoundedRect(panelX + 20, y, panelW - 40, 80, 8);
      cardBg.lineStyle(2, borderColor);
      cardBg.strokeRoundedRect(panelX + 20, y, panelW - 40, 80, 8);
      this.contentContainer.add(cardBg);

      // Icon + name
      const nameText = this.add.text(panelX + 35, y + 8, `${seating.icon} ${seating.name}`, {
        fontFamily: 'Arial', fontSize: '17px', color: '#FFF', fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      // Description
      const descText = this.add.text(panelX + 35, y + 30, seating.description, {
        fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6',
        wordWrap: { width: panelW - 200 },
      });
      this.contentContainer.add(descText);

      // Stats
      const stats: string[] = [];
      if (seating.capacityBonus > 0) stats.push(`Capacity: +${seating.capacityBonus}`);
      if (seating.ambianceBonus > 0) stats.push(`Ambiance: +${seating.ambianceBonus}`);
      if (seating.patienceMult > 1) stats.push(`Patience: +${Math.round((seating.patienceMult - 1) * 100)}%`);
      const statsStr = stats.length > 0 ? stats.join(' | ') : 'No bonuses';

      const statsText = this.add.text(panelX + 35, y + 52, statsStr, {
        fontFamily: 'Arial', fontSize: '11px', color: '#7FDBFF',
      });
      this.contentContainer.add(statsText);

      // Action button
      let btnText: string;
      let btnColor: string;
      let clickable = true;

      if (isCurrent) {
        btnText = 'Active';
        btnColor = '#7F8C8D';
        clickable = false;
      } else if (isOwned) {
        btnText = 'Apply';
        btnColor = '#2ECC71';
      } else if (canAfford) {
        btnText = `$${seating.cost}`;
        btnColor = '#E67E22';
      } else {
        btnText = `$${seating.cost}`;
        btnColor = '#7F8C8D';
        clickable = false;
      }

      const actionBtn = this.add.text(panelX + panelW - 45, y + 30, btnText, {
        fontFamily: 'Arial', fontSize: '15px', color: '#FFF',
        backgroundColor: btnColor, padding: { x: 10, y: 5 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: clickable });

      if (clickable) {
        actionBtn.on('pointerdown', () => {
          if (this.gameState.purchaseSeating(seating.id)) {
            this.scene.restart();
          }
        });
      }
      this.contentContainer.add(actionBtn);

      y += 88;
    }
  }
}
