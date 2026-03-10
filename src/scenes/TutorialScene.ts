import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { scaledFontSize } from '../systems/UIUtils';

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
      'Tip: Buy enough beforehand! Emergency resupply\n' +
      'IS available during the day, but costs 1.5x.',
    highlight: { x: GAME_WIDTH / 2 - 110, y: GAME_HEIGHT - 85, w: 220, h: 50 },
  },
  {
    title: 'Step 4: End of Day',
    body:
      'At closing time, you\'ll see a report of your\n' +
      'revenue, expenses, and customer satisfaction.\n\n' +
      'Then a new day begins — buy more ingredients\n' +
      'and keep growing your business!',
  },
  {
    title: 'Step 5: Set Your Prices',
    body:
      'Press ESC to open the Pause menu, then\n' +
      'choose "Menu Editor" to set prices.\n\n' +
      'Each flavor has a "Suggest" button that\n' +
      'calculates a good price based on your\n' +
      'reputation and ingredient costs.\n\n' +
      'Price too high → fewer customers buy.\n' +
      'Price too low → you lose money per scoop!',
  },
  {
    title: 'Step 6: Reputation Matters',
    body:
      'Your star rating (shown in the top bar)\n' +
      'determines how many customers visit.\n\n' +
      'Reputation goes UP when you:\n' +
      '  - Serve customers quickly\n' +
      '  - Respect dietary restrictions (vegan, nut-free)\n\n' +
      'Reputation goes DOWN when you:\n' +
      '  - Let customers leave angry\n' +
      '  - Run out of ingredients\n' +
      '  - Fail health inspections',
  },
  {
    title: 'Step 7: Grow Your Business',
    body:
      'The Pause menu (ESC) has many tools:\n\n' +
      '  Staff — hire workers to serve faster\n' +
      '  Equipment — upgrade machines & repair them\n' +
      '  Research — unlock new flavors & upgrades\n' +
      '  Marketing — run campaigns for more customers\n\n' +
      'Equipment breaks down over time, so check it\n' +
      'regularly and repair before it fails!',
  },
  {
    title: 'You\'re Ready!',
    body:
      'That\'s everything you need to get started!\n\n' +
      '  SPACE — change game speed\n' +
      '  ESC — pause menu & management\n' +
      '  Enter — serve next customer\n\n' +
      'Watch for daily events like heat waves and\n' +
      'supply sales — they can help or hurt!\n\n' +
      'Good luck with your ice cream empire!',
  },
];

export class TutorialScene extends Phaser.Scene {
  private currentStep = 0;
  private overlay!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private highlightBorder?: Phaser.GameObjects.Graphics;
  private spotlightMaskShape?: Phaser.GameObjects.Graphics;
  private spotlightMask?: Phaser.Display.Masks.GeometryMask;
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
      fontSize: scaledFontSize(this, 26),
      color: '#FFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Body
    this.bodyText = this.add.text(GAME_WIDTH / 2, 0, '', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 16),
      color: '#ECF0F1',
      lineSpacing: 4,
      align: 'left',
      wordWrap: { width: 440 },
    }).setOrigin(0.5, 0);

    // Next button
    this.nextBtn = this.add.text(GAME_WIDTH / 2 + 60, 0, 'Next →', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 20),
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
      fontSize: scaledFontSize(this, 16),
      color: '#95A5A6',
      padding: { x: 12, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.skipBtn.on('pointerdown', () => this.closeTutorial());
    this.skipBtn.on('pointerover', () => this.skipBtn.setStyle({ color: '#BDC3C7' }));
    this.skipBtn.on('pointerout', () => this.skipBtn.setStyle({ color: '#95A5A6' }));

    // Step indicator
    this.stepIndicator = this.add.text(GAME_WIDTH / 2, 0, '', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 13),
      color: '#7F8C8D',
    }).setOrigin(0.5);

    // Keyboard navigation
    this.input.keyboard!.on('keydown-ENTER', () => this.advance());
    this.input.keyboard!.on('keydown-SPACE', () => {
      // Don't let SPACE close the tutorial on the last step —
      // SPACE is used for game-speed control in gameplay.
      if (this.currentStep < TUTORIAL_STEPS.length - 1) {
        this.advance();
      }
    });
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

    // Clean up previous highlight border and mask
    if (this.highlightBorder) {
      this.highlightBorder.destroy();
      this.highlightBorder = undefined;
    }
    if (this.spotlightMask) {
      this.overlay.clearMask(true);
      this.spotlightMask = undefined;
    }
    if (this.spotlightMaskShape) {
      this.spotlightMaskShape.destroy();
      this.spotlightMaskShape = undefined;
    }

    // Draw overlay with optional spotlight cutout
    this.overlay.clear();
    this.overlay.fillStyle(0x000000, 0.7);
    this.overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (step.highlight) {
      const { x, y, w, h } = step.highlight;

      // Create a geometry mask to cut out the highlighted area.
      // With invertAlpha the overlay is visible where the mask has NO pixels,
      // so we draw only the cutout rectangle — the overlay hides everywhere else.
      this.spotlightMaskShape = this.make.graphics();
      this.spotlightMaskShape.fillStyle(0xffffff, 1);
      this.spotlightMaskShape.fillRect(x, y, w, h);
      this.spotlightMask = new Phaser.Display.Masks.GeometryMask(this, this.spotlightMaskShape);
      this.spotlightMask.setInvertAlpha(true);
      this.overlay.setMask(this.spotlightMask);

      // Draw a bright border around the highlight
      this.highlightBorder = this.add.graphics();
      this.highlightBorder.lineStyle(3, 0xF1C40F, 1);
      this.highlightBorder.strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, 6);
    }

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

    // Clean up highlight border and mask
    if (this.highlightBorder) {
      this.highlightBorder.destroy();
      this.highlightBorder = undefined;
    }
    if (this.spotlightMask) {
      this.overlay.clearMask(true);
      this.spotlightMask = undefined;
    }
    if (this.spotlightMaskShape) {
      this.spotlightMaskShape.destroy();
      this.spotlightMaskShape = undefined;
    }

    // Resume the gameplay scene
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }
}
