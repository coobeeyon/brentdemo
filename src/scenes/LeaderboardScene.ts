import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { CHALLENGE_CATALOG, ChallengeDef } from './ChallengeScene';
import { scaledFontSize } from '../systems/UIUtils';

interface ChallengeScore {
  challenge: ChallengeDef;
  bestRevenue: number;
  stars: number;
}

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1A1A2E, 0x1A1A2E, 0x16213E, 0x16213E, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 35, '🏆 Challenge Leaderboard', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 30), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Gather scores
    const scores: ChallengeScore[] = CHALLENGE_CATALOG.map(ch => {
      const bestRevenue = parseInt(localStorage.getItem(`challenge_best_${ch.id}`) ?? '0', 10);
      const stars = bestRevenue >= ch.revenueTargets[2] ? 3
        : bestRevenue >= ch.revenueTargets[1] ? 2
        : bestRevenue >= ch.revenueTargets[0] ? 1 : 0;
      return { challenge: ch, bestRevenue, stars };
    });

    // Summary stats
    const totalStars = scores.reduce((sum, s) => sum + s.stars, 0);
    const maxStars = scores.length * 3;
    const completedCount = scores.filter(s => s.stars > 0).length;
    const perfectedCount = scores.filter(s => s.stars === 3).length;

    // Summary bar
    const summaryY = 70;
    const summaryBg = this.add.graphics();
    summaryBg.fillStyle(0x0F3460, 0.8);
    summaryBg.fillRoundedRect(40, summaryY, GAME_WIDTH - 80, 50, 8);

    this.add.text(GAME_WIDTH / 2, summaryY + 25,
      `Total Stars: ${'★'.repeat(totalStars)}${'☆'.repeat(maxStars - totalStars)}  ${totalStars}/${maxStars}   |   Completed: ${completedCount}/${scores.length}   |   Perfected: ${perfectedCount}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F1C40F',
    }).setOrigin(0.5);

    // Table header
    const tableY = 140;
    const colX = { rank: 60, icon: 100, name: 140, days: 340, best: 440, stars: 580, target3: 720 };

    const headerStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#7F8C8D', fontStyle: 'bold' as const };
    this.add.text(colX.rank, tableY, '#', headerStyle);
    this.add.text(colX.name, tableY, 'Challenge', headerStyle);
    this.add.text(colX.days, tableY, 'Days', headerStyle);
    this.add.text(colX.best, tableY, 'Best Revenue', headerStyle);
    this.add.text(colX.stars, tableY, 'Stars', headerStyle);
    this.add.text(colX.target3, tableY, '3★ Target', headerStyle);

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x7F8C8D, 0.4);
    divider.lineBetween(50, tableY + 22, GAME_WIDTH - 50, tableY + 22);

    // Sort by stars desc, then best revenue desc
    const sorted = [...scores].sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.bestRevenue - a.bestRevenue;
    });

    // Rows
    const rowH = 48;
    sorted.forEach((entry, i) => {
      const y = tableY + 35 + i * rowH;
      const ch = entry.challenge;

      // Row background (alternating)
      const rowBg = this.add.graphics();
      if (i % 2 === 0) {
        rowBg.fillStyle(0x1A2744, 0.5);
        rowBg.fillRoundedRect(45, y - 5, GAME_WIDTH - 90, rowH - 4, 6);
      }

      // Rank badge
      const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
      const rankColor = i < 3 ? rankColors[i] : '#7F8C8D';
      this.add.text(colX.rank, y + 8, `${i + 1}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: rankColor, fontStyle: 'bold',
      });

      // Icon
      this.add.text(colX.icon, y + 6, ch.icon, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 20),
      });

      // Name
      this.add.text(colX.name, y + 8, ch.name, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#ECF0F1',
      });

      // Days
      this.add.text(colX.days, y + 8, `${ch.days}d`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#95A5A6',
      });

      // Best revenue
      const revColor = entry.bestRevenue > 0 ? '#2ECC71' : '#7F8C8D';
      this.add.text(colX.best, y + 8, entry.bestRevenue > 0 ? `$${entry.bestRevenue}` : '--', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: revColor, fontStyle: 'bold',
      });

      // Stars
      if (entry.stars > 0) {
        this.add.text(colX.stars, y + 6, '★'.repeat(entry.stars) + '☆'.repeat(3 - entry.stars), {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFD700',
        });
      } else {
        this.add.text(colX.stars, y + 8, 'Not attempted', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#555',
        });
      }

      // 3-star target
      this.add.text(colX.target3, y + 8, `$${ch.revenueTargets[2]}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#7F8C8D',
      });

      // Make row clickable to go to that challenge
      const hitArea = this.add.rectangle(GAME_WIDTH / 2, y + rowH / 2 - 5, GAME_WIDTH - 100, rowH - 4)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);

      hitArea.on('pointerover', () => {
        rowBg.clear();
        rowBg.fillStyle(0x2C3E50, 0.8);
        rowBg.fillRoundedRect(45, y - 5, GAME_WIDTH - 90, rowH - 4, 6);
      });

      hitArea.on('pointerout', () => {
        rowBg.clear();
        if (i % 2 === 0) {
          rowBg.fillStyle(0x1A2744, 0.5);
          rowBg.fillRoundedRect(45, y - 5, GAME_WIDTH - 90, rowH - 4, 6);
        }
      });

      hitArea.on('pointerdown', () => {
        this.scene.start('ChallengeScene');
      });
    });

    // Reset scores button
    const resetBtn = this.add.text(GAME_WIDTH - 30, GAME_HEIGHT - 40, 'Reset All Scores', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#E74C3C',
      backgroundColor: '#2C3E5088', padding: { x: 10, y: 5 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerdown', () => {
      this.showResetConfirm();
    });

    // Back button
    const backBtn = this.add.text(20, GAME_HEIGHT - 40, '← Back to Challenges', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#3498DB',
      backgroundColor: '#2C3E5088', padding: { x: 12, y: 6 },
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('ChallengeScene');
    });
  }

  private showResetConfirm(): void {
    const overlay = this.add.container(0, 0).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.add(bg);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(cx - 200, cy - 80, 400, 160, 12);
    panel.lineStyle(2, 0xE74C3C);
    panel.strokeRoundedRect(cx - 200, cy - 80, 400, 160, 12);
    overlay.add(panel);

    overlay.add(this.add.text(cx, cy - 45, 'Reset all challenge scores?', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5));

    overlay.add(this.add.text(cx, cy - 15, 'This cannot be undone.', {
      fontFamily: 'Arial', fontSize: '14px', color: '#E74C3C',
    }).setOrigin(0.5));

    const confirmBtn = this.add.text(cx - 70, cy + 35, 'Reset', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFF',
      backgroundColor: '#E74C3C', padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    overlay.add(confirmBtn);

    confirmBtn.on('pointerdown', () => {
      for (const ch of CHALLENGE_CATALOG) {
        localStorage.removeItem(`challenge_best_${ch.id}`);
      }
      overlay.destroy();
      this.scene.restart();
    });

    const cancelBtn = this.add.text(cx + 70, cy + 35, 'Cancel', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFF',
      backgroundColor: '#7F8C8D', padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    overlay.add(cancelBtn);

    cancelBtn.on('pointerdown', () => {
      overlay.destroy();
    });
  }
}
