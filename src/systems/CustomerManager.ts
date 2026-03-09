import Phaser from 'phaser';
import { Customer } from '../entities/Customer';
import { GameState } from './GameState';
import { GAME_WIDTH, MAX_QUEUE_LENGTH, DayPhase } from '../config/constants';

const QUEUE_START_X = 240;
const QUEUE_START_Y = 480;
const QUEUE_SPACING = 70;

export class CustomerManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private queue: Customer[] = [];
  private spawnTimer: number = 0;
  private baseSpawnInterval: number = 4000; // ms between spawns at 1x

  // Stats for the day
  customersServed: number = 0;
  customersLost: number = 0;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;
  }

  update(delta: number): void {
    if (this.gameState.phase !== DayPhase.SERVE) return;

    const speed = this.gameState.gameSpeed;
    if (speed === 0) return;

    // Spawn new customers
    this.spawnTimer += delta * speed;
    const spawnInterval = this.getSpawnInterval();
    const effects = this.gameState.getEquipmentEffects();
    const maxQueue = MAX_QUEUE_LENGTH + (effects.capacityBonus ?? 0);
    if (this.spawnTimer >= spawnInterval && this.queue.length < maxQueue) {
      this.spawnTimer = 0;
      this.spawnCustomer();
    }

    // Update existing customers
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const customer = this.queue[i];
      customer.update(delta, speed);

      if (customer.left) {
        this.queue.splice(i, 1);
        this.customersLost++;
        this.repositionQueue();
      }
    }
  }

  private getSpawnInterval(): number {
    // More customers come as reputation increases
    const repBonus = this.gameState.reputation / 5;
    // More customers during peak hours (11am-2pm, 6pm-8pm)
    const hour = this.gameState.currentHour;
    let peakMult = 1.0;
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 20)) {
      peakMult = 0.6; // shorter interval = more customers
    }
    // Equipment serve speed multiplier reduces effective spawn interval
    const effects = this.gameState.getEquipmentEffects();
    const speedMult = effects.serveSpeedMult ?? 1.0;
    return this.baseSpawnInterval * peakMult * speedMult / Math.max(repBonus, 0.3);
  }

  private spawnCustomer(): void {
    const availableFlavors = this.gameState.flavors
      .filter(f => f.unlocked)
      .map(f => f.id);

    if (availableFlavors.length === 0) return;

    const slotIndex = this.queue.length;
    const x = QUEUE_START_X + slotIndex * QUEUE_SPACING;
    const y = QUEUE_START_Y;

    const customer = new Customer(this.scene, x, y, availableFlavors);

    // Entrance animation
    customer.sprite.setAlpha(0);
    customer.sprite.x = GAME_WIDTH + 50;
    this.scene.tweens.add({
      targets: customer.sprite,
      x,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });

    this.queue.push(customer);
  }

  private repositionQueue(): void {
    this.queue.forEach((customer, i) => {
      const targetX = QUEUE_START_X + i * QUEUE_SPACING;
      this.scene.tweens.add({
        targets: customer.sprite,
        x: targetX,
        duration: 300,
        ease: 'Power1',
      });
    });
  }

  serveFirstCustomer(): number | null {
    if (this.queue.length === 0) return null;

    const customer = this.queue[0];

    // Check if we have the ingredients
    if (!this.canFulfillOrder(customer)) return null;

    // Deduct ingredients
    this.deductIngredients(customer);

    // Serve and get revenue (equipment quality bonus increases tips)
    const effects = this.gameState.getEquipmentEffects();
    const revenue = customer.serve(effects.qualityBonus ?? 0);
    this.queue.shift();
    this.customersServed++;
    this.repositionQueue();

    return revenue;
  }

  private canFulfillOrder(customer: Customer): boolean {
    // Check each item's flavor ingredients are available
    for (const item of customer.order.items) {
      const flavor = this.gameState.flavors.find(f => f.id === item.flavorId);
      if (!flavor) return false;

      for (const ingId of flavor.ingredients) {
        const ing = this.gameState.ingredients.find(i => i.id === ingId);
        if (!ing || ing.quantity < 1) return false;
      }
    }
    return true;
  }

  private deductIngredients(customer: Customer): void {
    for (const item of customer.order.items) {
      const flavor = this.gameState.flavors.find(f => f.id === item.flavorId);
      if (!flavor) continue;

      for (const ingId of flavor.ingredients) {
        const ing = this.gameState.ingredients.find(i => i.id === ingId);
        if (ing) ing.quantity -= 1;
      }

      // Deduct topping ingredients
      for (const toppingId of item.toppings) {
        const ing = this.gameState.ingredients.find(i => i.id === toppingId);
        if (ing) ing.quantity -= 1;
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  resetDayStats(): void {
    this.customersServed = 0;
    this.customersLost = 0;
    this.spawnTimer = 0;
  }

  clearQueue(): void {
    this.queue.forEach(c => c.destroy());
    this.queue = [];
  }
}
