import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getGameState } from '../systems/GameState';
import { scaledFontSize } from '../systems/UIUtils';

export interface ChallengeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Number of days the challenge lasts */
  days: number;
  /** Starting money override */
  startingMoney: number;
  /** Revenue target to earn stars */
  revenueTargets: [number, number, number]; // 1-star, 2-star, 3-star
  /** Constraints applied to the challenge */
  constraints: ChallengeConstraints;
}

export interface ChallengeConstraints {
  /** Only these flavors are available (ids). If empty, all starters. */
  allowedFlavors?: string[];
  /** Maximum staff allowed */
  maxStaff?: number;
  /** Starting ingredient quantities override */
  limitedIngredients?: boolean;
  /** Equipment disabled */
  noEquipmentUpgrades?: boolean;
  /** All customers are this type */
  forcedCustomerType?: string;
  /** Weather forced */
  forcedWeather?: string;
  /** Price cap on menu items */
  maxPrice?: number;
  /** Faster customer patience decay multiplier */
  patienceMultiplier?: number;
}

export const CHALLENGE_CATALOG: ChallengeDef[] = [
  {
    id: 'rush_hour',
    name: 'Rush Hour',
    icon: '⏰',
    description: 'Massive customer rush! Serve as many as you can in 3 days with basic equipment.',
    days: 3,
    startingMoney: 300,
    revenueTargets: [150, 300, 500],
    constraints: {
      noEquipmentUpgrades: true,
      patienceMultiplier: 0.7,
    },
  },
  {
    id: 'budget_crunch',
    name: 'Budget Crunch',
    icon: '💸',
    description: 'Start with only $100 and limited ingredients. Make every scoop count!',
    days: 5,
    startingMoney: 100,
    revenueTargets: [200, 400, 700],
    constraints: {
      limitedIngredients: true,
      maxStaff: 1,
    },
  },
  {
    id: 'vanilla_only',
    name: 'Vanilla Challenge',
    icon: '🍦',
    description: 'Only vanilla allowed! Can you thrive with a single flavor for 3 days?',
    days: 3,
    startingMoney: 200,
    revenueTargets: [100, 250, 400],
    constraints: {
      allowedFlavors: ['vanilla'],
    },
  },
  {
    id: 'vip_treatment',
    name: 'VIP Reception',
    icon: '⭐',
    description: 'A parade of VIPs — impatient and demanding. Impress them all for top scores.',
    days: 3,
    startingMoney: 500,
    revenueTargets: [300, 600, 1000],
    constraints: {
      forcedCustomerType: 'vip',
      patienceMultiplier: 0.6,
    },
  },
  {
    id: 'heat_wave',
    name: 'Heatwave Hustle',
    icon: '🔥',
    description: 'Scorching heat means huge demand but ingredients spoil fast!',
    days: 3,
    startingMoney: 400,
    revenueTargets: [250, 500, 800],
    constraints: {
      forcedWeather: 'hot',
      patienceMultiplier: 0.8,
    },
  },
  {
    id: 'penny_pincher',
    name: 'Penny Pincher',
    icon: '🪙',
    description: 'Prices capped at $2.00 per item. Volume is key!',
    days: 5,
    startingMoney: 300,
    revenueTargets: [200, 400, 650],
    constraints: {
      maxPrice: 2.0,
    },
  },
];

/**
 * Get the index of today's daily challenge, rotating deterministically by date.
 * All players get the same daily challenge on the same day.
 */
export function getDailyChallengeIndex(): number {
  const now = new Date();
  // Use days since epoch as a simple deterministic seed
  const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % CHALLENGE_CATALOG.length;
}

/** Get today's daily challenge */
export function getDailyChallenge(): ChallengeDef {
  return CHALLENGE_CATALOG[getDailyChallengeIndex()];
}

export class ChallengeScene extends Phaser.Scene {
  private selectedChallenge: ChallengeDef | null = null;

  constructor() {
    super({ key: 'ChallengeScene' });
  }

  create(): void {
    this.selectedChallenge = null;
    const dailyChallenge = getDailyChallenge();

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2C3E50, 0x2C3E50, 0x1A252F, 0x1A252F, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 30, '🏆 Challenge Mode', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 32), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Daily challenge banner
    const bannerY = 65;
    const bannerH = 44;
    const bannerG = this.add.graphics();
    bannerG.fillStyle(0xF39C12, 0.15);
    bannerG.fillRoundedRect(40, bannerY, GAME_WIDTH - 80, bannerH, 8);
    bannerG.lineStyle(2, 0xF1C40F, 0.6);
    bannerG.strokeRoundedRect(40, bannerY, GAME_WIDTH - 80, bannerH, 8);

    this.add.text(GAME_WIDTH / 2, bannerY + bannerH / 2,
      `📅 Daily Challenge: ${dailyChallenge.icon} ${dailyChallenge.name} — play it for bonus bragging rights!`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F1C40F',
    }).setOrigin(0.5);

    // Challenge cards in a grid
    const cols = 3;
    const cardW = 360;
    const cardH = 140;
    const gapX = 20;
    const gapY = 20;
    const startX = (GAME_WIDTH - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 130;

    CHALLENGE_CATALOG.forEach((ch, i) => {
      const isDaily = ch.id === dailyChallenge.id;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const card = this.add.container(x, y);

      const cardBg = this.add.graphics();
      const bgColor = isDaily ? 0x3D4F2F : 0x34495E;
      const borderColor = isDaily ? 0xF1C40F : 0x7F8C8D;
      cardBg.fillStyle(bgColor, 1);
      cardBg.fillRoundedRect(0, 0, cardW, cardH, 10);
      cardBg.lineStyle(isDaily ? 3 : 2, borderColor);
      cardBg.strokeRoundedRect(0, 0, cardW, cardH, 10);
      card.add(cardBg);

      const titlePrefix = isDaily ? '📅 ' : '';
      const title = this.add.text(15, 12, `${titlePrefix}${ch.icon} ${ch.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: isDaily ? '#F1C40F' : '#FFF', fontStyle: 'bold',
      });
      card.add(title);

      const desc = this.add.text(15, 38, ch.description, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#BDC3C7',
        wordWrap: { width: cardW - 30 }, lineSpacing: 2,
      });
      card.add(desc);

      const meta = this.add.text(15, cardH - 28, `${ch.days} days · $${ch.startingMoney} start · ★ $${ch.revenueTargets[0]}/$${ch.revenueTargets[1]}/$${ch.revenueTargets[2]}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#7F8C8D',
      });
      card.add(meta);

      // Load best score from localStorage
      const bestKey = `challenge_best_${ch.id}`;
      const bestScore = parseInt(localStorage.getItem(bestKey) ?? '0', 10);
      if (bestScore > 0) {
        const stars = bestScore >= ch.revenueTargets[2] ? 3 : bestScore >= ch.revenueTargets[1] ? 2 : 1;
        const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        const bestText = this.add.text(cardW - 15, 12, starText, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#FFD700',
        }).setOrigin(1, 0);
        card.add(bestText);
      }

      // Hit area
      const hitArea = this.add.rectangle(cardW / 2, cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      card.add(hitArea);

      hitArea.on('pointerover', () => {
        cardBg.clear();
        cardBg.fillStyle(isDaily ? 0x4A6038 : 0x3D566E, 1);
        cardBg.fillRoundedRect(0, 0, cardW, cardH, 10);
        cardBg.lineStyle(isDaily ? 3 : 2, 0xF1C40F);
        cardBg.strokeRoundedRect(0, 0, cardW, cardH, 10);
      });

      hitArea.on('pointerout', () => {
        if (this.selectedChallenge?.id !== ch.id) {
          cardBg.clear();
          cardBg.fillStyle(bgColor, 1);
          cardBg.fillRoundedRect(0, 0, cardW, cardH, 10);
          cardBg.lineStyle(isDaily ? 3 : 2, borderColor);
          cardBg.strokeRoundedRect(0, 0, cardW, cardH, 10);
        }
      });

      hitArea.on('pointerdown', () => {
        this.selectedChallenge = ch;
        this.showStartConfirm(ch);
      });
    });

    // Leaderboard button
    const lbBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '🏆 Leaderboard', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFD700',
      backgroundColor: '#2C3E5088', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    lbBtn.on('pointerdown', () => {
      this.scene.start('LeaderboardScene');
    });

    // Back button
    const backBtn = this.add.text(20, GAME_HEIGHT - 40, '← Back to Menu', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#E74C3C',
      backgroundColor: '#2C3E5088', padding: { x: 12, y: 6 },
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private showStartConfirm(ch: ChallengeDef): void {
    // Overlay
    const overlay = this.add.container(0, 0).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.add(bg);

    const panelW = 440;
    const panelH = 320;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 15);
    panel.lineStyle(3, 0xF1C40F);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 15);
    overlay.add(panel);

    overlay.add(this.add.text(cx, cy - panelH / 2 + 25, `${ch.icon} ${ch.name}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 24), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5));

    overlay.add(this.add.text(cx, cy - panelH / 2 + 60, ch.description, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#BDC3C7',
      wordWrap: { width: panelW - 60 },
    }).setOrigin(0.5));

    // Constraints list
    const constraintLines: string[] = [];
    const c = ch.constraints;
    if (c.allowedFlavors) constraintLines.push(`Flavors: ${c.allowedFlavors.join(', ')}`);
    if (c.maxStaff !== undefined) constraintLines.push(`Max staff: ${c.maxStaff}`);
    if (c.limitedIngredients) constraintLines.push('Limited starting ingredients');
    if (c.noEquipmentUpgrades) constraintLines.push('No equipment upgrades');
    if (c.forcedCustomerType) constraintLines.push(`Customers: ${c.forcedCustomerType} only`);
    if (c.forcedWeather) constraintLines.push(`Weather: ${c.forcedWeather}`);
    if (c.maxPrice) constraintLines.push(`Price cap: $${c.maxPrice.toFixed(2)}`);
    if (c.patienceMultiplier && c.patienceMultiplier < 1) constraintLines.push(`Patience: ${Math.round(c.patienceMultiplier * 100)}% of normal`);

    let y = cy - 20;
    overlay.add(this.add.text(cx - panelW / 2 + 30, y, 'Constraints:', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F39C12', fontStyle: 'bold',
    }));
    y += 22;

    for (const line of constraintLines) {
      overlay.add(this.add.text(cx - panelW / 2 + 40, y, `• ${line}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#95A5A6',
      }));
      y += 18;
    }

    if (constraintLines.length === 0) {
      overlay.add(this.add.text(cx - panelW / 2 + 40, y, '• No special constraints', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#95A5A6',
      }));
    }

    // Star targets
    y = cy + panelH / 2 - 100;
    overlay.add(this.add.text(cx, y, `★ $${ch.revenueTargets[0]}  ★★ $${ch.revenueTargets[1]}  ★★★ $${ch.revenueTargets[2]}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#FFD700',
    }).setOrigin(0.5));

    // Start button
    const startBtn = this.add.text(cx - 80, cy + panelH / 2 - 50, 'Start Challenge', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
      backgroundColor: '#27AE60', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    overlay.add(startBtn);

    startBtn.on('pointerdown', () => {
      overlay.destroy();
      this.launchChallenge(ch);
    });

    // Cancel button
    const cancelBtn = this.add.text(cx + 80, cy + panelH / 2 - 50, 'Cancel', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
      backgroundColor: '#7F8C8D', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    overlay.add(cancelBtn);

    cancelBtn.on('pointerdown', () => {
      overlay.destroy();
      this.selectedChallenge = null;
    });
  }

  private launchChallenge(ch: ChallengeDef): void {
    // Store challenge info in registry for GameplayScene to read
    this.registry.set('gameMode', 'challenge');
    this.registry.set('challengeDef', ch);
    this.registry.set('loadSave', false);

    // Set up game state with challenge constraints
    const gameState = getGameState(this);

    // Reset game state for challenge
    gameState.day = 1;
    gameState.season = 1;
    gameState.seasonDay = 1;
    gameState.seasonRevenue = 0;
    gameState.money = ch.startingMoney;
    gameState.reputation = 2.5;
    gameState.dayReports = [];
    gameState.totalCustomersServed = 0;
    gameState.totalRevenue = 0;
    gameState.activeCampaigns = [];
    gameState.loanAmount = 0;
    gameState.closureDaysRemaining = 0;
    gameState.recipes = [];
    gameState.loyalCustomers = [];
    gameState.staff = [];
    gameState.researchPoints = 0;
    gameState.unlockedResearch = new Set();
    gameState.completedMilestones = new Set();

    // Apply flavor constraints
    if (ch.constraints.allowedFlavors) {
      for (const flavor of gameState.flavors) {
        flavor.unlocked = ch.constraints.allowedFlavors.includes(flavor.id);
      }
    } else {
      // Reset to starters only
      for (const flavor of gameState.flavors) {
        const catalogEntry = { vanilla: true, chocolate: true, strawberry: true } as Record<string, boolean>;
        flavor.unlocked = !!catalogEntry[flavor.id];
      }
    }

    // Apply limited ingredients
    if (ch.constraints.limitedIngredients) {
      for (const ing of gameState.ingredients) {
        ing.quantity = Math.min(ing.quantity, 10);
      }
    }

    // Apply price cap via menu prices
    if (ch.constraints.maxPrice) {
      for (const flavor of gameState.flavors) {
        if (flavor.unlocked) {
          gameState.menuPrices.set(flavor.id, Math.min(
            gameState.menuPrices.get(flavor.id) ?? 3.0,
            ch.constraints.maxPrice
          ));
        }
      }
    }

    this.scene.start('GameplayScene');
  }
}
