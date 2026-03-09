import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DayPhase, STORE_CLOSE_HOUR } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';

export class GameplayScene extends Phaser.Scene {
  private gameState!: GameState;
  private timeText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private reputationText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameplayScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
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
  }

  update(_time: number, delta: number): void {
    if (this.gameState.phase === DayPhase.SERVE) {
      this.gameState.advanceTime(delta);

      // Check if store should close
      if (this.gameState.currentHour >= STORE_CLOSE_HOUR) {
        this.gameState.phase = DayPhase.CLOSE;
        this.onDayEnd();
      }
    }

    this.updateHUD();
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
    this.add.text(GAME_WIDTH / 2, 450, '— Customer Queue —', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#999',
    }).setOrigin(0.5);
  }

  private createHUD(): void {
    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x2C3E50, 0.9);
    topBar.fillRect(0, 0, GAME_WIDTH, 56);

    this.dayText = this.add.text(20, 14, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFF',
    });

    this.timeText = this.add.text(180, 14, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFD700',
    });

    this.phaseText = this.add.text(380, 14, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#7FDBFF',
    });

    this.moneyText = this.add.text(GAME_WIDTH - 20, 14, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#2ECC40',
    }).setOrigin(1, 0);

    this.reputationText = this.add.text(GAME_WIDTH - 200, 14, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFDC00',
    });
  }

  private createPhaseUI(): void {
    // Phase-specific controls
    this.updatePhaseUI();
  }

  private updatePhaseUI(): void {
    const { phase } = this.gameState;

    // Clear previous phase UI elements (tagged group)
    this.children.getByName('phaseUI')?.destroy();

    if (phase === DayPhase.PREPARE) {
      const openBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🔔 Open Store', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFF',
        backgroundColor: '#27AE60',
        padding: { x: 24, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setName('phaseUI');

      openBtn.on('pointerdown', () => {
        this.gameState.phase = DayPhase.SERVE;
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
  }

  private toggleSpeed(): void {
    const speeds = [1, 2, 0]; // normal -> fast -> paused -> normal
    const idx = speeds.indexOf(this.gameState.gameSpeed);
    this.gameState.gameSpeed = speeds[(idx + 1) % speeds.length];
  }

  private onDayEnd(): void {
    // Show end-of-day report
    const report = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    report.add(bg);

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(-200, -150, 400, 300, 15);
    report.add(panel);

    const s = this.gameState;
    const lines = [
      `— Day ${s.day} Report —`,
      '',
      `Revenue: $${s.dailyRevenue.toFixed(2)}`,
      `Expenses: $${s.dailyExpenses.toFixed(2)}`,
      `Profit: $${s.profit.toFixed(2)}`,
      '',
      `Balance: $${s.money.toFixed(2)}`,
      `Reputation: ${'★'.repeat(Math.round(s.reputation))}`,
    ];

    const reportText = this.add.text(0, -120, lines.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFF',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
    report.add(reportText);

    const nextBtn = this.add.text(0, 110, 'Next Day →', {
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
