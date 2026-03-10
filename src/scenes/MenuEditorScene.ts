import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BASE_SCOOP_PRICE } from '../config/constants';
import { GameState, getGameState, Flavor } from '../systems/GameState';

export class MenuEditorScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'MenuEditorScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelX = GAME_WIDTH / 2 - 300;
    const panelY = 60;
    const panelW = 600;
    const panelH = 580;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    const titleSuffix = this.gameState.franchiseMode ? ` — ${this.gameState.locationName}` : '';
    this.add.text(GAME_WIDTH / 2, panelY + 25, `Menu Editor${titleSuffix}`, {
      fontFamily: 'Arial', fontSize: '28px', color: '#FFF',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, panelY + 55, 'Set prices and choose which flavors to offer today', {
      fontFamily: 'Arial', fontSize: '13px', color: '#95A5A6',
    }).setOrigin(0.5);

    this.contentContainer = this.add.container(0, 0);
    this.buildFlavorList(panelX, panelY + 80);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, '← Back', {
      fontFamily: 'Arial', fontSize: '20px', color: '#FFF',
      backgroundColor: '#E74C3C', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeScene());
    this.input.keyboard!.on('keydown-ESC', () => this.closeScene());
  }

  private closeScene(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }

  private buildFlavorList(panelX: number, startY: number): void {
    // Column headers
    const hStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6' };
    const cols = {
      toggle: panelX + 20,
      name: panelX + 60,
      popularity: panelX + 200,
      basePrice: panelX + 310,
      price: panelX + 400,
      ingredients: panelX + 530,
    };

    this.contentContainer.add(this.add.text(cols.toggle, startY, 'ON', hStyle));
    this.contentContainer.add(this.add.text(cols.name, startY, 'FLAVOR', hStyle));
    this.contentContainer.add(this.add.text(cols.popularity, startY, 'POPULARITY', hStyle));
    this.contentContainer.add(this.add.text(cols.basePrice, startY, 'BASE', hStyle));
    this.contentContainer.add(this.add.text(cols.price, startY, 'YOUR PRICE', hStyle));
    this.contentContainer.add(this.add.text(cols.ingredients, startY, 'NEEDS', hStyle));

    this.gameState.loc.flavors.forEach((flavor, i) => {
      this.createFlavorRow(flavor, i, startY + 25, cols);
    });

    // Summary section
    const summaryY = startY + 25 + this.gameState.loc.flavors.length * 65 + 10;
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x7F8C8D, 0.5);
    sep.lineBetween(panelX + 20, summaryY, panelX + 580, summaryY);
    this.contentContainer.add(sep);

    const activeFlavors = this.gameState.loc.flavors.filter(f => f.unlocked).length;
    this.contentContainer.add(
      this.add.text(GAME_WIDTH / 2, summaryY + 15, `${activeFlavors} flavor${activeFlavors !== 1 ? 's' : ''} active on menu`, {
        fontFamily: 'Arial', fontSize: '15px', color: '#FFF',
      }).setOrigin(0.5)
    );

    // Reset prices button
    const resetBtn = this.add.text(GAME_WIDTH / 2, summaryY + 50, 'Reset All Prices to Default', {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
      backgroundColor: '#7F8C8D', padding: { x: 12, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerdown', () => {
      this.gameState.loc.menuPrices.clear();
      this.refreshUI();
    });
    this.contentContainer.add(resetBtn);
  }

  private createFlavorRow(
    flavor: Flavor,
    index: number,
    startY: number,
    cols: Record<string, number>,
  ): void {
    const y = startY + index * 65;

    // Row bg
    const bg = this.add.graphics();
    bg.fillStyle(index % 2 === 0 ? 0x34495E : 0x2C3E50, 1);
    bg.fillRect(cols.toggle - 5, y - 5, 570, 58);
    this.contentContainer.add(bg);

    // Toggle on/off
    const toggleBtn = this.add.text(cols.toggle, y + 15, flavor.unlocked ? 'ON' : 'OFF', {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
      backgroundColor: flavor.unlocked ? '#27AE60' : '#95A5A6',
      padding: { x: 6, y: 4 },
    }).setInteractive({ useHandCursor: true });

    toggleBtn.on('pointerdown', () => {
      flavor.unlocked = !flavor.unlocked;
      this.refreshUI();
    });
    this.contentContainer.add(toggleBtn);

    // Name with scoop color indicator
    const flavorColors: Record<string, string> = {
      vanilla: '#FFF8DC', chocolate: '#8B4513', strawberry: '#FF6B81',
    };
    const colorDot = flavorColors[flavor.id] ?? '#DDD';

    this.contentContainer.add(
      this.add.text(cols.name, y + 5, flavor.name, {
        fontFamily: 'Arial', fontSize: '17px', color: flavor.unlocked ? '#FFF' : '#7F8C8D',
        fontStyle: 'bold',
      })
    );

    // Ingredient list
    const ingNames = flavor.ingredients.map(id => {
      const ing = this.gameState.loc.ingredients.find(i => i.id === id);
      return ing ? `${ing.name}(${ing.quantity})` : id;
    }).join(', ');
    this.contentContainer.add(
      this.add.text(cols.name, y + 28, ingNames, {
        fontFamily: 'Arial', fontSize: '10px', color: '#7F8C8D',
      })
    );

    // Popularity bar
    const popW = 80;
    const popH = 10;
    const popBg = this.add.graphics();
    popBg.fillStyle(0x1A252F, 1);
    popBg.fillRoundedRect(cols.popularity, y + 18, popW, popH, 3);
    this.contentContainer.add(popBg);

    const popFill = this.add.graphics();
    popFill.fillStyle(0xF39C12, 0.8);
    popFill.fillRoundedRect(cols.popularity, y + 18, popW * flavor.popularity, popH, 3);
    this.contentContainer.add(popFill);

    this.contentContainer.add(
      this.add.text(cols.popularity + popW + 5, y + 15, `${Math.round(flavor.popularity * 100)}%`, {
        fontFamily: 'Arial', fontSize: '12px', color: '#95A5A6',
      })
    );

    // Base price
    this.contentContainer.add(
      this.add.text(cols.basePrice, y + 15, `$${BASE_SCOOP_PRICE.toFixed(2)}`, {
        fontFamily: 'Arial', fontSize: '15px', color: '#7F8C8D',
      })
    );

    // Custom price controls
    const currentPrice = this.gameState.loc.menuPrices.get(flavor.id) ?? BASE_SCOOP_PRICE;
    const priceText = this.add.text(cols.price + 30, y + 15, `$${currentPrice.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: '16px', color: currentPrice > BASE_SCOOP_PRICE ? '#2ECC71' : currentPrice < BASE_SCOOP_PRICE ? '#E74C3C' : '#FFF',
    }).setOrigin(0.5, 0);
    this.contentContainer.add(priceText);

    // Price down
    const downBtn = this.add.text(cols.price - 5, y + 15, '−', {
      fontFamily: 'Arial', fontSize: '20px', color: '#E74C3C',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    downBtn.on('pointerdown', () => {
      const newPrice = Math.max(0.50, currentPrice - 0.50);
      this.gameState.loc.menuPrices.set(flavor.id, newPrice);
      this.refreshUI();
    });
    this.contentContainer.add(downBtn);

    // Price up
    const upBtn = this.add.text(cols.price + 65, y + 15, '+', {
      fontFamily: 'Arial', fontSize: '20px', color: '#2ECC71',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    upBtn.on('pointerdown', () => {
      const newPrice = Math.min(15.00, currentPrice + 0.50);
      this.gameState.loc.menuPrices.set(flavor.id, newPrice);
      this.refreshUI();
    });
    this.contentContainer.add(upBtn);
  }

  private refreshUI(): void {
    this.contentContainer.destroy();
    this.contentContainer = this.add.container(0, 0);
    this.buildFlavorList(GAME_WIDTH / 2 - 300, 140);
  }
}
