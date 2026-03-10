import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SupplierDef, SUPPLIER_CATALOG, BULK_DISCOUNT_TIERS, LOW_STOCK_THRESHOLD } from '../config/constants';
import { GameState, getGameState, Ingredient } from '../systems/GameState';

interface ShopItem {
  id: string;
  name: string;
  basePrice: number;
  bulkSize: number; // units per purchase
  expiresInDays: number;
}

const SHOP_CATALOG: ShopItem[] = [
  // Base ingredients
  { id: 'milk', name: 'Milk', basePrice: 5.00, bulkSize: 10, expiresInDays: 3 },
  { id: 'sugar', name: 'Sugar', basePrice: 3.00, bulkSize: 20, expiresInDays: 30 },
  { id: 'vanilla_extract', name: 'Vanilla Extract', basePrice: 8.00, bulkSize: 10, expiresInDays: 60 },
  { id: 'cocoa', name: 'Cocoa Powder', basePrice: 6.00, bulkSize: 10, expiresInDays: 30 },
  { id: 'strawberries', name: 'Strawberries', basePrice: 5.00, bulkSize: 10, expiresInDays: 2 },
  // Toppings
  { id: 'cream', name: 'Whipped Cream', basePrice: 4.00, bulkSize: 10, expiresInDays: 5 },
  { id: 'sprinkles', name: 'Sprinkles', basePrice: 1.50, bulkSize: 20, expiresInDays: 90 },
  { id: 'hot_fudge', name: 'Hot Fudge', basePrice: 5.00, bulkSize: 10, expiresInDays: 14 },
  { id: 'cherries', name: 'Cherries', basePrice: 3.50, bulkSize: 10, expiresInDays: 5 },
  { id: 'nuts', name: 'Crushed Nuts', basePrice: 4.00, bulkSize: 10, expiresInDays: 30 },
  { id: 'candy_pieces', name: 'Candy Pieces', basePrice: 3.00, bulkSize: 15, expiresInDays: 60 },
  { id: 'fruit', name: 'Fresh Fruit', basePrice: 5.50, bulkSize: 10, expiresInDays: 3 },
  { id: 'caramel', name: 'Caramel Drizzle', basePrice: 4.50, bulkSize: 10, expiresInDays: 21 },
];

const EMERGENCY_MARKUP = 1.5;

export class ShopScene extends Phaser.Scene {
  private gameState!: GameState;
  private moneyText!: Phaser.GameObjects.Text;
  private itemRows: Phaser.GameObjects.Container[] = [];
  private isEmergency = false;
  private currentSupplier: SupplierDef = SUPPLIER_CATALOG[1]; // default: Main Street (restored from registry in create)

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.itemRows = [];

    // Restore selected supplier from registry (persists across scene.restart())
    const savedSupplierId = this.registry.get('selectedSupplier');
    if (savedSupplierId !== undefined) {
      const saved = SUPPLIER_CATALOG.find(s => s.id === savedSupplierId);
      if (saved) this.currentSupplier = saved;
    }

    // Check if this is an emergency resupply (during serve phase)
    this.isEmergency = this.registry.get('emergencyResupply') === true;
    this.registry.set('emergencyResupply', false);

    // Reset supplier quality bonus at start of each prepare phase
    // so it only applies for the day the player buys from that supplier.
    // Only reset on fresh open, not on tab-switch restarts (scene.restart()).
    const shopJustOpened = this.registry.get('shopJustOpened') === true;
    if (shopJustOpened) {
      this.registry.set('shopJustOpened', false);
      if (!this.isEmergency) {
        this.registry.set('supplierQualityBonus', 0);
      }
    }

    // Overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelX = GAME_WIDTH / 2 - 300;
    const panelY = 10;
    const panelW = 600;
    const panelH = 700;

    const panel = this.add.graphics();
    panel.fillStyle(this.isEmergency ? 0x4A1A2E : 0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    const titleLabel = this.isEmergency ? '🚚 Emergency Resupply (1.5x prices!)' : '🛒 Ingredient Shop';
    this.add.text(GAME_WIDTH / 2, panelY + 25, titleLabel, {
      fontFamily: 'Arial',
      fontSize: this.isEmergency ? '24px' : '28px',
      color: this.isEmergency ? '#E74C3C' : '#FFF',
    }).setOrigin(0.5);

    // Supplier selector tabs
    const supplierY = panelY + 52;
    const tabWidth = 180;
    const tabStartX = GAME_WIDTH / 2 - (SUPPLIER_CATALOG.length * tabWidth) / 2;
    const supplierTabs: Phaser.GameObjects.Text[] = [];

    SUPPLIER_CATALOG.forEach((supplier, idx) => {
      const tabX = tabStartX + idx * tabWidth + tabWidth / 2;
      const isActive = supplier.id === this.currentSupplier.id;
      const tab = this.add.text(tabX, supplierY, `${supplier.icon} ${supplier.name}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: isActive ? '#FFF' : '#95A5A6',
        backgroundColor: isActive ? '#2980B9' : '#1A252F',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      tab.on('pointerdown', () => {
        this.currentSupplier = supplier;
        this.registry.set('selectedSupplier', supplier.id);
        if (this.isEmergency) {
          this.registry.set('emergencyResupply', true);
        }
        this.scene.restart(); // re-render with new supplier
      });

      supplierTabs.push(tab);
    });

    // Supplier description
    const descText = this.currentSupplier.qualityBonus > 0
      ? `${this.currentSupplier.description} (+${Math.round(this.currentSupplier.qualityBonus * 100)}% quality)`
      : this.currentSupplier.description;
    this.add.text(GAME_WIDTH / 2, supplierY + 18, descText, {
      fontFamily: 'Arial', fontSize: '11px', color: '#7F8C8D',
    }).setOrigin(0.5);

    // Balance display
    this.moneyText = this.add.text(GAME_WIDTH / 2, panelY + 82, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#2ECC40',
    }).setOrigin(0.5);

    // Bulk discount info
    this.add.text(GAME_WIDTH / 2, panelY + 102, 'Bulk: 3+ batches → 10% off  |  5+ batches → 20% off', {
      fontFamily: 'Arial', fontSize: '11px', color: '#F39C12',
    }).setOrigin(0.5);

    // Column headers
    const headerY = panelY + 118;
    const colX = { name: panelX + 20, stock: panelX + 180, price: panelX + 280, qty: panelX + 380, buy: panelX + 500 };

    const headerStyle = { fontFamily: 'Arial', fontSize: '14px', color: '#95A5A6' };
    this.add.text(colX.name, headerY, 'INGREDIENT', headerStyle);
    this.add.text(colX.stock, headerY, 'IN STOCK', headerStyle);
    this.add.text(colX.price, headerY, 'PRICE', headerStyle);
    this.add.text(colX.qty, headerY, 'QTY', headerStyle);
    this.add.text(colX.buy, headerY, '', headerStyle);

    // Location indicator in franchise mode
    if (this.gameState.franchiseMode) {
      this.add.text(GAME_WIDTH / 2, panelY + 42, `📍 ${this.gameState.locationName}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#F1C40F',
      }).setOrigin(0.5);
    }

    // Supply guidance hint for new players (Day 1, low stock)
    const loc = this.gameState.loc;
    const totalStock = loc.ingredients.reduce((sum, i) => sum + i.quantity, 0);
    if (this.gameState.day <= 3 || totalStock < 30) {
      this.add.text(GAME_WIDTH / 2, panelY + 132, 'Tip: Buy at least milk, sugar, and one flavor extract to serve customers!', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#F1C40F',
      }).setOrigin(0.5);
    }

    // Filter catalog by current supplier's excluded ingredients
    const excluded = new Set(this.currentSupplier.excludedIngredients ?? []);
    const filteredCatalog = SHOP_CATALOG.filter(item => !excluded.has(item.id));

    // Item rows
    filteredCatalog.forEach((item, i) => {
      this.createShopRow(item, i, panelX, panelY + 148, colX);
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
      this.registry.remove('selectedSupplier');
      this.scene.resume('GameplayScene');
      this.scene.stop();
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.registry.remove('selectedSupplier');
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
    const y = startY + index * 38;
    const row = this.add.container(0, 0);

    // Row background
    const rowBg = this.add.graphics();
    rowBg.fillStyle(index % 2 === 0 ? 0x34495E : 0x2C3E50, 1);
    rowBg.fillRect(panelX + 10, y - 3, 580, 34);
    row.add(rowBg);

    // Name with expiry hint
    const nameText = this.add.text(colX.name, y + 8, `${item.name} (${item.expiresInDays}d)`, {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFF',
    });
    row.add(nameText);

    // Current stock with low-stock warning
    const existing = this.gameState.loc.ingredients.find(i => i.id === item.id);
    const currentQty = existing?.quantity ?? 0;
    const isBaseIngredient = ['milk', 'sugar', 'vanilla_extract', 'cocoa', 'strawberries'].includes(item.id);
    const isLow = isBaseIngredient && currentQty < LOW_STOCK_THRESHOLD;
    const stockLabel = isLow ? `${currentQty} ⚠` : `${currentQty}`;
    const stockColor = isLow ? '#E74C3C' : '#FFF';
    const stockText = this.add.text(colX.stock, y + 8, stockLabel, {
      fontFamily: 'Arial', fontSize: '14px', color: stockColor,
    });
    row.add(stockText);

    // Price with fluctuation
    const priceMult = this.getPriceMultiplier(item.id);
    const actualPrice = Math.round(item.basePrice * priceMult * 100) / 100;
    const priceColor = priceMult > 1.1 ? '#E74C3C' : priceMult < 0.9 ? '#2ECC71' : '#FFF';
    const priceText = this.add.text(colX.price, y + 8, `$${actualPrice.toFixed(2)}/${item.bulkSize}`, {
      fontFamily: 'Arial', fontSize: '14px', color: priceColor,
    });
    row.add(priceText);

    // Quantity selector
    let qty = 1;
    const qtyText = this.add.text(colX.qty + 25, y + 10, '1', {
      fontFamily: 'Arial', fontSize: '16px', color: '#FFF',
    }).setOrigin(0.5);
    row.add(qtyText);

    // Buy button (declared early so updateBuyLabel can reference it)
    const buyBtn = this.add.text(colX.buy, y + 10, 'Buy', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFF',
      backgroundColor: '#27AE60',
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const updateBuyLabel = () => {
      const discount = this.getBulkDiscount(qty);
      const total = actualPrice * qty * (1 - discount);
      if (discount > 0) {
        buyBtn.setText(`Buy $${total.toFixed(2)} (${Math.round(discount * 100)}% off)`);
      } else {
        buyBtn.setText(`Buy $${(actualPrice * qty).toFixed(2)}`);
      }
    };
    updateBuyLabel();

    const minusBtn = this.add.text(colX.qty, y + 10, '−', {
      fontFamily: 'Arial', fontSize: '18px', color: '#E74C3C',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => {
      if (qty > 1) { qty--; qtyText.setText(`${qty}`); updateBuyLabel(); }
    });
    row.add(minusBtn);

    const plusBtn = this.add.text(colX.qty + 50, y + 10, '+', {
      fontFamily: 'Arial', fontSize: '18px', color: '#2ECC71',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => {
      if (qty < 10) { qty++; qtyText.setText(`${qty}`); updateBuyLabel(); }
    });
    row.add(plusBtn);

    buyBtn.on('pointerdown', () => {
      const discount = this.getBulkDiscount(qty);
      const totalCost = actualPrice * qty * (1 - discount);
      if (this.gameState.loc.money >= totalCost) {
        this.gameState.loc.money -= totalCost;
        this.gameState.loc.dailyExpenses += totalCost;

        // Add to inventory
        const existingIng = this.gameState.loc.ingredients.find(i => i.id === item.id);
        if (existingIng) {
          existingIng.quantity += item.bulkSize * qty;
          // Refresh expiry to max of existing and new
          existingIng.expiresInDays = Math.max(existingIng.expiresInDays, item.expiresInDays);
        } else {
          this.gameState.loc.ingredients.push({
            id: item.id,
            name: item.name,
            quantity: item.bulkSize * qty,
            costPer: actualPrice / item.bulkSize,
            expiresInDays: item.expiresInDays,
          });
        }

        // Track supplier quality bonus for serving phase
        if (this.currentSupplier.qualityBonus > 0) {
          const existing = (this.registry.get('supplierQualityBonus') as number) ?? 0;
          this.registry.set('supplierQualityBonus', Math.max(existing, this.currentSupplier.qualityBonus));
        }

        // Refresh stock display with low-stock re-evaluation
        const newQty = this.gameState.loc.ingredients.find(i => i.id === item.id)?.quantity ?? 0;
        const newIsLow = isBaseIngredient && newQty < LOW_STOCK_THRESHOLD;
        stockText.setText(newIsLow ? `${newQty} ⚠` : `${newQty}`);
        stockText.setColor(newIsLow ? '#E74C3C' : '#FFF');
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
    const baseMult = 0.75 + (Math.abs(seed) % 60) / 100;
    // Supplier pricing
    const supplierMult = this.currentSupplier.priceMult;
    // Apply event price modifier (supply shortage / bulk discount)
    const eventMult = (this.registry.get('eventIngredientPriceMult') as number) ?? 1.0;
    // Emergency resupply markup
    const emergencyMult = this.isEmergency ? EMERGENCY_MARKUP : 1.0;
    return baseMult * supplierMult * eventMult * emergencyMult;
  }

  /** Get bulk discount fraction for a given quantity */
  private getBulkDiscount(qty: number): number {
    for (const [minQty, discount] of BULK_DISCOUNT_TIERS) {
      if (qty >= minQty) return discount;
    }
    return 0;
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
    this.moneyText.setText(`Balance: $${this.gameState.loc.money.toFixed(2)}`);
  }
}
