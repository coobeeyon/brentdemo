import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { GameState, getGameState, Ingredient } from '../systems/GameState';

interface ShopItem {
  id: string;
  name: string;
  basePrice: number;
  bulkSize: number; // units per purchase
  expiresInDays: number;
}

const SHOP_CATALOG: ShopItem[] = [
  { id: 'milk', name: 'Milk', basePrice: 5.00, bulkSize: 10, expiresInDays: 3 },
  { id: 'sugar', name: 'Sugar', basePrice: 3.00, bulkSize: 20, expiresInDays: 30 },
  { id: 'vanilla_extract', name: 'Vanilla Extract', basePrice: 8.00, bulkSize: 10, expiresInDays: 60 },
  { id: 'cocoa', name: 'Cocoa Powder', basePrice: 6.00, bulkSize: 10, expiresInDays: 30 },
  { id: 'strawberries', name: 'Strawberries', basePrice: 5.00, bulkSize: 10, expiresInDays: 2 },
  { id: 'cream', name: 'Whipped Cream', basePrice: 4.00, bulkSize: 10, expiresInDays: 5 },
  { id: 'sprinkles', name: 'Sprinkles', basePrice: 1.50, bulkSize: 20, expiresInDays: 90 },
];

export class ShopScene extends Phaser.Scene {
  private gameState!: GameState;
  private moneyText!: Phaser.GameObjects.Text;
  private itemRows: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.itemRows = [];

    // Overlay background
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
    this.add.text(GAME_WIDTH / 2, panelY + 25, '🛒 Ingredient Shop', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFF',
    }).setOrigin(0.5);

    // Balance display
    this.moneyText = this.add.text(GAME_WIDTH / 2, panelY + 60, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#2ECC40',
    }).setOrigin(0.5);

    // Column headers
    const headerY = panelY + 95;
    const colX = { name: panelX + 20, stock: panelX + 180, price: panelX + 280, qty: panelX + 380, buy: panelX + 500 };

    const headerStyle = { fontFamily: 'Arial', fontSize: '14px', color: '#95A5A6' };
    this.add.text(colX.name, headerY, 'INGREDIENT', headerStyle);
    this.add.text(colX.stock, headerY, 'IN STOCK', headerStyle);
    this.add.text(colX.price, headerY, 'PRICE', headerStyle);
    this.add.text(colX.qty, headerY, 'QTY', headerStyle);
    this.add.text(colX.buy, headerY, '', headerStyle);

    // Item rows
    SHOP_CATALOG.forEach((item, i) => {
      this.createShopRow(item, i, panelX, panelY + 120, colX);
    });

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, '← Back to Store', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFF',
      backgroundColor: '#E74C3C',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });

    this.updateDisplay();
  }

  private createShopRow(
    item: ShopItem,
    index: number,
    panelX: number,
    startY: number,
    colX: Record<string, number>,
  ): void {
    const y = startY + index * 58;
    const row = this.add.container(0, 0);

    // Row background
    const rowBg = this.add.graphics();
    rowBg.fillStyle(index % 2 === 0 ? 0x34495E : 0x2C3E50, 1);
    rowBg.fillRect(panelX + 10, y - 5, 580, 50);
    row.add(rowBg);

    // Name & expires
    const nameText = this.add.text(colX.name, y + 5, item.name, {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
    });
    row.add(nameText);

    const expiryText = this.add.text(colX.name, y + 26, `Expires: ${item.expiresInDays}d`, {
      fontFamily: 'Arial', fontSize: '11px', color: '#7F8C8D',
    });
    row.add(expiryText);

    // Current stock
    const existing = this.gameState.ingredients.find(i => i.id === item.id);
    const stockText = this.add.text(colX.stock, y + 12, `${existing?.quantity ?? 0}`, {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
    });
    row.add(stockText);

    // Price with fluctuation
    const priceMult = this.getPriceMultiplier(item.id);
    const actualPrice = Math.round(item.basePrice * priceMult * 100) / 100;
    const priceColor = priceMult > 1.1 ? '#E74C3C' : priceMult < 0.9 ? '#2ECC71' : '#FFF';
    const priceText = this.add.text(colX.price, y + 5, `$${actualPrice.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: '16px', color: priceColor,
    });
    row.add(priceText);

    const perUnitText = this.add.text(colX.price, y + 26, `per ${item.bulkSize} units`, {
      fontFamily: 'Arial', fontSize: '11px', color: '#7F8C8D',
    });
    row.add(perUnitText);

    // Quantity selector
    let qty = 1;
    const qtyText = this.add.text(colX.qty + 25, y + 12, '1', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFF',
    }).setOrigin(0.5);
    row.add(qtyText);

    const minusBtn = this.add.text(colX.qty, y + 12, '−', {
      fontFamily: 'Arial', fontSize: '20px', color: '#E74C3C',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => {
      if (qty > 1) { qty--; qtyText.setText(`${qty}`); }
    });
    row.add(minusBtn);

    const plusBtn = this.add.text(colX.qty + 50, y + 12, '+', {
      fontFamily: 'Arial', fontSize: '20px', color: '#2ECC71',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => {
      if (qty < 10) { qty++; qtyText.setText(`${qty}`); }
    });
    row.add(plusBtn);

    // Buy button
    const buyBtn = this.add.text(colX.buy, y + 12, 'Buy', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFF',
      backgroundColor: '#27AE60',
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    buyBtn.on('pointerdown', () => {
      const totalCost = actualPrice * qty;
      if (this.gameState.money >= totalCost) {
        this.gameState.money -= totalCost;
        this.gameState.dailyExpenses += totalCost;

        // Add to inventory
        const existingIng = this.gameState.ingredients.find(i => i.id === item.id);
        if (existingIng) {
          existingIng.quantity += item.bulkSize * qty;
          // Refresh expiry to max of existing and new
          existingIng.expiresInDays = Math.max(existingIng.expiresInDays, item.expiresInDays);
        } else {
          this.gameState.ingredients.push({
            id: item.id,
            name: item.name,
            quantity: item.bulkSize * qty,
            costPer: actualPrice / item.bulkSize,
            expiresInDays: item.expiresInDays,
          });
        }

        stockText.setText(`${this.gameState.ingredients.find(i => i.id === item.id)?.quantity ?? 0}`);
        this.updateDisplay();

        // Flash feedback
        buyBtn.setStyle({ backgroundColor: '#1E8449' });
        this.time.delayedCall(200, () => buyBtn.setStyle({ backgroundColor: '#27AE60' }));
      } else {
        // Can't afford — flash red
        buyBtn.setStyle({ backgroundColor: '#C0392B' });
        this.time.delayedCall(300, () => buyBtn.setStyle({ backgroundColor: '#27AE60' }));
      }
    });

    row.add(buyBtn);
    this.itemRows.push(row);
  }

  private getPriceMultiplier(ingredientId: string): number {
    // Seasonal price fluctuation based on day
    const day = this.gameState.day;
    const seed = this.hashCode(ingredientId + day.toString());
    // Range: 0.75 to 1.35
    return 0.75 + (Math.abs(seed) % 60) / 100;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  private updateDisplay(): void {
    this.moneyText.setText(`Balance: $${this.gameState.money.toFixed(2)}`);
  }
}
