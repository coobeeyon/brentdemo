import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RESEARCH_CATALOG, ResearchCategory, MILESTONE_CATALOG } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { scaledFontSize } from '../systems/UIUtils';
import { getAudioManager } from '../systems/AudioManager';

const CATEGORY_LABELS: Record<ResearchCategory, string> = {
  [ResearchCategory.FLAVORS]: 'Flavors',
  [ResearchCategory.EQUIPMENT]: 'Equipment',
  [ResearchCategory.STAFF]: 'Staff',
  [ResearchCategory.MARKETING]: 'Marketing',
  [ResearchCategory.STORE]: 'Store',
};

const CATEGORY_ORDER: ResearchCategory[] = [
  ResearchCategory.FLAVORS,
  ResearchCategory.EQUIPMENT,
  ResearchCategory.STAFF,
  ResearchCategory.MARKETING,
  ResearchCategory.STORE,
];

export class ResearchScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;
  private activeTab: ResearchCategory = ResearchCategory.FLAVORS;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor() {
    super({ key: 'ResearchScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.scrollY = 0;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 700;
    const panelH = 600;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    this.add.text(GAME_WIDTH / 2, panelY + 20, 'Research Tree', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 26), color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Research points display
    this.add.text(GAME_WIDTH / 2, panelY + 52, `Research Points: ${this.gameState.researchPoints}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#F1C40F',
    }).setOrigin(0.5, 0);

    // Milestones summary
    const completed = this.gameState.completedMilestones.size;
    const total = MILESTONE_CATALOG.length;
    this.add.text(GAME_WIDTH / 2, panelY + 72, `Milestones: ${completed}/${total}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#95A5A6',
    }).setOrigin(0.5, 0);

    // Category tabs
    this.renderTabs(panelX, panelY, panelW);

    // Content area with mask for scrolling
    this.contentContainer = this.add.container(0, 0);
    const contentY = panelY + 125;
    const contentH = panelH - 180;
    const mask = this.add.graphics();
    mask.fillRect(panelX, contentY, panelW, contentH);
    this.contentContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

    this.renderNodes(panelX, panelY, panelW);

    // Scroll with mouse wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _currentlyOver: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (this.maxScrollY <= 0) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScrollY);
      this.renderNodes(panelX, panelY, panelW);
    });

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, 'Close', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
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

  private renderTabs(panelX: number, panelY: number, panelW: number): void {
    const tabY = panelY + 92;
    const tabW = (panelW - 40) / CATEGORY_ORDER.length;

    for (let i = 0; i < CATEGORY_ORDER.length; i++) {
      const cat = CATEGORY_ORDER[i];
      const isActive = cat === this.activeTab;
      const x = panelX + 20 + i * tabW;

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isActive ? 0x3498DB : 0x34495E, 1);
      tabBg.fillRoundedRect(x, tabY, tabW - 4, 28, 5);

      const label = this.add.text(x + tabW / 2 - 2, tabY + 14, CATEGORY_LABELS[cat], {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: isActive ? '#FFF' : '#95A5A6', fontStyle: isActive ? 'bold' : 'normal',
      }).setOrigin(0.5);

      // Make clickable
      const hitArea = this.add.zone(x + tabW / 2 - 2, tabY + 14, tabW - 4, 28)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.activeTab = cat;
        this.scrollY = 0;
        this.scene.restart();
      });
    }
  }

  private renderNodes(panelX: number, panelY: number, panelW: number): void {
    this.contentContainer.removeAll(true);

    const nodes = RESEARCH_CATALOG.filter(n => n.category === this.activeTab);
    const startY = panelY + 130;
    let y = startY - this.scrollY;

    for (const node of nodes) {
      const isUnlocked = this.gameState.unlockedResearch.has(node.id);
      const canResearch = this.gameState.canResearch(node.id);
      const prereqsMet = node.prerequisites.every(p => this.gameState.unlockedResearch.has(p));

      // Card background
      const cardBg = this.add.graphics();
      const borderColor = isUnlocked ? 0x2ECC71 : canResearch ? 0x3498DB : 0x34495E;
      const bgAlpha = isUnlocked ? 0.3 : 1;
      cardBg.fillStyle(0x34495E, bgAlpha);
      cardBg.fillRoundedRect(panelX + 20, y, panelW - 40, 85, 8);
      cardBg.lineStyle(2, borderColor);
      cardBg.strokeRoundedRect(panelX + 20, y, panelW - 40, 85, 8);
      this.contentContainer.add(cardBg);

      // Status icon
      const icon = isUnlocked ? '[OK]' : prereqsMet ? '' : '[locked]';
      const nameColor = isUnlocked ? '#2ECC71' : canResearch ? '#FFF' : '#7F8C8D';
      const nameText = this.add.text(panelX + 35, y + 8, `${icon} ${node.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: nameColor, fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      // Cost
      const costColor = isUnlocked ? '#2ECC71' : canResearch ? '#F1C40F' : '#7F8C8D';
      const costLabel = isUnlocked ? 'Unlocked' : `Cost: ${node.cost} RP`;
      const costText = this.add.text(panelX + panelW - 45, y + 10, costLabel, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: costColor,
      }).setOrigin(1, 0);
      this.contentContainer.add(costText);

      // Description
      const descText = this.add.text(panelX + 35, y + 30, node.description, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#BDC3C7',
        wordWrap: { width: panelW - 120 },
      });
      this.contentContainer.add(descText);

      // Prerequisites
      if (node.prerequisites.length > 0 && !isUnlocked) {
        const prereqNames = node.prerequisites.map(pid => {
          const pn = RESEARCH_CATALOG.find(n => n.id === pid);
          const done = this.gameState.unlockedResearch.has(pid);
          return `${done ? '[done]' : '[need]'} ${pn?.name ?? pid}`;
        }).join(', ');
        const prereqText = this.add.text(panelX + 35, y + 55, `Requires: ${prereqNames}`, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: prereqsMet ? '#2ECC71' : '#E74C3C',
        });
        this.contentContainer.add(prereqText);
      }

      // Research button
      if (!isUnlocked && canResearch) {
        const btn = this.add.text(panelX + panelW - 45, y + 55, 'Research', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
          backgroundColor: '#3498DB', padding: { x: 10, y: 8 },
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
          getAudioManager(this).unlock();
          this.gameState.purchaseResearch(node.id);
          this.scene.restart();
        });
        this.contentContainer.add(btn);
      }

      y += 93;
    }

    // Calculate max scroll
    const totalHeight = nodes.length * 93;
    const contentH = 600 - 180; // panelH - header/footer space
    this.maxScrollY = Math.max(0, totalHeight - contentH);
  }
}
