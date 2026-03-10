import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SEASON_CATALOG } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { scaledFontSize, uiColor } from '../systems/UIUtils';
import { getAudioManager } from '../systems/AudioManager';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(): void {
    getAudioManager(this).victory();
    const gameState = getGameState(this);
    const partial = this.registry.get('partialVictory') === true;
    // Clear the flag so it doesn't persist
    this.registry.remove('partialVictory');

    const accentColor = partial ? '#C0C0C0' : '#FFD700';
    const accentHex = partial ? 0xC0C0C0 : 0xFFD700;

    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0D1B2A, 0x0D1B2A, 0x1B2838, 0x2C3E50, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative border
    const border = this.add.graphics();
    border.lineStyle(4, accentHex, 0.8);
    border.strokeRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);

    // Icon and title
    const icon = partial ? '🏅' : '🏆';
    this.add.text(GAME_WIDTH / 2, 55, icon, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 48),
    }).setOrigin(0.5);

    const titleText = partial ? 'Journey Complete — Partial Success' : 'Ice Cream Empire Complete!';
    this.add.text(GAME_WIDTH / 2, 105, titleText, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, partial ? 28 : 32), color: accentColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitleText = partial
      ? 'You finished all 5 seasons but fell short of the final targets.'
      : 'You conquered all 5 seasons and built an ice cream empire!';
    this.add.text(GAME_WIDTH / 2, 140, subtitleText, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#BDC3C7',
      wordWrap: { width: GAME_WIDTH - 120 },
    }).setOrigin(0.5);

    // Season recap
    const recapY = 180;
    this.add.text(GAME_WIDTH / 2, recapY, 'Your Journey', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: partial ? '#BDC3C7' : '#F1C40F', fontStyle: 'bold',
    }).setOrigin(0.5);

    const divider = this.add.graphics();
    divider.lineStyle(1, accentHex, 0.3);
    divider.lineBetween(200, recapY + 22, GAME_WIDTH - 200, recapY + 22);

    const seasonIcons = ['🏪', '🏖️', '🏙️', '🏨', '🏢'];
    const rowH = 60;
    // The last season (index 4) is incomplete if partial
    const currentSeason = gameState.season;
    SEASON_CATALOG.forEach((sd, i) => {
      const y = recapY + 40 + i * rowH;

      // Row background
      if (i % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x1A2744, 0.4);
        rowBg.fillRoundedRect(80, y - 5, GAME_WIDTH - 160, rowH - 8, 6);
      }

      // Icon
      this.add.text(100, y + 10, seasonIcons[i], {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 22),
      });

      // Season name and setting
      this.add.text(140, y + 4, `Season ${sd.season}: ${sd.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#ECF0F1', fontStyle: 'bold',
      });
      this.add.text(140, y + 26, sd.setting, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#7F8C8D',
      });

      // Targets
      this.add.text(500, y + 4, `Revenue: $${sd.revenueTarget}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#95A5A6',
      });
      this.add.text(500, y + 24, `Reputation: ${sd.reputationTarget}★`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#95A5A6',
      });

      // Status — if partial and this is the current (last) season, show missed
      const isFinalSeason = sd.season === currentSeason;
      if (partial && isFinalSeason) {
        const missColor = uiColor(this, 'yellow');
        this.add.text(GAME_WIDTH - 120, y + 12, '⚠️ Missed', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: missColor,
        });
      } else {
        const checkColor = uiColor(this, 'green');
        this.add.text(GAME_WIDTH - 120, y + 12, '✅ Complete', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: checkColor,
        });
      }
    });

    // Career stats
    const statsY = recapY + 40 + SEASON_CATALOG.length * rowH + 10;
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0F3460, 0.6);
    statsBg.fillRoundedRect(80, statsY, GAME_WIDTH - 160, 70, 8);
    statsBg.lineStyle(1, accentHex, 0.3);
    statsBg.strokeRoundedRect(80, statsY, GAME_WIDTH - 160, 70, 8);

    // Gather aggregate stats from day reports (all locations in franchise mode)
    const allReports = gameState.franchiseMode && gameState.locations.length > 0
      ? gameState.locations.flatMap(loc => loc.dayReports)
      : gameState.loc.dayReports;
    const totalServed = allReports.reduce((sum, r) => sum + r.customersServed, 0);
    const totalLost = allReports.reduce((sum, r) => sum + r.customersLost, 0);
    const totalDays = gameState.franchiseMode && gameState.locations.length > 0
      ? Math.max(...gameState.locations.map(loc => loc.dayReports.length))
      : gameState.loc.dayReports.length;
    const finalBalance = gameState.franchiseMode && gameState.locations.length > 0
      ? gameState.locations.reduce((sum, loc) => sum + loc.money, 0)
      : gameState.loc.money;

    const statsLine1 = `Days Played: ${totalDays}    |    Customers Served: ${totalServed}    |    Customers Lost: ${totalLost}`;
    const avgReputation = gameState.franchiseMode && gameState.locations.length > 0
      ? gameState.locations.reduce((sum, loc) => sum + loc.reputation, 0) / gameState.locations.length
      : gameState.loc.reputation;
    const statsLine2 = `Final Balance: $${finalBalance.toFixed(2)}    |    Locations: ${gameState.franchiseMode ? gameState.locations.length : 1}    |    Final Reputation: ${avgReputation.toFixed(1)}★`;

    this.add.text(GAME_WIDTH / 2, statsY + 22, statsLine1, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#BDC3C7',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, statsY + 46, statsLine2, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#BDC3C7',
    }).setOrigin(0.5);

    // Main menu button — gold for full victory, silver for partial
    const btnY = GAME_HEIGHT - 55;
    const btnColor = partial ? '#6E7B8B' : '#B8860B';
    const btnHover = partial ? '#8B9DAF' : '#DAA520';
    const menuBtn = this.add.text(GAME_WIDTH / 2, btnY, 'Return to Main Menu', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
      backgroundColor: btnColor, padding: { x: 28, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: btnHover }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: btnColor }));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    // Sparkles (fewer and more subdued for partial)
    this.createSparkles(partial);
  }

  private createSparkles(subdued: boolean): void {
    const sparkleChars = subdued ? ['✨', '⭐'] : ['✨', '⭐', '🌟'];
    const count = subdued ? 6 : 12;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(30, GAME_HEIGHT - 30);
      const sparkle = this.add.text(x, y, Phaser.Utils.Array.GetRandom(sparkleChars), {
        fontFamily: 'Arial', fontSize: `${Phaser.Math.Between(12, 22)}px`,
      }).setAlpha(0);

      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: subdued ? 0.4 : 0.7 },
        y: y - 20,
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 4000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
