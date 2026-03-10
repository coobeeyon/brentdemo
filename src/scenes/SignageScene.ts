import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SIGNAGE_CATALOG, SignageId } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { scaledFontSize } from '../systems/UIUtils';

export class SignageScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'SignageScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 580;
    const panelH = 520;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    this.add.text(GAME_WIDTH / 2, panelY + 25, '🪧 Exterior Signage', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 28), color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    const currentDef = this.gameState.getSignageDef();
    const appealPct = Math.round((1 - currentDef.curbAppealMult) * 100);
    this.add.text(GAME_WIDTH / 2, panelY + 60, `Current: ${currentDef.icon} ${currentDef.name} | Curb Appeal: +${appealPct}% customers`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F1C40F',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2, panelY + 80, `Balance: $${this.gameState.loc.money.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#2ECC40',
    }).setOrigin(0.5, 0);

    this.contentContainer = this.add.container(0, 0);
    this.renderSignage(panelX, panelY, panelW);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, 'Close', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
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

  private renderSignage(panelX: number, panelY: number, panelW: number): void {
    this.contentContainer.removeAll(true);
    let y = panelY + 105;

    for (const sign of SIGNAGE_CATALOG) {
      const isOwned = this.gameState.loc.unlockedSignage.includes(sign.id);
      const isCurrent = this.gameState.loc.currentSignage === sign.id;
      const canAfford = this.gameState.loc.money >= sign.cost;

      const cardBg = this.add.graphics();
      const borderColor = isCurrent ? 0xF1C40F : isOwned ? 0x2ECC71 : 0x34495E;
      cardBg.fillStyle(0x34495E, 1);
      cardBg.fillRoundedRect(panelX + 20, y, panelW - 40, 72, 8);
      cardBg.lineStyle(2, borderColor);
      cardBg.strokeRoundedRect(panelX + 20, y, panelW - 40, 72, 8);
      this.contentContainer.add(cardBg);

      const nameText = this.add.text(panelX + 35, y + 8, `${sign.icon} ${sign.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 17), color: '#FFF', fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      const descText = this.add.text(panelX + 35, y + 28, sign.description, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#95A5A6',
        wordWrap: { width: panelW - 200 },
      });
      this.contentContainer.add(descText);

      const appealPct = Math.round((1 - sign.curbAppealMult) * 100);
      const statsText = this.add.text(panelX + 35, y + 50, `Curb Appeal: +${appealPct}% customers | Daily Rep: +${sign.dailyRepBonus.toFixed(2)}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#7FDBFF',
      });
      this.contentContainer.add(statsText);

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
        btnText = `$${sign.cost}`;
        btnColor = '#E67E22';
      } else {
        btnText = `$${sign.cost}`;
        btnColor = '#7F8C8D';
        clickable = false;
      }

      const actionBtn = this.add.text(panelX + panelW - 45, y + 28, btnText, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#FFF',
        backgroundColor: btnColor, padding: { x: 10, y: 5 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: clickable });

      if (clickable) {
        actionBtn.on('pointerdown', () => {
          if (this.gameState.purchaseSignage(sign.id)) {
            this.scene.restart();
          }
        });
      }
      this.contentContainer.add(actionBtn);

      y += 78;
    }
  }
}
