import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TOPPING_CATALOG, SERVING_STYLE_CATALOG, BASE_SCOOP_PRICE } from '../config/constants';
import { GameState, getGameState, Recipe } from '../systems/GameState';

export class RecipeScene extends Phaser.Scene {
  private gameState!: GameState;
  private contentContainer!: Phaser.GameObjects.Container;
  private formContainer!: Phaser.GameObjects.Container;
  private showingForm = false;

  constructor() {
    super({ key: 'RecipeScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.showingForm = false;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 650;
    const panelH = 580;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    this.add.text(GAME_WIDTH / 2, panelY + 20, 'Signature Recipes', {
      fontFamily: 'Arial', fontSize: '26px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(GAME_WIDTH / 2, panelY + 52, `${this.gameState.recipes.length}/10 recipes`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#95A5A6',
    }).setOrigin(0.5, 0);

    this.contentContainer = this.add.container(0, 0);
    this.formContainer = this.add.container(0, 0);
    this.renderRecipes(panelX, panelY, panelW);

    // New Recipe button
    if (this.gameState.recipes.length < 10) {
      const newBtn = this.add.text(GAME_WIDTH / 2 - 80, panelY + panelH - 75, '+ New Recipe', {
        fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
        backgroundColor: '#27AE60', padding: { x: 14, y: 6 },
      }).setInteractive({ useHandCursor: true });

      newBtn.on('pointerdown', () => {
        if (!this.showingForm) {
          this.showCreateForm(panelX, panelY, panelW, panelH);
        }
      });
    }

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2 + 80, panelY + panelH - 75, 'Close', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 14, y: 6 },
    }).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.showingForm) {
        this.formContainer.removeAll(true);
        this.showingForm = false;
      } else {
        this.scene.resume('GameplayScene');
        this.scene.stop();
      }
    });
  }

  private renderRecipes(panelX: number, panelY: number, panelW: number): void {
    this.contentContainer.removeAll(true);

    if (this.gameState.recipes.length === 0) {
      const hint = this.add.text(GAME_WIDTH / 2, panelY + 100, 'No recipes yet. Create signature recipes\nto attract customers and charge premium prices!', {
        fontFamily: 'Arial', fontSize: '14px', color: '#95A5A6', align: 'center',
      }).setOrigin(0.5, 0);
      this.contentContainer.add(hint);
      return;
    }

    let y = panelY + 78;
    for (const recipe of this.gameState.recipes) {
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x34495E, 1);
      cardBg.fillRoundedRect(panelX + 20, y, panelW - 40, 70, 8);
      this.contentContainer.add(cardBg);

      // Name and rating
      const avgRating = this.gameState.getRecipeRating(recipe);
      const stars = recipe.timesSold >= 3 ? ` ${'*'.repeat(Math.round(avgRating * 5))}` : '';
      const nameText = this.add.text(panelX + 35, y + 8, `${recipe.name}${stars}`, {
        fontFamily: 'Arial', fontSize: '16px', color: '#FFF', fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      // Details
      const flavorName = this.gameState.flavors.find(f => f.id === recipe.flavorId)?.name ?? recipe.flavorId;
      const styleDef = SERVING_STYLE_CATALOG.find(s => s.id === recipe.style);
      const toppingNames = recipe.toppings.map(tid => {
        const tDef = TOPPING_CATALOG.find(t => t.ingredientId === tid);
        return tDef?.name ?? tid;
      }).join(', ');
      const desc = `${flavorName} ${styleDef?.name ?? recipe.style}${toppingNames ? ' + ' + toppingNames : ''}`;
      const descText = this.add.text(panelX + 35, y + 30, desc, {
        fontFamily: 'Arial', fontSize: '12px', color: '#BDC3C7',
        wordWrap: { width: panelW - 200 },
      });
      this.contentContainer.add(descText);

      // Stats
      const statsText = this.add.text(panelX + 35, y + 50, `$${recipe.price.toFixed(2)} | Sold: ${recipe.timesSold}`, {
        fontFamily: 'Arial', fontSize: '11px', color: '#7FDBFF',
      });
      this.contentContainer.add(statsText);

      // Delete button
      const delBtn = this.add.text(panelX + panelW - 45, y + 25, 'X', {
        fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
        backgroundColor: '#C0392B', padding: { x: 8, y: 4 },
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      delBtn.on('pointerdown', () => {
        this.gameState.deleteRecipe(recipe.id);
        this.scene.restart();
      });
      this.contentContainer.add(delBtn);

      y += 78;
    }
  }

  private showCreateForm(panelX: number, panelY: number, panelW: number, _panelH: number): void {
    this.showingForm = true;
    this.formContainer.removeAll(true);

    // Form overlay
    const formBg = this.add.graphics();
    formBg.fillStyle(0x1A2530, 0.95);
    formBg.fillRoundedRect(panelX + 30, panelY + 70, panelW - 60, 430, 10);
    this.formContainer.add(formBg);

    const fx = panelX + 50;
    let fy = panelY + 85;

    this.formContainer.add(this.add.text(fx, fy, 'Create New Recipe', {
      fontFamily: 'Arial', fontSize: '18px', color: '#F1C40F', fontStyle: 'bold',
    }));
    fy += 30;

    // State for selections
    const state = {
      name: 'My Recipe',
      flavorIdx: 0,
      styleIdx: 0,
      toppings: new Set<string>(),
    };

    const availableFlavors = this.gameState.flavors.filter(f => f.unlocked);
    const availableStyles = this.gameState.getAvailableStyles();
    const availableToppings = this.gameState.getAvailableToppings();

    // Name
    this.formContainer.add(this.add.text(fx, fy, 'Name:', {
      fontFamily: 'Arial', fontSize: '14px', color: '#BDC3C7',
    }));

    const nameDisplay = this.add.text(fx + 60, fy, state.name, {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 8, y: 2 },
    }).setInteractive({ useHandCursor: true });
    this.formContainer.add(nameDisplay);

    // Simple name cycling through presets
    const presetNames = ['Signature Scoop', 'House Special', 'Chef\'s Choice', 'Dream Sundae',
      'Classic Delight', 'Tropical Blast', 'Midnight Treat', 'Summer Breeze', 'Sweet Surprise', 'The Original'];
    let nameIdx = 0;
    nameDisplay.on('pointerdown', () => {
      nameIdx = (nameIdx + 1) % presetNames.length;
      state.name = presetNames[nameIdx];
      nameDisplay.setText(state.name);
    });
    fy += 28;

    // Flavor selector
    this.formContainer.add(this.add.text(fx, fy, 'Flavor:', {
      fontFamily: 'Arial', fontSize: '14px', color: '#BDC3C7',
    }));
    const flavorDisplay = this.add.text(fx + 60, fy, availableFlavors[0]?.name ?? 'None', {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 8, y: 2 },
    }).setInteractive({ useHandCursor: true });
    this.formContainer.add(flavorDisplay);

    flavorDisplay.on('pointerdown', () => {
      state.flavorIdx = (state.flavorIdx + 1) % availableFlavors.length;
      flavorDisplay.setText(availableFlavors[state.flavorIdx].name);
    });
    fy += 28;

    // Style selector
    this.formContainer.add(this.add.text(fx, fy, 'Style:', {
      fontFamily: 'Arial', fontSize: '14px', color: '#BDC3C7',
    }));
    const styleDisplay = this.add.text(fx + 60, fy, availableStyles[0]?.name ?? 'Cone', {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 8, y: 2 },
    }).setInteractive({ useHandCursor: true });
    this.formContainer.add(styleDisplay);

    styleDisplay.on('pointerdown', () => {
      state.styleIdx = (state.styleIdx + 1) % availableStyles.length;
      styleDisplay.setText(availableStyles[state.styleIdx].name);
    });
    fy += 32;

    // Toppings (toggle)
    this.formContainer.add(this.add.text(fx, fy, 'Toppings (click to toggle):', {
      fontFamily: 'Arial', fontSize: '14px', color: '#BDC3C7',
    }));
    fy += 22;

    for (const topping of availableToppings) {
      const tBtn = this.add.text(fx + 10, fy, `[ ] ${topping.name}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#95A5A6',
      }).setInteractive({ useHandCursor: true });
      this.formContainer.add(tBtn);

      tBtn.on('pointerdown', () => {
        if (state.toppings.has(topping.ingredientId)) {
          state.toppings.delete(topping.ingredientId);
          tBtn.setText(`[ ] ${topping.name}`);
          tBtn.setColor('#95A5A6');
        } else if (state.toppings.size < 3) {
          state.toppings.add(topping.ingredientId);
          tBtn.setText(`[x] ${topping.name}`);
          tBtn.setColor('#2ECC71');
        }
      });
      fy += 20;
    }

    fy += 10;

    // Price info
    const calcPrice = () => {
      const flavor = availableFlavors[state.flavorIdx];
      const style = availableStyles[state.styleIdx];
      const basePrice = (this.gameState.menuPrices.get(flavor?.id ?? '') ?? BASE_SCOOP_PRICE) * (style?.priceMult ?? 1);
      const toppingPrice = Array.from(state.toppings).reduce((sum, tid) => {
        const tDef = TOPPING_CATALOG.find(t => t.ingredientId === tid);
        return sum + (tDef?.price ?? 0.50);
      }, 0);
      return Math.round((basePrice + toppingPrice) * 1.15 * 100) / 100; // 15% recipe premium
    };

    const priceText = this.add.text(fx, fy, `Suggested price: $${calcPrice().toFixed(2)} (15% recipe premium)`, {
      fontFamily: 'Arial', fontSize: '13px', color: '#F1C40F',
    });
    this.formContainer.add(priceText);
    fy += 30;

    // Create button
    const createBtn = this.add.text(fx, fy, 'Create Recipe', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
      backgroundColor: '#27AE60', padding: { x: 14, y: 6 },
    }).setInteractive({ useHandCursor: true });
    this.formContainer.add(createBtn);

    createBtn.on('pointerdown', () => {
      const flavor = availableFlavors[state.flavorIdx];
      const style = availableStyles[state.styleIdx];
      if (!flavor || !style) return;

      const price = calcPrice();
      const result = this.gameState.createRecipe(
        state.name, flavor.id, Array.from(state.toppings), style.id, price
      );
      if (result) {
        this.scene.restart();
      }
    });

    // Cancel button
    const cancelBtn = this.add.text(fx + 160, fy, 'Cancel', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
      backgroundColor: '#7F8C8D', padding: { x: 14, y: 6 },
    }).setInteractive({ useHandCursor: true });
    this.formContainer.add(cancelBtn);

    cancelBtn.on('pointerdown', () => {
      this.formContainer.removeAll(true);
      this.showingForm = false;
    });
  }
}
