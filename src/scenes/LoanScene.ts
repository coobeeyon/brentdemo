import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LOAN_CATALOG } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';

export class LoanScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'LoanScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 560;
    const panelH = 500;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    this.add.text(GAME_WIDTH / 2, panelY + 25, '🏦 Loans', {
      fontFamily: 'Arial', fontSize: '28px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2, panelY + 60, `Balance: $${this.gameState.loc.money.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: '16px', color: '#2ECC40',
    }).setOrigin(0.5, 0);

    this.contentContainer = this.add.container(0, 0);
    this.renderContent(panelX, panelY, panelW);

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

  private renderContent(panelX: number, panelY: number, panelW: number): void {
    this.contentContainer.removeAll(true);

    if (this.gameState.loc.loanAmount > 0) {
      this.renderActiveLoan(panelX, panelY, panelW);
    } else {
      this.renderLoanOptions(panelX, panelY, panelW);
    }
  }

  private renderActiveLoan(panelX: number, panelY: number, panelW: number): void {
    const leftX = panelX + 30;
    let y = panelY + 95;

    const headerText = this.add.text(GAME_WIDTH / 2, y, '📋 Active Loan', {
      fontFamily: 'Arial', fontSize: '20px', color: '#F1C40F', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.contentContainer.add(headerText);
    y += 35;

    const isOverdue = this.gameState.loc.loanDaysRemaining <= 0;
    const labelStyle = { fontFamily: 'Arial', fontSize: '15px', color: '#95A5A6' };
    const valueStyle = { fontFamily: 'Arial', fontSize: '17px', color: '#FFF' };

    const addRow = (label: string, value: string, color?: string) => {
      const l = this.add.text(leftX, y, label, labelStyle);
      this.contentContainer.add(l);
      const v = this.add.text(leftX + panelW - 60, y, value, { ...valueStyle, color: color ?? '#FFF' }).setOrigin(1, 0);
      this.contentContainer.add(v);
      y += 28;
    };

    addRow('Amount Owed:', `$${this.gameState.loc.loanAmount.toFixed(2)}`, '#E74C3C');
    addRow('Daily Interest:', `${(this.gameState.loc.loanInterestRate * 100).toFixed(1)}%`, '#F39C12');
    addRow('Days Remaining:', isOverdue ? 'OVERDUE!' : `${this.gameState.loc.loanDaysRemaining}`, isOverdue ? '#E74C3C' : '#FFF');

    if (isOverdue) {
      const warningText = this.add.text(GAME_WIDTH / 2, y + 5, '⚠ Overdue loans accrue double interest\nand cause daily reputation loss!', {
        fontFamily: 'Arial', fontSize: '13px', color: '#E74C3C',
        align: 'center', lineSpacing: 4,
      }).setOrigin(0.5, 0);
      this.contentContainer.add(warningText);
      y += 50;
    }

    y += 15;

    // Payment buttons
    const payAmounts = [50, 100, 250];
    const payAllAmount = Math.min(this.gameState.loc.loanAmount, this.gameState.loc.money);

    payAmounts.forEach((amount, i) => {
      const canAfford = this.gameState.loc.money >= amount && this.gameState.loc.loanAmount > 0;
      const payBtn = this.add.text(
        panelX + 40 + i * 125, y,
        `Pay $${amount}`,
        {
          fontFamily: 'Arial', fontSize: '16px',
          color: canAfford ? '#FFF' : '#666',
          backgroundColor: canAfford ? '#27AE60' : '#34495E',
          padding: { x: 12, y: 6 },
        }
      ).setInteractive({ useHandCursor: canAfford });

      if (canAfford) {
        payBtn.on('pointerdown', () => {
          this.gameState.makeLoanPayment(amount);
          this.renderContent(panelX, panelY - 0, panelX + 560 - panelX);
        });
      }
      this.contentContainer.add(payBtn);
    });

    y += 45;

    // Pay all button
    if (payAllAmount > 0) {
      const payAllBtn = this.add.text(GAME_WIDTH / 2, y, `Pay All ($${payAllAmount.toFixed(2)})`, {
        fontFamily: 'Arial', fontSize: '18px', color: '#FFF',
        backgroundColor: '#2ECC71', padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      payAllBtn.on('pointerdown', () => {
        this.gameState.makeLoanPayment(payAllAmount);
        this.renderContent(panelX, panelY, 560);
      });
      this.contentContainer.add(payAllBtn);
    }
  }

  private renderLoanOptions(panelX: number, panelY: number, panelW: number): void {
    let y = panelY + 95;

    const headerText = this.add.text(GAME_WIDTH / 2, y, 'Choose a loan:', {
      fontFamily: 'Arial', fontSize: '16px', color: '#95A5A6',
    }).setOrigin(0.5, 0);
    this.contentContainer.add(headerText);
    y += 35;

    for (const loan of LOAN_CATALOG) {
      // Loan card
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x34495E, 1);
      cardBg.fillRoundedRect(panelX + 25, y, panelW - 50, 95, 8);
      this.contentContainer.add(cardBg);

      const nameText = this.add.text(panelX + 40, y + 10, `${loan.name} — $${loan.amount}`, {
        fontFamily: 'Arial', fontSize: '18px', color: '#FFF', fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      const descText = this.add.text(panelX + 40, y + 34, loan.description, {
        fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6',
        wordWrap: { width: panelW - 200 },
      });
      this.contentContainer.add(descText);

      const detailText = this.add.text(panelX + 40, y + 55, `${(loan.interestRate * 100).toFixed(1)}% daily interest • ${loan.durationDays} days to repay • Total: ~$${(loan.amount * (1 + loan.interestRate * loan.durationDays)).toFixed(0)}`, {
        fontFamily: 'Arial', fontSize: '11px', color: '#F39C12',
      });
      this.contentContainer.add(detailText);

      const takeBtn = this.add.text(panelX + panelW - 50, y + 35, 'Take Loan', {
        fontFamily: 'Arial', fontSize: '15px', color: '#FFF',
        backgroundColor: '#E67E22', padding: { x: 10, y: 5 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      takeBtn.on('pointerdown', () => {
        if (this.gameState.takeLoan(loan.id)) {
          this.renderContent(panelX, panelY, panelW);
        }
      });
      this.contentContainer.add(takeBtn);

      y += 110;
    }
  }
}
