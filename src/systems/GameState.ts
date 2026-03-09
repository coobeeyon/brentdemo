import {
  DayPhase,
  STARTING_MONEY,
  STARTING_REPUTATION,
  DEFAULT_DAY_DURATION_MS,
  STORE_OPEN_HOUR,
  HOURS_PER_DAY,
  SPEED_NORMAL,
  EquipmentId,
  EQUIPMENT_CATALOG,
  EquipmentEffects,
  CampaignId,
  CAMPAIGN_CATALOG,
  CampaignEffects,
  WeatherType,
  WEATHER_TABLE,
  SEASON_CATALOG,
  SeasonDef,
  HealthInspectionResult,
  INSPECTION_CHANCE,
  INSPECTION_COOLDOWN_DAYS,
  INSPECTION_PASS_THRESHOLD,
} from '../config/constants';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  costPer: number;
  expiresInDays: number;
}

export interface Flavor {
  id: string;
  name: string;
  unlocked: boolean;
  ingredients: string[]; // ingredient ids
  popularity: number; // 0-1
}

export interface StaffMember {
  id: string;
  name: string;
  speed: number;      // 1-10
  accuracy: number;   // 1-10
  friendliness: number; // 1-10
  morale: number;     // 0-100
  wage: number;       // per day
  assigned: boolean;
}

export interface CriticReview {
  day: number;
  rating: number;     // 1-5 stars
  patienceRatio: number;
  qualityBonus: number;
}

export interface DayReport {
  day: number;
  revenue: number;
  expenses: number;
  customersServed: number;
  customersLost: number;
  satisfactionScore: number;
  criticReview?: CriticReview;
  reputationChange: number;
}

export interface ActiveCampaign {
  id: CampaignId;
  daysRemaining: number;
}

export interface OwnedEquipment {
  id: EquipmentId;
  tier: number;       // current tier (0 = not purchased for optional equipment)
  condition: number;  // 0-100, degrades over time
  broken: boolean;    // if true, effects don't apply until repaired
}

export class GameState {
  // Time
  day: number = 1;
  season: number = 1;
  currentHour: number = STORE_OPEN_HOUR;
  phase: DayPhase = DayPhase.PREPARE;
  gameSpeed: number = SPEED_NORMAL;
  dayDurationMs: number = DEFAULT_DAY_DURATION_MS;

  // Finances
  money: number = STARTING_MONEY;
  dailyRevenue: number = 0;
  dailyExpenses: number = 0;
  loanBalance: number = 0;

  // Reputation
  reputation: number = STARTING_REPUTATION;
  reputationMomentum: number = 0; // rolling momentum: positive = trending up, negative = down
  criticReviews: CriticReview[] = [];

  // Inventory
  ingredients: Ingredient[] = [];
  flavors: Flavor[] = [];

  // Staff
  staff: StaffMember[] = [];

  // Menu pricing overrides (flavor id -> price)
  menuPrices: Map<string, number> = new Map();

  // History
  dayReports: DayReport[] = [];

  // Unlocks
  researchPoints: number = 0;
  unlockedFlavors: Set<string> = new Set(['vanilla', 'chocolate', 'strawberry']);

  // Equipment
  equipment: OwnedEquipment[] = [];

  // Marketing campaigns
  activeCampaigns: ActiveCampaign[] = [];

  // Weather
  weather: WeatherType = WeatherType.SUNNY;

  // Loans
  loanAmount: number = 0;           // current outstanding loan principal
  loanInterestRate: number = 0;     // daily interest rate (e.g., 0.02 = 2%)
  loanDaysRemaining: number = 0;    // days until loan is due

  // Health inspections
  lastInspectionDay: number = 0;      // day of last inspection
  closureDaysRemaining: number = 0;   // days store must stay closed
  inspectionHistory: HealthInspectionResult[] = [];

  // Story mode
  seasonDay: number = 1;              // day within current season
  seasonRevenue: number = 0;          // total revenue accumulated this season

  constructor() {
    this.initializeStartingInventory();
    this.initializeStartingEquipment();
  }

  private initializeStartingInventory(): void {
    this.flavors = [
      { id: 'vanilla', name: 'Vanilla', unlocked: true, ingredients: ['milk', 'sugar', 'vanilla_extract'], popularity: 0.8 },
      { id: 'chocolate', name: 'Chocolate', unlocked: true, ingredients: ['milk', 'sugar', 'cocoa'], popularity: 0.9 },
      { id: 'strawberry', name: 'Strawberry', unlocked: true, ingredients: ['milk', 'sugar', 'strawberries'], popularity: 0.7 },
    ];

    this.ingredients = [
      { id: 'milk', name: 'Milk', quantity: 50, costPer: 0.5, expiresInDays: 3 },
      { id: 'sugar', name: 'Sugar', quantity: 100, costPer: 0.2, expiresInDays: 30 },
      { id: 'vanilla_extract', name: 'Vanilla Extract', quantity: 20, costPer: 1.0, expiresInDays: 60 },
      { id: 'cocoa', name: 'Cocoa Powder', quantity: 30, costPer: 0.8, expiresInDays: 30 },
      { id: 'strawberries', name: 'Strawberries', quantity: 25, costPer: 0.6, expiresInDays: 2 },
      { id: 'cream', name: 'Whipped Cream', quantity: 20, costPer: 0.4, expiresInDays: 5 },
      { id: 'sprinkles', name: 'Sprinkles', quantity: 40, costPer: 0.1, expiresInDays: 90 },
    ];
  }

  private initializeStartingEquipment(): void {
    // Start with tier 1 of the three core equipment pieces
    this.equipment = [
      { id: EquipmentId.ICE_CREAM_MAKER, tier: 1, condition: 100, broken: false },
      { id: EquipmentId.FREEZER, tier: 1, condition: 100, broken: false },
      { id: EquipmentId.POS, tier: 1, condition: 100, broken: false },
    ];
  }

  getEquipment(id: EquipmentId): OwnedEquipment | undefined {
    return this.equipment.find(e => e.id === id);
  }

  getEquipmentTier(id: EquipmentId): number {
    return this.getEquipment(id)?.tier ?? 0;
  }

  /** Get combined equipment effects (only from non-broken equipment) */
  getEquipmentEffects(): EquipmentEffects {
    const combined: EquipmentEffects = {
      serveSpeedMult: 1.0,
      capacityBonus: 0,
      qualityBonus: 0,
    };

    for (const owned of this.equipment) {
      if (owned.broken || owned.tier === 0) continue;
      const def = EQUIPMENT_CATALOG.find(e => e.id === owned.id);
      if (!def) continue;
      const tierDef = def.tiers.find(t => t.tier === owned.tier);
      if (!tierDef) continue;

      const fx = tierDef.effects;
      if (fx.serveSpeedMult !== undefined) {
        combined.serveSpeedMult! *= fx.serveSpeedMult;
      }
      if (fx.capacityBonus !== undefined) {
        combined.capacityBonus! += fx.capacityBonus;
      }
      if (fx.qualityBonus !== undefined) {
        combined.qualityBonus! += fx.qualityBonus;
      }
    }

    return combined;
  }

  /** Degrade equipment condition and check for breakdowns */
  degradeEquipment(): void {
    for (const owned of this.equipment) {
      if (owned.tier === 0 || owned.broken) continue;
      // Lose 5-15 condition per day
      const degradation = 5 + Math.random() * 10;
      owned.condition = Math.max(0, owned.condition - degradation);

      // Breakdown chance increases as condition drops
      if (owned.condition < 30) {
        const breakChance = (30 - owned.condition) / 100; // up to 30%
        if (Math.random() < breakChance) {
          owned.broken = true;
        }
      }
    }
  }

  /** Get effective stat for a staff member, modified by morale */
  getEffectiveStat(member: StaffMember, stat: number): number {
    // Morale below 50 reduces effectiveness: at 0 morale, stats are halved
    const moraleMultiplier = member.morale >= 50 ? 1.0 : 0.5 + (member.morale / 100);
    return stat * moraleMultiplier;
  }

  /** Get staff bonuses from assigned (working) staff */
  getStaffEffects(): { speedBonus: number; tipBonus: number } {
    const assigned = this.staff.filter(s => s.assigned);
    if (assigned.length === 0) return { speedBonus: 0, tipBonus: 0 };

    // Average effective speed of assigned staff: each point above 5 gives 3% speed bonus
    const avgSpeed = assigned.reduce((sum, s) => sum + this.getEffectiveStat(s, s.speed), 0) / assigned.length;
    const speedBonus = (avgSpeed - 5) * 0.03; // can be negative if staff is slow

    // Average effective friendliness: each point above 5 gives 2% tip bonus
    const avgFriendliness = assigned.reduce((sum, s) => sum + this.getEffectiveStat(s, s.friendliness), 0) / assigned.length;
    const tipBonus = (avgFriendliness - 5) * 0.02;

    // More staff = faster service (diminishing returns)
    const staffCountBonus = Math.min(assigned.length * 0.05, 0.2); // up to 20%

    return {
      speedBonus: speedBonus + staffCountBonus,
      tipBonus: Math.max(0, tipBonus),
    };
  }

  /** Update staff morale at end of day */
  updateStaffMorale(): void {
    const brokenCount = this.equipment.filter(e => e.broken).length;

    for (const member of this.staff) {
      let moraleChange = 0;

      // Working staff get tired (-3 to -8 based on workload)
      if (member.assigned) {
        moraleChange -= 3 + Math.random() * 5;
      } else {
        // Idle staff recover morale slowly (+2 to +5)
        moraleChange += 2 + Math.random() * 3;
      }

      // Fair wages boost morale, underpaying hurts
      // Wage fairness: compare wage to what stats deserve (15 + avgStat * 3)
      const fairWage = 15 + ((member.speed + member.accuracy + member.friendliness) / 3) * 3;
      if (member.wage >= fairWage) {
        moraleChange += 1; // slight boost for fair pay
      } else {
        moraleChange -= 2; // penalty for underpaying
      }

      // Broken equipment = bad working conditions
      if (member.assigned && brokenCount > 0) {
        moraleChange -= brokenCount * 1.5;
      }

      // High reputation = pride in workplace
      if (this.reputation >= 4) {
        moraleChange += 1;
      }

      member.morale = Math.max(0, Math.min(100, member.morale + moraleChange));
    }
  }

  /** Train a staff member: improve one random stat by 1 (costs money) */
  trainStaff(memberId: string): { success: boolean; stat?: string; cost: number } {
    const member = this.staff.find(s => s.id === memberId);
    if (!member) return { success: false, cost: 0 };

    // Training cost scales with current skill level
    const avgStat = (member.speed + member.accuracy + member.friendliness) / 3;
    const cost = Math.round(20 + avgStat * 10);

    if (this.money < cost) return { success: false, cost };

    // Pick a random stat to improve (weighted toward lowest stat)
    const stats: { key: 'speed' | 'accuracy' | 'friendliness'; value: number }[] = [
      { key: 'speed', value: member.speed },
      { key: 'accuracy', value: member.accuracy },
      { key: 'friendliness', value: member.friendliness },
    ];

    // Weight toward lower stats (inverse weighting)
    const maxStat = 10;
    const weights = stats.map(s => maxStat - s.value + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;

    let chosen = stats[0];
    for (let i = 0; i < stats.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        chosen = stats[i];
        break;
      }
    }

    // Can't exceed 10
    if (member[chosen.key] >= 10) {
      // Try another stat
      const other = stats.find(s => s.key !== chosen.key && member[s.key] < 10);
      if (!other) return { success: false, cost }; // all stats maxed
      chosen = other;
    }

    this.money -= cost;
    this.dailyExpenses += cost;
    member[chosen.key] += 1;
    // Training also gives a small morale boost
    member.morale = Math.min(100, member.morale + 5);

    return { success: true, stat: chosen.key, cost };
  }

  /** Get total daily maintenance cost for all equipment */
  getMaintenanceCost(): number {
    let total = 0;
    for (const owned of this.equipment) {
      if (owned.tier === 0) continue;
      const def = EQUIPMENT_CATALOG.find(e => e.id === owned.id);
      if (!def) continue;
      const tierDef = def.tiers.find(t => t.tier === owned.tier);
      if (tierDef) total += tierDef.maintenanceCost;
    }
    return total;
  }

  /** Calculate reputation change for end of day based on service quality and events */
  calculateReputationChange(
    served: number,
    lost: number,
    avgSatisfaction: number, // 0-1, weighted by patience ratio
    criticReview?: CriticReview,
  ): number {
    const total = served + lost;
    if (total === 0) return 0;

    // Base change from service ratio (-0.2 to +0.2)
    const serviceRatio = served / total;
    let change = (serviceRatio - 0.5) * 0.4;

    // Satisfaction quality bonus/penalty (-0.1 to +0.1)
    // avgSatisfaction is weighted by patience remaining
    change += (avgSatisfaction - 0.5) * 0.2;

    // Critic review has outsized impact (-0.5 to +0.5)
    if (criticReview) {
      const criticImpact = (criticReview.rating - 3) * 0.2; // -0.4 to +0.4
      change += criticImpact;
      this.criticReviews.push(criticReview);
    }

    // Momentum: consecutive good/bad days amplify change (up to ±50% boost)
    if ((change > 0 && this.reputationMomentum > 0) || (change < 0 && this.reputationMomentum < 0)) {
      const momentumBoost = Math.min(Math.abs(this.reputationMomentum) * 0.1, 0.5);
      change *= (1 + momentumBoost);
    }

    // Update momentum (decays toward 0, pushed by current change)
    this.reputationMomentum = this.reputationMomentum * 0.7 + (change > 0 ? 1 : change < 0 ? -1 : 0);

    // Clamp total change to reasonable bounds
    change = Math.max(-0.5, Math.min(0.5, change));

    // Apply and clamp reputation
    this.reputation = Math.max(0.5, Math.min(5, this.reputation + change));

    return change;
  }

  /** Word-of-mouth multiplier: higher rep = more customers, with accelerating returns */
  getWordOfMouthMultiplier(): number {
    // Below 2.5 stars: fewer customers. Above 2.5: more. Exponential above 4.
    if (this.reputation <= 2.5) {
      return 0.6 + (this.reputation / 2.5) * 0.4; // 0.6 to 1.0
    }
    // 2.5 to 4: linear growth
    if (this.reputation <= 4) {
      return 1.0 + (this.reputation - 2.5) * 0.4; // 1.0 to 1.6
    }
    // 4 to 5: accelerating growth (word of mouth kicks in)
    return 1.6 + (this.reputation - 4) * 0.8; // 1.6 to 2.4
  }

  /** Launch a marketing campaign */
  launchCampaign(campaignId: CampaignId): boolean {
    const def = CAMPAIGN_CATALOG.find(c => c.id === campaignId);
    if (!def) return false;

    // Can't run the same campaign twice simultaneously
    if (this.activeCampaigns.some(c => c.id === campaignId)) return false;

    if (this.money < def.cost) return false;

    this.money -= def.cost;
    this.dailyExpenses += def.cost;
    this.activeCampaigns.push({ id: campaignId, daysRemaining: def.durationDays });
    return true;
  }

  /** Get combined effects of all active campaigns */
  getCampaignEffects(): CampaignEffects {
    const combined: CampaignEffects = {
      customerSpawnMult: 1.0,
      reputationBonus: 0,
      tipBonus: 0,
    };

    for (const campaign of this.activeCampaigns) {
      const def = CAMPAIGN_CATALOG.find(c => c.id === campaign.id);
      if (!def) continue;
      const fx = def.effects;
      if (fx.customerSpawnMult !== undefined) {
        combined.customerSpawnMult! *= fx.customerSpawnMult;
      }
      if (fx.reputationBonus !== undefined) {
        combined.reputationBonus! += fx.reputationBonus;
      }
      if (fx.tipBonus !== undefined) {
        combined.tipBonus! += fx.tipBonus;
      }
    }

    return combined;
  }

  /** Tick down campaign durations (called at start of new day) */
  private updateCampaigns(): void {
    this.activeCampaigns = this.activeCampaigns
      .map(c => ({ ...c, daysRemaining: c.daysRemaining - 1 }))
      .filter(c => c.daysRemaining > 0);
  }

  /** Get the current season definition */
  getSeasonDef(): SeasonDef | undefined {
    return SEASON_CATALOG.find(s => s.season === this.season);
  }

  /** Check if the current season is complete (last day reached) */
  isSeasonComplete(): boolean {
    const seasonDef = this.getSeasonDef();
    if (!seasonDef) return false;
    return this.seasonDay >= seasonDef.daysPerSeason;
  }

  /** Check season result: 'win', 'soft_fail', or 'hard_fail' */
  getSeasonResult(): 'win' | 'soft_fail' | 'hard_fail' {
    if (this.money < -100) return 'hard_fail'; // bankrupt

    const seasonDef = this.getSeasonDef();
    if (!seasonDef) return 'soft_fail';

    const metRevenue = this.seasonRevenue >= seasonDef.revenueTarget;
    const metReputation = this.reputation >= seasonDef.reputationTarget;

    if (metRevenue && metReputation) return 'win';
    return 'soft_fail';
  }

  /** Advance to the next season */
  advanceSeason(): void {
    this.season++;
    this.seasonDay = 1;
    this.seasonRevenue = 0;

    const seasonDef = this.getSeasonDef();
    if (seasonDef) {
      // Unlock new flavors for this season
      if (seasonDef.unlockFlavors) {
        for (const flavorId of seasonDef.unlockFlavors) {
          if (!this.unlockedFlavors.has(flavorId)) {
            this.unlockedFlavors.add(flavorId);
            // Add the flavor to available flavors
            const name = flavorId.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
            this.flavors.push({
              id: flavorId,
              name,
              unlocked: true,
              ingredients: ['milk', 'sugar'], // simplified - uses base ingredients
              popularity: 0.5 + Math.random() * 0.3,
            });
          }
        }
      }
    }
  }

  /** Run a health inspection and return the result */
  runHealthInspection(): HealthInspectionResult {
    let score = 100;
    const violations: string[] = [];

    // Equipment condition: each broken piece is -15, low condition is -5
    for (const owned of this.equipment) {
      if (owned.tier === 0) continue;
      const def = EQUIPMENT_CATALOG.find(e => e.id === owned.id);
      const name = def?.name ?? owned.id;
      if (owned.broken) {
        score -= 15;
        violations.push(`${name} is broken and unsanitary`);
      } else if (owned.condition < 30) {
        score -= 5;
        violations.push(`${name} in poor condition (${Math.round(owned.condition)}%)`);
      }
    }

    // Expired or near-expired ingredients: -10 each
    const expiredCount = this.ingredients.filter(i => i.expiresInDays <= 1 && i.quantity > 0).length;
    if (expiredCount > 0) {
      score -= expiredCount * 10;
      violations.push(`${expiredCount} ingredient(s) expired or expiring today`);
    }

    // No staff assigned: -15 (food handling without proper staffing)
    const assignedStaff = this.staff.filter(s => s.assigned).length;
    if (this.staff.length > 0 && assignedStaff === 0) {
      score -= 15;
      violations.push('No staff assigned — understaffed');
    }

    // Low staff morale: -5 per staff with morale < 25 (indicates poor conditions)
    const unhappyStaff = this.staff.filter(s => s.morale < 25).length;
    if (unhappyStaff > 0) {
      score -= unhappyStaff * 5;
      violations.push(`${unhappyStaff} staff member(s) with critically low morale`);
    }

    // Low reputation is a signal of past issues: -5 if below 2
    if (this.reputation < 2) {
      score -= 5;
      violations.push('Prior complaints on record');
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    const passed = score >= INSPECTION_PASS_THRESHOLD;

    // Determine closure days: 0 if passed, 1 if barely failed, 2-3 if very bad
    let closureDays = 0;
    if (!passed) {
      if (score >= 40) {
        closureDays = 1;
      } else if (score >= 20) {
        closureDays = 2;
      } else {
        closureDays = 3;
      }
    }

    // Reputation impact: +0.1 to +0.2 for passing, -0.2 to -0.5 for failing
    let reputationChange: number;
    if (passed) {
      reputationChange = 0.1 + (score - INSPECTION_PASS_THRESHOLD) / 400; // +0.1 to +0.2
    } else {
      reputationChange = -0.2 - (INSPECTION_PASS_THRESHOLD - score) / 200; // -0.2 to -0.5
    }

    this.reputation = Math.max(0.5, Math.min(5, this.reputation + reputationChange));

    const result: HealthInspectionResult = {
      day: this.day,
      score,
      passed,
      violations,
      closureDays,
      reputationChange,
    };

    this.lastInspectionDay = this.day;
    this.closureDaysRemaining = closureDays;
    this.inspectionHistory.push(result);

    return result;
  }

  /** Check if a health inspection should trigger today */
  shouldTriggerInspection(): boolean {
    // Respect cooldown
    if (this.day - this.lastInspectionDay < INSPECTION_COOLDOWN_DAYS) return false;
    // Don't inspect on day 1
    if (this.day <= 1) return false;
    return Math.random() < INSPECTION_CHANCE;
  }

  /** Roll random weather for the day (weighted: sunny/cloudy more likely) */
  private rollWeather(): void {
    const weights = [3, 3, 2, 1.5, 0.5]; // sunny, cloudy, rainy, hot, stormy
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < WEATHER_TABLE.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        this.weather = WEATHER_TABLE[i].type;
        return;
      }
    }
    this.weather = WeatherType.SUNNY;
  }

  /** Get the current weather definition */
  getWeatherDef() {
    return WEATHER_TABLE.find(w => w.type === this.weather) ?? WEATHER_TABLE[0];
  }

  get profit(): number {
    return this.dailyRevenue - this.dailyExpenses;
  }

  get currentTimeString(): string {
    const hour = Math.floor(this.currentHour);
    const minutes = Math.floor((this.currentHour % 1) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  advanceTime(deltaMs: number): void {
    if (this.gameSpeed === 0) return;

    const hoursPerMs = HOURS_PER_DAY / this.dayDurationMs;
    this.currentHour += deltaMs * this.gameSpeed * hoursPerMs;
  }

  startNewDay(): void {
    // Track season revenue from previous day before resetting
    this.seasonRevenue += this.dailyRevenue;

    this.day++;
    this.seasonDay++;
    this.currentHour = STORE_OPEN_HOUR;
    this.phase = DayPhase.PREPARE;
    this.dailyRevenue = 0;
    this.dailyExpenses = 0;

    // Expire ingredients
    this.ingredients = this.ingredients.map(ing => ({
      ...ing,
      expiresInDays: ing.expiresInDays - 1,
    })).filter(ing => ing.expiresInDays > 0 && ing.quantity > 0);

    // Deduct staff wages
    const totalWages = this.staff.reduce((sum, s) => sum + s.wage, 0);
    this.money -= totalWages;
    this.dailyExpenses += totalWages;

    // Deduct equipment maintenance
    const maintenance = this.getMaintenanceCost();
    this.money -= maintenance;
    this.dailyExpenses += maintenance;

    // Degrade equipment
    this.degradeEquipment();

    // Update staff morale
    this.updateStaffMorale();

    // Tick down campaign durations
    this.updateCampaigns();

    // Tick down closure days from failed inspections
    if (this.closureDaysRemaining > 0) {
      this.closureDaysRemaining--;
    }

    // Roll weather for the day
    this.rollWeather();
  }
}

// Singleton-style registry — scenes share this instance via the Phaser registry
let gameState: GameState | null = null;

export function getGameState(scene?: Phaser.Scene): GameState {
  if (scene) {
    const existing = scene.registry.get('gameState') as GameState | undefined;
    if (existing) return existing;
    const state = new GameState();
    scene.registry.set('gameState', state);
    gameState = state;
    return state;
  }
  if (!gameState) {
    gameState = new GameState();
  }
  return gameState;
}
