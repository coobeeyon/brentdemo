import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DayPhase, STORE_CLOSE_HOUR } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { CustomerManager } from '../systems/CustomerManager';
import { SaveManager } from '../systems/SaveManager';

export class GameplayScene extends Phaser.Scene {
  private gameState!: GameState;
  private customerManager!: CustomerManager;
  private timeText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private reputationText!: Phaser.GameObjects.Text;
  private queueText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private serveButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameplayScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.customerManager = new CustomerManager(this, this.gameState);

    const isLoadingSave = this.registry.get('loadSave') as boolean;
    if (!isLoadingSave) {
      this.gameState.startNewDay();
    }

    this.createStoreView();
    this.createHUD();
    this.createPhaseUI();

    // Keyboard shortcuts
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.launch('PauseScene');
      this.scene.pause();
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.toggleSpeed();
    });

    // Serve customer with Enter or click
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.serveNextCustomer();
    });
  }

  update(_time: number, delta: number): void {
    if (this.gameState.phase === DayPhase.SERVE) {
      this.gameState.advanceTime(delta);
      this.customerManager.update(delta);

      // Check if store should close
      if (this.gameState.currentHour >= STORE_CLOSE_HOUR) {
        this.gameState.phase = DayPhase.CLOSE;
        this.onDayEnd();
      }
    }

    this.updateHUD();
  }

  private serveNextCustomer(): void {
    if (this.gameState.phase !== DayPhase.SERVE) return;

    const revenue = this.customerManager.serveFirstCustomer();
    if (revenue !== null) {
      this.gameState.dailyRevenue += revenue;
      this.gameState.money += revenue;

      // Show floating revenue text
      const floatText = this.add.text(GAME_WIDTH / 2, 340, `+$${revenue.toFixed(2)}`, {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#2ECC40',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: floatText,
        y: 280,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => floatText.destroy(),
      });
    }
  }

  private createStoreView(): void {
    // Store floor background
    const floor = this.add.graphics();
    floor.fillStyle(0xFFF5E6, 1);
    floor.fillRect(0, 60, GAME_WIDTH, GAME_HEIGHT - 60);

    // Counter
    this.add.image(GAME_WIDTH / 2, 300, 'counter').setScale(3, 1.5);

    // Display case area
    const displayCase = this.add.graphics();
    displayCase.fillStyle(0xADD8E6, 0.3);
    displayCase.fillRoundedRect(GAME_WIDTH / 2 - 250, 260, 500, 40, 5);
    displayCase.lineStyle(2, 0x6B8E9B);
    displayCase.strokeRoundedRect(GAME_WIDTH / 2 - 250, 260, 500, 40, 5);

    // Place flavor scoops in display
    const flavors = this.gameState.flavors.filter(f => f.unlocked);
    const spacing = 500 / (flavors.length + 1);
    flavors.forEach((flavor, i) => {
      const x = (GAME_WIDTH / 2 - 250) + spacing * (i + 1);
      const textureKey = `scoop_${flavor.id}`;
      if (this.textures.exists(textureKey)) {
        this.add.image(x, 280, textureKey).setScale(1.2);
      }
      this.add.text(x, 305, flavor.name, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#555',
      }).setOrigin(0.5, 0);
    });

    // Queue area label
    this.add.text(GAME_WIDTH / 2, 440, '— Customer Queue —', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#999',
    }).setOrigin(0.5);

    // Serve button
    this.serveButton = this.add.text(GAME_WIDTH / 2, 360, '🍦 Serve Next [Enter]', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFF',
      backgroundColor: '#3498DB',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.serveButton.on('pointerdown', () => this.serveNextCustomer());
    this.serveButton.on('pointerover', () => this.serveButton.setStyle({ backgroundColor: '#5DADE2' }));
    this.serveButton.on('pointerout', () => this.serveButton.setStyle({ backgroundColor: '#3498DB' }));
  }

  private createHUD(): void {
    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x2C3E50, 0.9);
    topBar.fillRect(0, 0, GAME_WIDTH, 56);

    this.dayText = this.add.text(20, 8, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
    });

    this.timeText = this.add.text(20, 30, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFD700',
    });

    this.phaseText = this.add.text(200, 8, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#7FDBFF',
    });

    this.speedText = this.add.text(200, 30, '', {
      fontFamily: 'Arial', fontSize: '14px', color: '#95A5A6',
    });

    this.queueText = this.add.text(GAME_WIDTH / 2, 14, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
    }).setOrigin(0.5, 0);

    this.moneyText = this.add.text(GAME_WIDTH - 20, 8, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#2ECC40',
    }).setOrigin(1, 0);

    this.reputationText = this.add.text(GAME_WIDTH - 20, 30, '', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFDC00',
    }).setOrigin(1, 0);
  }

  private createPhaseUI(): void {
    this.updatePhaseUI();
  }

  private updatePhaseUI(): void {
    const { phase } = this.gameState;

    this.children.getByName('phaseUI')?.destroy();

    if (phase === DayPhase.PREPARE) {
      this.serveButton.setVisible(false);
      this.customerManager.resetDayStats();
      this.customerManager.clearQueue();

      const prepContainer = this.add.container(0, 0).setName('phaseUI');

      const shopBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, '🛒 Buy Ingredients', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#FFF',
        backgroundColor: '#8E44AD',
        padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      shopBtn.on('pointerdown', () => {
        this.scene.launch('ShopScene');
        this.scene.pause();
      });
      prepContainer.add(shopBtn);

      const openBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🔔 Open Store', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFF',
        backgroundColor: '#27AE60',
        padding: { x: 24, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      openBtn.on('pointerdown', () => {
        this.gameState.phase = DayPhase.SERVE;
        this.serveButton.setVisible(true);
        prepContainer.destroy();
      });
      prepContainer.add(openBtn);

      // Show inventory summary during prepare
      const invSummary = this.gameState.ingredients
        .map(i => `${i.name}: ${i.quantity} (${i.expiresInDays}d)`)
        .join('\n');

      const invText = this.add.text(GAME_WIDTH - 20, 70, 'Inventory:\n' + invSummary, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#333',
        backgroundColor: '#FFFFFFCC',
        padding: { x: 10, y: 8 },
        lineSpacing: 3,
      }).setOrigin(1, 0);
      prepContainer.add(invText);
    }
  }

  private updateHUD(): void {
    const s = this.gameState;
    this.dayText.setText(`Day ${s.day} | Season ${s.season}`);
    this.timeText.setText(s.currentTimeString);
    this.phaseText.setText(s.phase.toUpperCase());
    this.moneyText.setText(`$${s.money.toFixed(2)}`);
    this.reputationText.setText('★'.repeat(Math.round(s.reputation)) + '☆'.repeat(5 - Math.round(s.reputation)));
    this.queueText.setText(`Queue: ${this.customerManager.getQueueLength()} | Served: ${this.customerManager.customersServed} | Lost: ${this.customerManager.customersLost}`);

    const speedLabels: Record<number, string> = { 0: '⏸ PAUSED', 1: '▶ 1x', 2: '▶▶ 2x' };
    this.speedText.setText(speedLabels[s.gameSpeed] ?? `${s.gameSpeed}x`);
  }

  private toggleSpeed(): void {
    const speeds = [1, 2, 0];
    const idx = speeds.indexOf(this.gameState.gameSpeed);
    this.gameState.gameSpeed = speeds[(idx + 1) % speeds.length];
  }

  private onDayEnd(): void {
    this.serveButton.setVisible(false);
    this.customerManager.clearQueue();

    // Update reputation based on service quality
    const served = this.customerManager.customersServed;
    const lost = this.customerManager.customersLost;
    const total = served + lost;
    if (total > 0) {
      const serviceRatio = served / total;
      const repChange = (serviceRatio - 0.5) * 0.5; // +/- 0.25 max per day
      this.gameState.reputation = Math.max(0.5, Math.min(5, this.gameState.reputation + repChange));
    }

    // Record day report with full stats
    const s = this.gameState;
    const satisfaction = total > 0 ? Math.round((served / total) * 100) : 0;
    s.dayReports.push({
      day: s.day,
      revenue: s.dailyRevenue,
      expenses: s.dailyExpenses,
      customersServed: served,
      customersLost: lost,
      satisfactionScore: satisfaction,
    });

    // Show end-of-day report
    const report = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    report.add(bg);

    // Wider panel to fit chart
    const panelW = 520;
    const panelH = 480;
    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 15);
    report.add(panel);

    // Title
    const titleText = this.add.text(0, -panelH / 2 + 20, `— Day ${s.day} Report —`, {
      fontFamily: 'Arial', fontSize: '22px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    report.add(titleText);

    // Stats in two columns
    const leftX = -panelW / 2 + 30;
    const rightX = 20;
    let y = -panelH / 2 + 60;
    const labelStyle = { fontFamily: 'Arial', fontSize: '14px', color: '#95A5A6' };
    const valueStyle = { fontFamily: 'Arial', fontSize: '16px', color: '#FFF' };
    const profitColor = s.profit >= 0 ? '#2ECC40' : '#E74C3C';

    const addStat = (x: number, yPos: number, label: string, value: string, color?: string) => {
      const l = this.add.text(x, yPos, label, labelStyle);
      const v = this.add.text(x, yPos + 16, value, { ...valueStyle, color: color ?? '#FFF' });
      report.add(l);
      report.add(v);
    };

    addStat(leftX, y, 'CUSTOMERS SERVED', `${served}`, '#2ECC40');
    addStat(rightX, y, 'CUSTOMERS LOST', `${lost}`, lost > 0 ? '#E74C3C' : '#FFF');
    y += 45;
    addStat(leftX, y, 'SATISFACTION', `${satisfaction}%`, satisfaction >= 70 ? '#2ECC40' : '#F39C12');
    addStat(rightX, y, 'REPUTATION', '★'.repeat(Math.round(s.reputation)) + '☆'.repeat(5 - Math.round(s.reputation)), '#FFDC00');
    y += 45;

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x7F8C8D, 0.5);
    sep.lineBetween(-panelW / 2 + 20, y, panelW / 2 - 20, y);
    report.add(sep);
    y += 10;

    addStat(leftX, y, 'REVENUE', `$${s.dailyRevenue.toFixed(2)}`, '#2ECC40');
    addStat(rightX, y, 'EXPENSES', `$${s.dailyExpenses.toFixed(2)}`, '#E74C3C');
    y += 45;
    addStat(leftX, y, 'PROFIT', `$${s.profit.toFixed(2)}`, profitColor);
    addStat(rightX, y, 'BALANCE', `$${s.money.toFixed(2)}`);
    y += 50;

    // Mini revenue chart (last 7 days)
    const recentReports = s.dayReports.slice(-7);
    if (recentReports.length > 1) {
      const chartX = -panelW / 2 + 30;
      const chartW = panelW - 60;
      const chartH = 80;

      const chartLabel = this.add.text(0, y, 'Revenue Trend (Last 7 Days)', {
        fontFamily: 'Arial', fontSize: '13px', color: '#95A5A6',
      }).setOrigin(0.5, 0);
      report.add(chartLabel);
      y += 20;

      const chartGfx = this.add.graphics();

      // Chart background
      chartGfx.fillStyle(0x1A252F, 1);
      chartGfx.fillRoundedRect(chartX, y, chartW, chartH, 5);

      // Find max value for scaling
      const maxRev = Math.max(...recentReports.map(r => r.revenue), 1);
      const barWidth = (chartW - 20) / recentReports.length;

      recentReports.forEach((r, i) => {
        const barH = (r.revenue / maxRev) * (chartH - 20);
        const bx = chartX + 10 + i * barWidth;
        const by = y + chartH - 10 - barH;

        // Bar
        const profit = r.revenue - r.expenses;
        chartGfx.fillStyle(profit >= 0 ? 0x2ECC71 : 0xE74C3C, 0.8);
        chartGfx.fillRoundedRect(bx + 2, by, barWidth - 4, barH, 2);

        // Day label
        const dayLabel = this.add.text(bx + barWidth / 2, y + chartH - 6, `D${r.day}`, {
          fontFamily: 'Arial', fontSize: '9px', color: '#7F8C8D',
        }).setOrigin(0.5, 0);
        report.add(dayLabel);
      });

      report.add(chartGfx);
    }

    // Next day button
    const nextBtn = this.add.text(0, panelH / 2 - 40, 'Next Day →', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFF',
      backgroundColor: '#3498DB',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    report.add(nextBtn);

    nextBtn.on('pointerdown', () => {
      report.destroy();
      // Auto-save at end of day
      const gameMode = this.registry.get('gameMode') as string ?? 'story';
      SaveManager.save(this.gameState, 'auto', gameMode);
      this.gameState.startNewDay();
      this.updatePhaseUI();
    });
  }
}
