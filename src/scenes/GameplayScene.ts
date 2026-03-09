import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DayPhase, STORE_CLOSE_HOUR } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { CustomerManager } from '../systems/CustomerManager';

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
    this.gameState.startNewDay();

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

      const openBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🔔 Open Store', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFF',
        backgroundColor: '#27AE60',
        padding: { x: 24, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setName('phaseUI');

      openBtn.on('pointerdown', () => {
        this.gameState.phase = DayPhase.SERVE;
        this.serveButton.setVisible(true);
        openBtn.destroy();
      });
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

    // Show end-of-day report
    const report = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    report.add(bg);

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(-200, -180, 400, 360, 15);
    report.add(panel);

    const s = this.gameState;
    const lines = [
      `— Day ${s.day} Report —`,
      '',
      `Customers Served: ${served}`,
      `Customers Lost: ${lost}`,
      '',
      `Revenue: $${s.dailyRevenue.toFixed(2)}`,
      `Expenses: $${s.dailyExpenses.toFixed(2)}`,
      `Profit: $${s.profit.toFixed(2)}`,
      '',
      `Balance: $${s.money.toFixed(2)}`,
      `Reputation: ${'★'.repeat(Math.round(s.reputation))}${'☆'.repeat(5 - Math.round(s.reputation))}`,
    ];

    const reportText = this.add.text(0, -150, lines.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#FFF',
      align: 'center',
      lineSpacing: 5,
    }).setOrigin(0.5, 0);
    report.add(reportText);

    const nextBtn = this.add.text(0, 130, 'Next Day →', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFF',
      backgroundColor: '#3498DB',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    report.add(nextBtn);

    nextBtn.on('pointerdown', () => {
      report.destroy();
      this.gameState.startNewDay();
      this.updatePhaseUI();
    });
  }
}
