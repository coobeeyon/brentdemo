import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DECOR_CATALOG, DecorThemeId } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';

export class DecorScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'DecorScene' });
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

    this.add.text(GAME_WIDTH / 2, panelY + 25, '🎨 Store Decor', {
      fontFamily: 'Arial', fontSize: '28px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    const currentDef = this.gameState.getDecorDef();
    this.add.text(GAME_WIDTH / 2, panelY + 60, `Current: ${currentDef.icon} ${currentDef.name} | Ambiance: ${currentDef.ambiance}/100`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#F1C40F',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2, panelY + 80, `Balance: $${this.gameState.money.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#2ECC40',
    }).setOrigin(0.5, 0);

    this.contentContainer = this.add.container(0, 0);
    this.renderThemes(panelX, panelY, panelW);

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

  private renderThemes(panelX: number, panelY: number, panelW: number): void {
    this.contentContainer.removeAll(true);
    let y = panelY + 105;

    for (const theme of DECOR_CATALOG) {
      const isOwned = this.gameState.unlockedDecor.includes(theme.id);
      const isCurrent = this.gameState.currentDecor === theme.id;
      const canAfford = this.gameState.money >= theme.cost;

      // Card background
      const cardBg = this.add.graphics();
      const borderColor = isCurrent ? 0xF1C40F : isOwned ? 0x2ECC71 : 0x34495E;
      cardBg.fillStyle(0x34495E, 1);
      cardBg.fillRoundedRect(panelX + 20, y, panelW - 40, 80, 8);
      cardBg.lineStyle(2, borderColor);
      cardBg.strokeRoundedRect(panelX + 20, y, panelW - 40, 80, 8);
      this.contentContainer.add(cardBg);

      // Theme icon + name
      const nameText = this.add.text(panelX + 35, y + 8, `${theme.icon} ${theme.name}`, {
        fontFamily: 'Arial', fontSize: '17px', color: '#FFF', fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      // Description
      const descText = this.add.text(panelX + 35, y + 30, theme.description, {
        fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6',
        wordWrap: { width: panelW - 200 },
      });
      this.contentContainer.add(descText);

      // Stats
      const statsText = this.add.text(panelX + 35, y + 52, `Ambiance: ${theme.ambiance} | Patience: +${Math.round((theme.patienceMult - 1) * 100)}% | Price tolerance: +${Math.round(theme.priceTolerance * 100)}%`, {
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
        btnText = `$${theme.cost}`;
        btnColor = '#E67E22';
      } else {
        btnText = `$${theme.cost}`;
        btnColor = '#7F8C8D';
        clickable = false;
      }

      const actionBtn = this.add.text(panelX + panelW - 45, y + 30, btnText, {
        fontFamily: 'Arial', fontSize: '15px', color: '#FFF',
        backgroundColor: btnColor, padding: { x: 10, y: 5 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: clickable });

      if (clickable) {
        actionBtn.on('pointerdown', () => {
          if (this.gameState.purchaseDecor(theme.id)) {
            // Refresh
            this.scene.restart();
          }
        });
      }
      this.contentContainer.add(actionBtn);

      y += 88;
    }
  }
}
