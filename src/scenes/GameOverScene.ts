import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { scaledFontSize, uiColor } from '../systems/UIUtils';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const gameState = getGameState(this);
    const seasonDef = gameState.getSeasonDef();

    // Dark red gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1A0A0A, 0x1A0A0A, 0x2D0A0A, 0x1A0505, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Red border
    const border = this.add.graphics();
    border.lineStyle(3, 0xE74C3C, 0.6);
    border.strokeRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);

    // Title
    this.add.text(GAME_WIDTH / 2, 80, '💀', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 52),
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 140, 'Bankrupt', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 38), color: uiColor(this, 'red'), fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 180, 'Your ice cream empire has crumbled...', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#999',
    }).setOrigin(0.5);

    // Season info
    if (seasonDef) {
      this.add.text(GAME_WIDTH / 2, 225, `Failed during Season ${seasonDef.season}: ${seasonDef.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#BDC3C7',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 250, seasonDef.setting, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#7F8C8D',
      }).setOrigin(0.5);
    }

    // Stats panel
    const panelX = GAME_WIDTH / 2 - 220;
    const panelY = 285;
    const panelW = 440;
    const panelH = 180;

    const panel = this.add.graphics();
    panel.fillStyle(0x1C1C1C, 0.8);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    panel.lineStyle(1, 0xE74C3C, 0.3);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    this.add.text(GAME_WIDTH / 2, panelY + 20, 'Final Statistics', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#E74C3C', fontStyle: 'bold',
    }).setOrigin(0.5);

    const allReports = gameState.loc.dayReports;
    const totalServed = allReports.reduce((sum, r) => sum + r.customersServed, 0);
    const totalLost = allReports.reduce((sum, r) => sum + r.customersLost, 0);
    const totalDays = allReports.length;
    const finalBalance = gameState.franchiseMode && gameState.locations.length > 0
      ? gameState.locations.reduce((sum, loc) => sum + loc.money, 0)
      : gameState.loc.money;

    const leftX = panelX + 30;
    const rightX = GAME_WIDTH / 2 + 30;
    let y = panelY + 50;
    const lineH = 28;
    const labelStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#7F8C8D' };
    const valueStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#BDC3C7' };
    const redValueStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: uiColor(this, 'red') };

    this.add.text(leftX, y, 'Days Played:', labelStyle);
    this.add.text(leftX + 130, y, `${totalDays}`, valueStyle);
    this.add.text(rightX, y, 'Season Revenue:', labelStyle);
    this.add.text(rightX + 140, y, `$${gameState.seasonRevenue.toFixed(2)}`, valueStyle);
    y += lineH;

    this.add.text(leftX, y, 'Customers Served:', labelStyle);
    this.add.text(leftX + 130, y, `${totalServed}`, valueStyle);
    this.add.text(rightX, y, 'Customers Lost:', labelStyle);
    this.add.text(rightX + 140, y, `${totalLost}`, valueStyle);
    y += lineH;

    this.add.text(leftX, y, 'Final Balance:', labelStyle);
    this.add.text(leftX + 130, y, `$${finalBalance.toFixed(2)}`, redValueStyle);
    this.add.text(rightX, y, 'Reputation:', labelStyle);
    this.add.text(rightX + 140, y, `${gameState.loc.reputation.toFixed(1)}★`, valueStyle);
    y += lineH;

    if (seasonDef) {
      this.add.text(leftX, y, 'Revenue Target:', labelStyle);
      this.add.text(leftX + 130, y, `$${seasonDef.revenueTarget}`, { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#555' });
      this.add.text(rightX, y, 'Rep Target:', labelStyle);
      this.add.text(rightX + 140, y, `${seasonDef.reputationTarget}★`, { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#555' });
    }

    // Buttons
    const btnY = GAME_HEIGHT - 70;
    const menuBtn = this.add.text(GAME_WIDTH / 2, btnY, 'Return to Main Menu', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
      backgroundColor: '#C0392B', padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#E74C3C' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#C0392B' }));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
