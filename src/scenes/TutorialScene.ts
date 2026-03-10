import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

interface TutorialStep {
  title: string;
  body: string;
  highlight?: { x: number; y: number; w: number; h: number }; // optional area to spotlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Ice Cream Store Simulator!',
    body:
      'You run a small ice cream stand. Each day has two phases:\n\n' +
      '1. PREPARE — Buy ingredients and get ready\n' +
      '2. SERVE — Customers arrive, serve them to earn money\n\n' +
      'Let\'s walk through your first day.',
  },
  {
    title: 'Step 1: Buy Ingredients',
    body:
      'Before you can open, you MUST buy ingredients.\n' +
      'Without ingredients, you cannot serve customers\n' +
      'and will lose all your reputation!\n\n' +
      'Click "Buy Ingredients" during the Prepare phase\n' +
      'to stock up at the Ingredient Shop.',
    highlight: { x: GAME_WIDTH / 2 - 130, y: GAME_HEIGHT - 145, w: 260, h: 50 },
  },
  {
    title: 'Step 2: How Much to Buy',
    body:
      'A good rule of thumb for your first days:\n\n' +
      '  Milk: 2-3 batches (20-30 units)\n' +
      '  Sugar: 1-2 batches (20-40 units)\n' +
      '  Vanilla Extract: 1 batch (10 units)\n' +
      '  Cocoa Powder: 1 batch (10 units)\n' +
      '  Strawberries: 1 batch (10 units)\n\n' +
      'Watch expiration dates! Strawberries and milk\n' +
      'spoil fast — don\'t overbuy perishables.',
  },
  {
    title: 'Step 3: Open Your Store',
    body:
      'Once you\'ve stocked up, click "Open Store"\n' +
      'to start serving customers.\n\n' +
      'Customers arrive with patience meters.\n' +
      'Press Enter or click "Serve Next" to\n' +
      'fulfill orders before they leave!\n\n' +
      'Tip: You CANNOT resupply during the day,\n' +
      'so make sure you buy enough beforehand.',
    highlight: { x: GAME_WIDTH / 2 - 110, y: GAME_HEIGHT - 85, w: 220, h: 50 },
  },
  {
    title: 'Step 4: End of Day',
    body:
      'At closing time, you\'ll see a report of your\n' +
      'revenue, expenses, and customer satisfaction.\n\n' +
      'Then a new day begins — buy more ingredients\n' +
      'and keep growing your business!\n\n' +
      'Use the Pause menu (ESC) to access staff,\n' +
      'equipment, recipes, and more.',
  },
  {
    title: 'You\'re Ready!',
    body:
      'That\'s the basics! A few more tips:\n\n' +
      '  Press SPACE to change game speed\n' +
      '  Press ESC for the pause menu\n' +
      '  Keep your reputation up for more customers\n' +
      '  Upgrade equipment to serve faster\n\n' +
      'Good luck with your ice cream empire!',
  },
];

export class TutorialScene extends Phaser.Scene {
  private currentStep = 0;
  private overlay!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Text;
  private skipBtn!: Phaser.GameObjects.Text;
  private stepIndicator!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    this.currentStep = 0;

    // Semi-transparent overlay
    this.overlay = this.add.graphics();

    // Panel
    this.panel = this.add.graphics();

    // Title
    this.titleText = this.add.text(GAME_WIDTH / 2, 0, '', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#FFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Body
    this.bodyText = this.add.text(GAME_WIDTH / 2, 0, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ECF0F1',
      lineSpacing: 4,
      align: 'left',
      wordWrap: { width: 440 },
    }).setOrigin(0.5, 0);

    // Next button
    this.nextBtn = this.add.text(GAME_WIDTH / 2 + 60, 0, 'Next →', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFF',
      backgroundColor: '#27AE60',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.nextBtn.on('pointerdown', () => this.advance());
    this.nextBtn.on('pointerover', () => this.nextBtn.setStyle({ backgroundColor: '#2ECC71' }));
    this.nextBtn.on('pointerout', () => this.nextBtn.setStyle({ backgroundColor: '#27AE60' }));

    // Skip button
    this.skipBtn = this.add.text(GAME_WIDTH / 2 - 60, 0, 'Skip Tutorial', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#95A5A6',
      padding: { x: 12, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.skipBtn.on('pointerdown', () => this.closeTutorial());
    this.skipBtn.on('pointerover', () => this.skipBtn.setStyle({ color: '#BDC3C7' }));
    this.skipBtn.on('pointerout', () => this.skipBtn.setStyle({ color: '#95A5A6' }));

    // Step indicator
    this.stepIndicator = this.add.text(GAME_WIDTH / 2, 0, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#7F8C8D',
    }).setOrigin(0.5);

    // Keyboard navigation
    this.input.keyboard!.on('keydown-ENTER', () => this.advance());
    this.input.keyboard!.on('keydown-SPACE', () => this.advance());
    this.input.keyboard!.on('keydown-ESC', () => this.closeTutorial());

    this.showStep();
  }

  private advance(): void {
    this.currentStep++;
    if (this.currentStep >= TUTORIAL_STEPS.length) {
      this.closeTutorial();
    } else {
      this.showStep();
    }
  }

  private showStep(): void {
    const step = TUTORIAL_STEPS[this.currentStep];
    const isLast = this.currentStep === TUTORIAL_STEPS.length - 1;

    // Draw overlay with optional spotlight cutout
    this.overlay.clear();
    this.overlay.fillStyle(0x000000, 0.7);
    this.overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (step.highlight) {
      const { x, y, w, h } = step.highlight;
      // Cut out the highlighted area
      this.overlay.fillStyle(0x000000, 0); // transparent
      // Draw a bright border around the highlight
      const border = this.add.graphics();
      border.lineStyle(3, 0xF1C40F, 1);
      border.strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, 6);
      // This will be cleaned up when step changes
      border.setName('highlightBorder');
    }

    // Clean up previous highlight border
    const oldBorder = this.children.getByName('highlightBorder');
    // Keep the current one, remove old ones
    this.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child.name === 'highlightBorder' && child !== this.children.getByName('highlightBorder')) {
        child.destroy();
      }
    });

    // Panel dimensions
    const panelW = 500;
    const panelH = 320;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2 - 20;

    this.panel.clear();
    this.panel.fillStyle(0x2C3E50, 0.95);
    this.panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);
    this.panel.lineStyle(2, 0x3498DB, 1);
    this.panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Update text
    this.titleText.setText(step.title);
    this.titleText.setPosition(GAME_WIDTH / 2, panelY + 30);

    this.bodyText.setText(step.body);
    this.bodyText.setPosition(GAME_WIDTH / 2, panelY + 65);

    // Buttons
    const btnY = panelY + panelH - 40;
    this.nextBtn.setText(isLast ? 'Start Playing!' : 'Next →');
    this.nextBtn.setPosition(GAME_WIDTH / 2 + 80, btnY);

    this.skipBtn.setVisible(!isLast);
    this.skipBtn.setPosition(GAME_WIDTH / 2 - 80, btnY);

    // Step indicator
    this.stepIndicator.setText(`${this.currentStep + 1} / ${TUTORIAL_STEPS.length}`);
    this.stepIndicator.setPosition(GAME_WIDTH / 2, panelY + panelH - 12);
  }

  private closeTutorial(): void {
    // Mark tutorial as seen
    this.registry.set('tutorialSeen', true);
    try {
      localStorage.setItem('icecream_tutorial_seen', 'true');
    } catch {
      // localStorage may not be available
    }

    // Clean up highlight borders
    this.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child.name === 'highlightBorder') {
        child.destroy();
      }
    });

    // Resume the gameplay scene
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }
}
