import Phaser from 'phaser';
import { Customer, CustomerType } from '../entities/Customer';
import { GameState, CriticReview } from './GameState';
import { GameEventEffects } from './EventManager';
import { GAME_WIDTH, MAX_QUEUE_LENGTH, DayPhase } from '../config/constants';

const QUEUE_START_X = 240;
const QUEUE_START_Y = 480;
const QUEUE_SPACING = 70;

export interface ServeResult {
  revenue: number;
  dietaryViolation: boolean;
  violationType?: string;   // e.g. 'Vegan' or 'Nut-Free'
}

export class CustomerManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private queue: Customer[] = [];
  private spawnTimer: number = 0;
  private baseSpawnInterval: number = 4000; // ms between spawns at 1x

  // Stats for the day
  customersServed: number = 0;
  customersLost: number = 0;
  private satisfactionSum: number = 0; // sum of patience ratios for served customers
  private lastCriticReview: CriticReview | null = null;
  onCriticReview?: (review: CriticReview) => void; // callback for UI notification
  eventEffects: GameEventEffects = {}; // active event modifiers

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
    const eqOffline = this.eventEffects.equipmentOffline ?? false;
    const eqEffects = eqOffline ? { capacityBonus: 0 } : this.gameState.getEquipmentEffects();
    const seatingCapacity = this.gameState.getSeatingDef().capacityBonus;
    const maxQueue = MAX_QUEUE_LENGTH + (eqEffects.capacityBonus ?? 0) + seatingCapacity;
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
    // Word-of-mouth: reputation drives customer volume with accelerating returns
    const wordOfMouth = this.gameState.getWordOfMouthMultiplier();
    // More customers during peak hours (11am-2pm, 6pm-8pm)
    const hour = this.gameState.currentHour;
    let peakMult = 1.0;
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 20)) {
      peakMult = 0.6; // shorter interval = more customers
    }
    // Equipment serve speed multiplier reduces effective spawn interval
    const equipmentOffline = this.eventEffects.equipmentOffline ?? false;
    const effects = equipmentOffline
      ? { serveSpeedMult: 1.0 }
      : this.gameState.getEquipmentEffects();
    const speedMult = effects.serveSpeedMult ?? 1.0;
    // Staff speed bonus reduces interval further
    const staffEffects = this.gameState.getStaffEffects();
    const staffSpeedMult = Math.max(0.5, 1.0 - staffEffects.speedBonus);
    // Event modifier on customer spawn rate
    const eventSpawnMult = this.eventEffects.customerSpawnMult ?? 1.0;
    // Campaign modifier on customer spawn rate
    const campaignEffects = this.gameState.getCampaignEffects();
    const campaignSpawnMult = campaignEffects.customerSpawnMult ?? 1.0;
    // Weather modifier
    const weatherMult = this.gameState.getWeatherDef().customerMult;
    // Loyalty: regulars bring friends
    const loyaltyFx = this.gameState.getLoyaltyEffects();
    const loyaltyMult = 1 - loyaltyFx.spawnBonus; // lower = more customers
    // Signage curb appeal: lower = more customers
    const signageMult = this.gameState.getSignageDef().curbAppealMult;
    return this.baseSpawnInterval * peakMult * speedMult * staffSpeedMult * eventSpawnMult * campaignSpawnMult * weatherMult * loyaltyMult * signageMult / Math.max(wordOfMouth, 0.3);
  }

  private spawnCustomer(): void {
    const availableFlavors = this.gameState.flavors
      .filter(f => f.unlocked)
      .map(f => f.id);

    if (availableFlavors.length === 0) return;

    // Boost popular recipe flavors in the flavor pool (add duplicates so they're picked more often)
    const popularRecipes = this.gameState.getPopularRecipes();
    const weightedFlavors = [...availableFlavors];
    for (const recipe of popularRecipes) {
      if (availableFlavors.includes(recipe.flavorId)) {
        weightedFlavors.push(recipe.flavorId); // double chance
      }
    }

    const slotIndex = this.queue.length;
    const x = QUEUE_START_X + slotIndex * QUEUE_SPACING;
    const y = QUEUE_START_Y;

    const availableToppings = this.gameState.getAvailableToppings();
    const availableStyles = this.gameState.getAvailableStyles();
    const customer = new Customer(this.scene, x, y, weightedFlavors, this.gameState.menuPrices, availableToppings, availableStyles);

    // Apply weather patience modifier
    const weatherPatienceMult = this.gameState.getWeatherDef().patienceMult;
    customer.maxPatience *= weatherPatienceMult;

    // Apply decor ambiance patience modifier
    const decorDef = this.gameState.getDecorDef();
    customer.maxPatience *= decorDef.patienceMult;

    // Apply seating patience modifier
    const seatingDef = this.gameState.getSeatingDef();
    customer.maxPatience *= seatingDef.patienceMult;

    // Apply research patience bonus
    const researchFx = this.gameState.getResearchEffects();
    if (researchFx.patienceBonus) {
      customer.maxPatience += researchFx.patienceBonus;
    }

    // Apply loyalty patience bonus
    const loyaltyFx = this.gameState.getLoyaltyEffects();
    if (loyaltyFx.patienceBonus) {
      customer.maxPatience += loyaltyFx.patienceBonus;
    }

    // Apply challenge mode patience multiplier
    const challengePatienceMult = this.scene.registry.get('challengePatienceMult') as number ?? 1.0;
    if (challengePatienceMult !== 1.0) {
      customer.maxPatience *= challengePatienceMult;
    }

    customer.patience = customer.maxPatience;

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

  serveFirstCustomer(): ServeResult | null {
    if (this.queue.length === 0) return null;

    const customer = this.queue[0];

    // Check if we have the ingredients
    if (!this.canFulfillOrder(customer)) return null;

    // Deduct ingredients
    this.deductIngredients(customer);

    // Serve and get revenue (equipment quality + staff friendliness boost tips)
    // Power outage: equipment effects don't apply
    const equipmentOffline = this.eventEffects.equipmentOffline ?? false;
    const effects = equipmentOffline
      ? { serveSpeedMult: 1.0, capacityBonus: 0, qualityBonus: 0 }
      : this.gameState.getEquipmentEffects();
    const staffEffects = this.gameState.getStaffEffects();
    const researchFx = this.gameState.getResearchEffects();
    const supplierQuality = (this.scene.registry.get('supplierQualityBonus') as number) ?? 0;
    const totalQualityBonus = (effects.qualityBonus ?? 0) + staffEffects.tipBonus + (researchFx.qualityBonus ?? 0) + supplierQuality;
    const patienceRatio = customer.patience / customer.maxPatience;
    let revenue = customer.serve(totalQualityBonus);
    // Apply event revenue multiplier
    if (this.eventEffects.revenueMult) {
      revenue *= this.eventEffects.revenueMult;
    }
    // Apply campaign tip bonus
    const campaignEffects = this.gameState.getCampaignEffects();
    if (campaignEffects.tipBonus) {
      revenue *= (1 + campaignEffects.tipBonus);
    }
    // Apply decor price tolerance bonus
    const decorPriceTolerance = this.gameState.getDecorDef().priceTolerance;
    if (decorPriceTolerance > 0) {
      revenue *= (1 + decorPriceTolerance);
    }
    // Apply loyalty tip bonus
    const loyaltyFx = this.gameState.getLoyaltyEffects();
    if (loyaltyFx.tipBonus > 0) {
      revenue *= (1 + loyaltyFx.tipBonus);
    }
    // Check if order matches a recipe — record sale and apply recipe premium
    const matchedRecipe = this.gameState.recipes.find(r => {
      const firstItem = customer.order.items[0];
      if (!firstItem) return false;
      return r.flavorId === firstItem.flavorId && r.style === firstItem.style;
    });
    if (matchedRecipe) {
      this.gameState.recordRecipeSale(matchedRecipe.id, patienceRatio);
      // Popular recipes get a small revenue bonus (up to 10% for highly rated recipes)
      const rating = this.gameState.getRecipeRating(matchedRecipe);
      if (matchedRecipe.timesSold >= 3 && rating > 0.5) {
        revenue *= (1 + rating * 0.1);
      }
    }

    this.queue.shift();
    this.customersServed++;
    // Dietary restriction violation: halve satisfaction (affects reputation)
    const dietaryViolation = customer.orderViolatesRestriction();
    const satisfactionPenalty = dietaryViolation ? 0.5 : 1.0;
    this.satisfactionSum += patienceRatio * satisfactionPenalty;
    this.repositionQueue();

    // Register loyalty (regular customers only, with good patience)
    if (customer.type === CustomerType.REGULAR && patienceRatio > 0.3) {
      const favFlavor = customer.order.items[0]?.flavorId ?? 'vanilla';
      this.gameState.registerLoyalCustomer(favFlavor);
    }

    // Handle critic review
    if (customer.type === CustomerType.CRITIC) {
      const review: CriticReview = {
        day: this.gameState.day,
        rating: this.calculateCriticRating(patienceRatio, totalQualityBonus),
        patienceRatio,
        qualityBonus: totalQualityBonus,
      };
      this.lastCriticReview = review;
      this.onCriticReview?.(review);
    }

    // Map restriction enum to display label
    const violationLabels: Record<string, string> = {
      vegan: 'Vegan',
      nut_free: 'Nut-Free',
    };

    return {
      revenue,
      dietaryViolation,
      violationType: dietaryViolation ? violationLabels[customer.dietaryRestriction] : undefined,
    };
  }

  /** Critics rate based on patience (speed), quality (equipment+staff), and some randomness */
  private calculateCriticRating(patienceRatio: number, qualityBonus: number): number {
    // Base: patience ratio heavily weighted (they care about wait time)
    let score = patienceRatio * 3; // 0-3 points from patience
    // Quality bonus adds up to 1.5 points
    score += Math.min(qualityBonus * 3, 1.5);
    // Small random factor (±0.5)
    score += (Math.random() - 0.5);
    // Clamp to 1-5
    return Math.max(1, Math.min(5, Math.round(score)));
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

  /** Average satisfaction (patience ratio) of served customers, 0-1 */
  getAverageSatisfaction(): number {
    return this.customersServed > 0 ? this.satisfactionSum / this.customersServed : 0.5;
  }

  /** Get the last critic review from this day, if any */
  getLastCriticReview(): CriticReview | null {
    return this.lastCriticReview;
  }

  resetDayStats(): void {
    this.customersServed = 0;
    this.customersLost = 0;
    this.satisfactionSum = 0;
    this.lastCriticReview = null;
    this.spawnTimer = 0;
  }

  clearQueue(): void {
    this.queue.forEach(c => c.destroy());
    this.queue = [];
  }
}
