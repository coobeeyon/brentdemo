import Phaser from 'phaser';
import { BASE_PATIENCE_MS, BASE_SCOOP_PRICE, BASE_TOPPING_PRICE } from '../config/constants';

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
  style: 'cone' | 'cup' | 'sundae';
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

  // Visual elements
  private bodyCircle!: Phaser.GameObjects.Graphics;
  private patienceBar!: Phaser.GameObjects.Graphics;
  private orderBubble!: Phaser.GameObjects.Container;
  private nameTag!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, availableFlavors: string[]) {
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

    // Generate order
    this.order = this.generateOrder(availableFlavors);

    // Create visuals
    this.sprite = scene.add.container(x, y);
    this.createVisuals();
  }

  private generateOrder(availableFlavors: string[]): Order {
    const numScoops = this.type === CustomerType.CHILD ? 1 :
      this.type === CustomerType.TOURIST ? Math.ceil(Math.random() * 3) :
      Math.ceil(Math.random() * 2);

    const styles: ('cone' | 'cup' | 'sundae')[] = ['cone', 'cup', 'sundae'];
    const items: OrderItem[] = [];

    for (let i = 0; i < numScoops; i++) {
      const flavorId = availableFlavors[Math.floor(Math.random() * availableFlavors.length)];
      const toppings: string[] = [];
      if (Math.random() > 0.5) toppings.push('sprinkles');
      if (Math.random() > 0.7) toppings.push('cream');

      items.push({
        flavorId,
        toppings,
        style: i === 0 ? styles[Math.floor(Math.random() * styles.length)] : items[0].style,
      });
    }

    const totalPrice = items.reduce((sum, item) => {
      return sum + BASE_SCOOP_PRICE + item.toppings.length * BASE_TOPPING_PRICE;
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
