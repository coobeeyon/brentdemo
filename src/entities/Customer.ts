import Phaser from 'phaser';
import {
  BASE_PATIENCE_MS, BASE_SCOOP_PRICE, ToppingDef, ServingStyleDef, SERVING_STYLE_CATALOG,
  DietaryRestriction, DAIRY_INGREDIENTS, NUT_INGREDIENTS, FLAVOR_CATALOG, FlavorDef,
} from '../config/constants';

export enum CustomerType {
  REGULAR = 'regular',
  TOURIST = 'tourist',
  CHILD = 'child',
  CRITIC = 'critic',
  VIP = 'vip',
}

export interface OrderItem {
  flavorId: string;
  toppings: string[];
  style: string;
}

export interface Order {
  items: OrderItem[];
  totalPrice: number;
}

const CUSTOMER_TYPE_WEIGHTS: { type: CustomerType; weight: number; patienceMult: number; tipMult: number }[] = [
  { type: CustomerType.REGULAR, weight: 60, patienceMult: 1.0, tipMult: 1.0 },
  { type: CustomerType.TOURIST, weight: 15, patienceMult: 1.2, tipMult: 1.8 },
  { type: CustomerType.CHILD, weight: 15, patienceMult: 0.5, tipMult: 0.5 },
  { type: CustomerType.CRITIC, weight: 5, patienceMult: 0.8, tipMult: 2.0 },
  { type: CustomerType.VIP, weight: 5, patienceMult: 0.7, tipMult: 2.5 },
];

const CUSTOMER_COLORS: Record<CustomerType, number> = {
  [CustomerType.REGULAR]: 0x4A90D9,
  [CustomerType.TOURIST]: 0x2ECC71,
  [CustomerType.CHILD]: 0xF39C12,
  [CustomerType.CRITIC]: 0x9B59B6,
  [CustomerType.VIP]: 0xE74C3C,
};

export class Customer {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Container;
  type: CustomerType;
  order: Order;
  maxPatience: number;
  patience: number;
  tipMultiplier: number;
  served: boolean = false;
  left: boolean = false;
  dietaryRestriction: DietaryRestriction = DietaryRestriction.NONE;
  likedFlavors: string[] = [];   // flavor ids this customer prefers (2x order chance)
  dislikedFlavors: string[] = []; // flavor ids this customer avoids

  // Visual elements
  private bodyCircle!: Phaser.GameObjects.Graphics;
  private patienceBar!: Phaser.GameObjects.Graphics;
  private orderBubble!: Phaser.GameObjects.Container;
  private nameTag!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, availableFlavors: string[], menuPrices?: Map<string, number>, availableToppings?: ToppingDef[], availableStyles?: ServingStyleDef[]) {
    this.scene = scene;

    // Pick random type
    const roll = Math.random() * 100;
    let cumulative = 0;
    let typeInfo = CUSTOMER_TYPE_WEIGHTS[0];
    for (const t of CUSTOMER_TYPE_WEIGHTS) {
      cumulative += t.weight;
      if (roll < cumulative) {
        typeInfo = t;
        break;
      }
    }

    this.type = typeInfo.type;
    this.maxPatience = BASE_PATIENCE_MS * typeInfo.patienceMult;
    this.patience = this.maxPatience;
    this.tipMultiplier = typeInfo.tipMult;

    // Assign dietary restriction (15% chance of vegan, 10% nut-free)
    const dietRoll = Math.random();
    if (dietRoll < 0.15) {
      this.dietaryRestriction = DietaryRestriction.VEGAN;
    } else if (dietRoll < 0.25) {
      this.dietaryRestriction = DietaryRestriction.NUT_FREE;
    }

    // Assign flavor preferences from the full catalog
    this.generatePreferences(availableFlavors);

    // Generate order
    this.order = this.generateOrder(availableFlavors, menuPrices, availableToppings ?? [], availableStyles ?? SERVING_STYLE_CATALOG.filter(s => !s.requiredEquipment));

    // Create visuals
    this.sprite = scene.add.container(x, y);
    this.createVisuals();
  }

  /** Check if a flavor is compatible with this customer's dietary restriction */
  private flavorAllowed(flavorId: string): boolean {
    const def = FLAVOR_CATALOG.find(f => f.id === flavorId);
    if (!def) return true;
    if (this.dietaryRestriction === DietaryRestriction.VEGAN) {
      return !def.ingredients.some(i => DAIRY_INGREDIENTS.includes(i));
    }
    if (this.dietaryRestriction === DietaryRestriction.NUT_FREE) {
      return !def.ingredients.some(i => NUT_INGREDIENTS.includes(i));
    }
    return true;
  }

  /** Check if a topping is compatible with this customer's dietary restriction */
  private toppingAllowed(toppingIngredientId: string): boolean {
    if (this.dietaryRestriction === DietaryRestriction.VEGAN) {
      return !DAIRY_INGREDIENTS.includes(toppingIngredientId);
    }
    if (this.dietaryRestriction === DietaryRestriction.NUT_FREE) {
      return !NUT_INGREDIENTS.includes(toppingIngredientId);
    }
    return true;
  }

  /** Assign 1-2 liked flavors and 0-1 disliked flavors from available options */
  private generatePreferences(availableFlavors: string[]): void {
    const pool = availableFlavors.filter(f => this.flavorAllowed(f));
    if (pool.length === 0) return;

    // Pick 1-2 liked flavors
    const numLiked = Math.min(pool.length, 1 + (Math.random() < 0.5 ? 1 : 0));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    this.likedFlavors = shuffled.slice(0, numLiked);

    // Pick 0-1 disliked flavors (from remaining)
    const remaining = shuffled.slice(numLiked);
    if (remaining.length > 0 && Math.random() < 0.4) {
      this.dislikedFlavors = [remaining[0]];
    }
  }

  /** Pick a flavor with liked flavors getting 2x weight */
  private pickWeightedFlavor(pool: string[]): string {
    if (pool.length === 0) return 'vanilla'; // shouldn't happen
    const weights = pool.map(f => this.likedFlavors.includes(f) ? 2 : 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  private generateOrder(availableFlavors: string[], menuPrices?: Map<string, number>, availableToppings: ToppingDef[] = [], availableStyles: ServingStyleDef[] = []): Order {
    // Pick a serving style
    const styleDef = availableStyles.length > 0
      ? availableStyles[Math.floor(Math.random() * availableStyles.length)]
      : SERVING_STYLE_CATALOG[0]; // fallback to cone

    const maxScoops = styleDef.maxScoops;
    const numScoops = this.type === CustomerType.CHILD ? 1 :
      this.type === CustomerType.TOURIST ? Math.ceil(Math.random() * Math.min(3, maxScoops)) :
      Math.ceil(Math.random() * Math.min(2, maxScoops));

    // Filter flavors by dietary restriction and dislike
    const allowedFlavors = availableFlavors.filter(
      f => this.flavorAllowed(f) && !this.dislikedFlavors.includes(f)
    );
    // If restriction removes everything, fall back to full list
    const flavorPool = allowedFlavors.length > 0 ? allowedFlavors : availableFlavors;

    // Filter toppings by dietary restriction
    const allowedToppings = availableToppings.filter(t => this.toppingAllowed(t.ingredientId));

    const items: OrderItem[] = [];

    for (let i = 0; i < numScoops; i++) {
      // Weighted selection: liked flavors get 2x weight
      const flavorId = this.pickWeightedFlavor(flavorPool);

      // Pick toppings based on available catalog and popularity
      const toppings: string[] = [];
      for (const topping of allowedToppings) {
        if (Math.random() < topping.popularity) {
          toppings.push(topping.ingredientId);
        }
      }
      // Cap at 3 toppings max
      while (toppings.length > 3) {
        toppings.splice(Math.floor(Math.random() * toppings.length), 1);
      }

      items.push({
        flavorId,
        toppings,
        style: styleDef.id,
      });
    }

    const totalPrice = items.reduce((sum, item) => {
      const scoopPrice = (menuPrices?.get(item.flavorId) ?? BASE_SCOOP_PRICE) * styleDef.priceMult;
      // Sum topping prices from catalog, falling back to base price
      const toppingTotal = item.toppings.reduce((tSum, tId) => {
        const tDef = availableToppings.find(t => t.ingredientId === tId);
        return tSum + (tDef?.price ?? 0.50);
      }, 0);
      return sum + scoopPrice + toppingTotal;
    }, 0);

    return { items, totalPrice };
  }

  private createVisuals(): void {
    const color = CUSTOMER_COLORS[this.type];

    // Body
    this.bodyCircle = this.scene.add.graphics();
    this.bodyCircle.fillStyle(color, 1);
    this.bodyCircle.fillCircle(0, 0, 18);
    // Head
    this.bodyCircle.fillStyle(0xFFDBAC, 1);
    this.bodyCircle.fillCircle(0, -12, 10);
    this.sprite.add(this.bodyCircle);

    // Type label
    const typeLabels: Record<CustomerType, string> = {
      [CustomerType.REGULAR]: '',
      [CustomerType.TOURIST]: '📷',
      [CustomerType.CHILD]: '🧒',
      [CustomerType.CRITIC]: '📝',
      [CustomerType.VIP]: '⭐',
    };
    if (typeLabels[this.type]) {
      const label = this.scene.add.text(12, -22, typeLabels[this.type], { fontSize: '12px' });
      this.sprite.add(label);
    }

    // Dietary restriction icon
    const dietIcons: Record<DietaryRestriction, string> = {
      [DietaryRestriction.NONE]: '',
      [DietaryRestriction.VEGAN]: '🌱',
      [DietaryRestriction.NUT_FREE]: '🚫🥜',
    };
    if (dietIcons[this.dietaryRestriction]) {
      const dietLabel = this.scene.add.text(-20, -22, dietIcons[this.dietaryRestriction], { fontSize: '10px' });
      this.sprite.add(dietLabel);
    }

    // Patience bar
    this.patienceBar = this.scene.add.graphics();
    this.sprite.add(this.patienceBar);
    this.updatePatienceBar();

    // Order bubble
    this.orderBubble = this.scene.add.container(0, -40);
    const bubbleBg = this.scene.add.graphics();
    bubbleBg.fillStyle(0xFFFFFF, 0.9);
    bubbleBg.fillRoundedRect(-30, -18, 60, 22, 8);
    bubbleBg.lineStyle(1, 0xCCCCCC);
    bubbleBg.strokeRoundedRect(-30, -18, 60, 22, 8);
    this.orderBubble.add(bubbleBg);

    const orderText = this.scene.add.text(0, -10, this.getOrderSummary(), {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#333',
    }).setOrigin(0.5);
    this.orderBubble.add(orderText);
    this.sprite.add(this.orderBubble);
  }

  private getOrderSummary(): string {
    const items = this.order.items;
    if (items.length === 1) {
      return `${items[0].flavorId.slice(0, 4)} ${items[0].style}`;
    }
    return `${items.length}x ${items[0].style}`;
  }

  private updatePatienceBar(): void {
    this.patienceBar.clear();

    const ratio = this.patience / this.maxPatience;
    const barWidth = 30;
    const barHeight = 4;

    // Background
    this.patienceBar.fillStyle(0x333333, 0.5);
    this.patienceBar.fillRect(-barWidth / 2, 22, barWidth, barHeight);

    // Fill — green to red
    const color = ratio > 0.5 ? 0x2ECC71 : ratio > 0.25 ? 0xF39C12 : 0xE74C3C;
    this.patienceBar.fillStyle(color, 1);
    this.patienceBar.fillRect(-barWidth / 2, 22, barWidth * ratio, barHeight);
  }

  update(delta: number, gameSpeed: number): void {
    if (this.served || this.left) return;

    this.patience -= delta * gameSpeed;

    if (this.patience <= 0) {
      this.patience = 0;
      this.left = true;
      this.onLeaveAngry();
    }

    this.updatePatienceBar();

    // Impatient jiggle when patience is low
    if (this.patience < this.maxPatience * 0.25) {
      this.sprite.x += Math.sin(Date.now() / 50) * 0.5;
    }
  }

  serve(qualityBonus: number = 0): number {
    this.served = true;
    this.orderBubble.setVisible(false);

    // Happy animation
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 20,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => this.sprite.destroy(),
    });

    // Calculate tip based on remaining patience + equipment quality bonus
    const patienceRatio = this.patience / this.maxPatience;
    const tip = this.order.totalPrice * (0.1 + qualityBonus) * patienceRatio * this.tipMultiplier;
    return this.order.totalPrice + tip;
  }

  private onLeaveAngry(): void {
    // Angry shake then leave
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x - 200,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => this.sprite.destroy(),
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
