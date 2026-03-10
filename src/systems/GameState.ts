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
  LoanDef,
  LOAN_CATALOG,
  ShiftType,
  SHIFT_HOURS,
  DecorThemeId,
  DECOR_CATALOG,
  DecorThemeDef,
  SeatingId,
  SEATING_CATALOG,
  SeatingDef,
  SignageId,
  SIGNAGE_CATALOG,
  SignageDef,
  TOPPING_CATALOG,
  ToppingDef,
  SERVING_STYLE_CATALOG,
  ServingStyleDef,
  FLAVOR_CATALOG,
  RESEARCH_CATALOG,
  ResearchNodeDef,
  ResearchEffects,
  MILESTONE_CATALOG,
  MilestoneStats,
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
  shift: ShiftType;           // scheduled shift
  consecutiveDaysWorked: number; // for fairness tracking
}

export interface CriticReview {
  day: number;
  rating: number;     // 1-5 stars
  patienceRatio: number;
  qualityBonus: number;
}

export interface Recipe {
  id: string;
  name: string;
  flavorId: string;
  toppings: string[];      // topping ingredient ids
  style: string;           // serving style id
  price: number;           // custom price
  timesSold: number;
  totalRating: number;     // cumulative satisfaction (for avg rating calc)
}

export interface LoyalCustomer {
  id: string;
  name: string;
  visits: number;
  points: number;
  favoriteFlavor: string;
  lastVisitDay: number;
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

/** Per-location state for multi-location franchise (Season 5+) */
export interface LocationState {
  id: number;
  name: string;

  // Finances (per-location)
  money: number;
  dailyRevenue: number;
  dailyExpenses: number;

  // Reputation (per-location)
  reputation: number;
  reputationMomentum: number;
  criticReviews: CriticReview[];

  // Inventory
  ingredients: Ingredient[];
  flavors: Flavor[];

  // Staff
  staff: StaffMember[];

  // Menu pricing overrides
  menuPrices: Map<string, number>;

  // History
  dayReports: DayReport[];

  // Equipment
  equipment: OwnedEquipment[];

  // Marketing campaigns
  activeCampaigns: ActiveCampaign[];

  // Store customization
  currentDecor: DecorThemeId;
  unlockedDecor: DecorThemeId[];
  currentSeating: SeatingId;
  unlockedSeating: SeatingId[];
  currentSignage: SignageId;
  unlockedSignage: SignageId[];

  // Loans (per-location)
  loanAmount: number;
  loanInterestRate: number;
  loanDaysRemaining: number;

  // Health inspections
  lastInspectionDay: number;
  closureDaysRemaining: number;
  inspectionHistory: HealthInspectionResult[];

  // Recipes
  recipes: Recipe[];

  // Loyalty
  loyalCustomers: LoyalCustomer[];

  // Weather (per-location, different cities)
  weather: WeatherType;
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

  // Unlocks & Research
  researchPoints: number = 0;
  unlockedResearch: Set<string> = new Set();
  completedMilestones: Set<string> = new Set();
  totalCustomersServed: number = 0;
  totalRevenue: number = 0;
  unlockedFlavors: Set<string> = new Set(['vanilla', 'chocolate', 'strawberry']);

  // Equipment
  equipment: OwnedEquipment[] = [];

  // Marketing campaigns
  activeCampaigns: ActiveCampaign[] = [];

  // Weather
  weather: WeatherType = WeatherType.SUNNY;

  // Store decor
  currentDecor: DecorThemeId = DecorThemeId.BASIC;
  unlockedDecor: DecorThemeId[] = [DecorThemeId.BASIC];

  // Seating
  currentSeating: SeatingId = SeatingId.NONE;
  unlockedSeating: SeatingId[] = [SeatingId.NONE];

  // Signage
  currentSignage: SignageId = SignageId.NONE;
  unlockedSignage: SignageId[] = [SignageId.NONE];

  // Loans
  loanAmount: number = 0;           // current outstanding loan principal
  loanInterestRate: number = 0;     // daily interest rate (e.g., 0.02 = 2%)
  loanDaysRemaining: number = 0;    // days until loan is due

  // Health inspections
  lastInspectionDay: number = 0;      // day of last inspection
  closureDaysRemaining: number = 0;   // days store must stay closed
  inspectionHistory: HealthInspectionResult[] = [];

  // Recipes
  recipes: Recipe[] = [];

  // Loyalty
  loyalCustomers: LoyalCustomer[] = [];

  // Story mode
  seasonDay: number = 1;              // day within current season
  seasonRevenue: number = 0;          // total revenue accumulated this season

  // Multi-location franchise (Season 5+)
  locations: LocationState[] = [];
  currentLocationId: number = 0;      // index into locations[]
  franchiseMode: boolean = false;     // true when multi-location is active

  constructor() {
    this.initializeStartingInventory();
    this.initializeStartingEquipment();
  }

  private initializeStartingInventory(): void {
    // Initialize flavors from catalog — starters are unlocked
    this.flavors = FLAVOR_CATALOG.filter(f => f.starter).map(f => ({
      id: f.id,
      name: f.name,
      unlocked: true,
      ingredients: f.ingredients,
      popularity: f.popularity,
    }));

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
    return this.loc.equipment.find(e => e.id === id);
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

    for (const owned of this.loc.equipment) {
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
    for (const owned of this.loc.equipment) {
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

  /** Get staff currently on shift at the given hour */
  getActiveStaff(hour?: number): StaffMember[] {
    const h = hour ?? this.currentHour;
    return this.loc.staff.filter(s => {
      if (!s.assigned || s.shift === ShiftType.OFF) return false;
      const shiftDef = SHIFT_HOURS[s.shift];
      return h >= shiftDef.start && h < shiftDef.end;
    });
  }

  /** Get staff bonuses from staff currently on shift */
  getStaffEffects(): { speedBonus: number; tipBonus: number } {
    const active = this.getActiveStaff();
    if (active.length === 0) return { speedBonus: 0, tipBonus: 0 };

    // Average effective speed of active staff: each point above 5 gives 3% speed bonus
    const avgSpeed = active.reduce((sum, s) => sum + this.getEffectiveStat(s, s.speed), 0) / active.length;
    const speedBonus = (avgSpeed - 5) * 0.03; // can be negative if staff is slow

    // Average effective friendliness: each point above 5 gives 2% tip bonus
    const avgFriendliness = active.reduce((sum, s) => sum + this.getEffectiveStat(s, s.friendliness), 0) / active.length;
    const tipBonus = (avgFriendliness - 5) * 0.02;

    // More staff = faster service (diminishing returns)
    const staffCountBonus = Math.min(active.length * 0.05, 0.2); // up to 20%

    return {
      speedBonus: speedBonus + staffCountBonus,
      tipBonus: Math.max(0, tipBonus),
    };
  }

  /** Update staff morale at end of day */
  updateStaffMorale(): void {
    const brokenCount = this.loc.equipment.filter(e => e.broken).length;

    for (const member of this.loc.staff) {
      let moraleChange = 0;
      const isWorking = member.assigned && member.shift !== ShiftType.OFF;

      // Working staff get tired (-3 to -8 based on workload)
      // Full-day shifts are more tiring
      if (isWorking) {
        const fatigue = member.shift === ShiftType.FULL_DAY ? 5 + Math.random() * 5 : 3 + Math.random() * 5;
        moraleChange -= fatigue;
        member.consecutiveDaysWorked = (member.consecutiveDaysWorked ?? 0) + 1;
      } else {
        // Off-duty staff recover morale (+2 to +5)
        moraleChange += 2 + Math.random() * 3;
        member.consecutiveDaysWorked = 0;
      }

      // Schedule fairness: working 5+ consecutive days without a day off causes fatigue
      if (member.consecutiveDaysWorked >= 5) {
        const overworkPenalty = (member.consecutiveDaysWorked - 4) * 2;
        moraleChange -= overworkPenalty;
      }

      // Fair wages boost morale, underpaying hurts
      const fairWage = 15 + ((member.speed + member.accuracy + member.friendliness) / 3) * 3;
      if (member.wage >= fairWage) {
        moraleChange += 1;
      } else {
        moraleChange -= 2;
      }

      // Broken equipment = bad working conditions
      if (isWorking && brokenCount > 0) {
        moraleChange -= brokenCount * 1.5;
      }

      // High reputation = pride in workplace
      if (this.reputation >= 4) {
        moraleChange += 1;
      }

      // Research morale bonus
      const researchFx = this.getResearchEffects();
      if (researchFx.staffMoraleBonus) {
        moraleChange += researchFx.staffMoraleBonus;
      }

      member.morale = Math.max(0, Math.min(100, member.morale + moraleChange));
    }
  }

  /** Train a staff member: improve one random stat by 1 (costs money) */
  trainStaff(memberId: string): { success: boolean; stat?: string; cost: number } {
    const loc = this.loc;
    const member = loc.staff.find(s => s.id === memberId);
    if (!member) return { success: false, cost: 0 };

    // Training cost scales with current skill level
    const avgStat = (member.speed + member.accuracy + member.friendliness) / 3;
    let cost = Math.round(20 + avgStat * 10);
    const researchFx = this.getResearchEffects();
    if (researchFx.staffTrainingDiscount) {
      cost = Math.round(cost * (1 - researchFx.staffTrainingDiscount));
    }

    if (loc.money < cost) return { success: false, cost };

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

    loc.money -= cost;
    loc.dailyExpenses += cost;
    member[chosen.key] += 1;
    // Training also gives a small morale boost
    member.morale = Math.min(100, member.morale + 5);

    return { success: true, stat: chosen.key, cost };
  }

  /** Get total daily maintenance cost for all equipment */
  getMaintenanceCost(): number {
    let total = 0;
    for (const owned of this.loc.equipment) {
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

    // Apply research discounts
    const rFx = this.getResearchEffects();
    const discountedCost = Math.round(def.cost * (1 - (rFx.campaignDiscount ?? 0)));
    if (this.money < discountedCost) return false;

    this.money -= discountedCost;
    this.dailyExpenses += discountedCost;
    const bonusDays = rFx.campaignDurationBonus ?? 0;
    this.activeCampaigns.push({ id: campaignId, daysRemaining: def.durationDays + bonusDays });
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
    const loc = this.loc;
    loc.activeCampaigns = loc.activeCampaigns
      .map(c => ({ ...c, daysRemaining: c.daysRemaining - 1 }))
      .filter(c => c.daysRemaining > 0);
  }

  // ── Multi-location franchise methods ──────────────────────────────

  /** Get the current location state (only valid in franchise mode) */
  get currentLocation(): LocationState | undefined {
    if (!this.franchiseMode || this.locations.length === 0) return undefined;
    return this.locations[this.currentLocationId];
  }

  /**
   * Get the active location-scoped data source.
   * In franchise mode, returns the current location object.
   * In non-franchise mode, returns `this` (GameState has all LocationState fields).
   * Writes to the returned object update the correct source.
   */
  get loc(): LocationState {
    if (this.franchiseMode && this.locations.length > 0) {
      return this.locations[this.currentLocationId];
    }
    return this as any;
  }

  /** Get the display name of the active location, or empty string if not in franchise mode */
  get locationName(): string {
    if (!this.franchiseMode || this.locations.length === 0) return '';
    return this.locations[this.currentLocationId].name;
  }

  /** Initialize franchise mode by wrapping current single-location state into locations[0] */
  initFranchiseMode(): void {
    if (this.franchiseMode) return;

    const firstLocation: LocationState = {
      id: 0,
      name: 'Hometown',
      money: this.money,
      dailyRevenue: this.dailyRevenue,
      dailyExpenses: this.dailyExpenses,
      reputation: this.reputation,
      reputationMomentum: this.reputationMomentum,
      criticReviews: [...this.criticReviews],
      ingredients: [...this.ingredients],
      flavors: [...this.flavors],
      staff: [...this.staff],
      menuPrices: new Map(this.menuPrices),
      dayReports: [...this.dayReports],
      equipment: [...this.equipment],
      activeCampaigns: [...this.activeCampaigns],
      currentDecor: this.currentDecor,
      unlockedDecor: [...this.unlockedDecor],
      currentSeating: this.currentSeating,
      unlockedSeating: [...this.unlockedSeating],
      currentSignage: this.currentSignage,
      unlockedSignage: [...this.unlockedSignage],
      loanAmount: this.loanAmount,
      loanInterestRate: this.loanInterestRate,
      loanDaysRemaining: this.loanDaysRemaining,
      lastInspectionDay: this.lastInspectionDay,
      closureDaysRemaining: this.closureDaysRemaining,
      inspectionHistory: [...this.inspectionHistory],
      recipes: [...this.recipes],
      loyalCustomers: [...this.loyalCustomers],
      weather: this.weather,
    };

    this.locations = [firstLocation];
    this.currentLocationId = 0;
    this.franchiseMode = true;
  }

  /** Add a new franchise location. Returns the new location or null if can't afford. */
  addLocation(name: string, setupCost: number): LocationState | null {
    if (!this.franchiseMode) return null;
    if (this.money < setupCost) return null;

    this.money -= setupCost;

    const loc: LocationState = {
      id: this.locations.length,
      name,
      money: 0,
      dailyRevenue: 0,
      dailyExpenses: 0,
      reputation: STARTING_REPUTATION,
      reputationMomentum: 0,
      criticReviews: [],
      ingredients: [],
      flavors: this.flavors.filter(f => f.unlocked).map(f => ({ ...f })),
      staff: [],
      menuPrices: new Map(),
      dayReports: [],
      equipment: [
        { id: EquipmentId.ICE_CREAM_MAKER, tier: 1, condition: 100, broken: false },
        { id: EquipmentId.FREEZER, tier: 1, condition: 100, broken: false },
        { id: EquipmentId.POS, tier: 1, condition: 100, broken: false },
      ],
      activeCampaigns: [],
      currentDecor: DecorThemeId.BASIC,
      unlockedDecor: [DecorThemeId.BASIC],
      currentSeating: SeatingId.NONE,
      unlockedSeating: [SeatingId.NONE],
      currentSignage: SignageId.NONE,
      unlockedSignage: [SignageId.NONE],
      loanAmount: 0,
      loanInterestRate: 0,
      loanDaysRemaining: 0,
      lastInspectionDay: 0,
      closureDaysRemaining: 0,
      inspectionHistory: [],
      recipes: [],
      loyalCustomers: [],
      weather: WeatherType.SUNNY,
    };

    this.locations.push(loc);
    return loc;
  }

  /** Switch the active location */
  switchLocation(locationId: number): boolean {
    if (!this.franchiseMode) return false;
    if (locationId < 0 || locationId >= this.locations.length) return false;
    this.currentLocationId = locationId;
    return true;
  }

  /** Get aggregate franchise stats across all locations */
  getFranchiseStats(): {
    totalRevenue: number;
    totalReputation: number;
    locationCount: number;
    totalStaff: number;
  } {
    if (!this.franchiseMode) {
      return {
        totalRevenue: this.dailyRevenue,
        totalReputation: this.reputation,
        locationCount: 1,
        totalStaff: this.staff.length,
      };
    }

    return {
      totalRevenue: this.locations.reduce((sum, loc) => sum + loc.dailyRevenue, 0),
      totalReputation: this.locations.reduce((sum, loc) => sum + loc.reputation, 0) / this.locations.length,
      locationCount: this.locations.length,
      totalStaff: this.locations.reduce((sum, loc) => sum + loc.staff.length, 0),
    };
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
          this.unlockFlavor(flavorId);
        }
      }

      // Season 5: activate franchise mode
      if (this.season === 5 && !this.franchiseMode) {
        this.initFranchiseMode();
      }
    }
  }

  /** Unlock a flavor by id, using catalog data */
  unlockFlavor(flavorId: string): boolean {
    if (this.unlockedFlavors.has(flavorId)) return false;
    this.unlockedFlavors.add(flavorId);

    // Look up from catalog for proper data
    const catalogEntry = FLAVOR_CATALOG.find(f => f.id === flavorId);
    if (catalogEntry) {
      this.flavors.push({
        id: catalogEntry.id,
        name: catalogEntry.name,
        unlocked: true,
        ingredients: catalogEntry.ingredients,
        popularity: catalogEntry.popularity,
      });
    } else {
      // Fallback for flavors not in catalog
      const name = flavorId.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      this.flavors.push({
        id: flavorId,
        name,
        unlocked: true,
        ingredients: ['milk', 'sugar'],
        popularity: 0.5,
      });
    }
    return true;
  }

  /** Create a new recipe */
  createRecipe(name: string, flavorId: string, toppings: string[], style: string, price: number): Recipe | null {
    if (!name.trim() || this.recipes.length >= 10) return null;
    if (this.recipes.some(r => r.name.toLowerCase() === name.toLowerCase())) return null;

    const recipe: Recipe = {
      id: `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      flavorId,
      toppings,
      style,
      price,
      timesSold: 0,
      totalRating: 0,
    };
    this.recipes.push(recipe);
    return recipe;
  }

  /** Delete a recipe by id */
  deleteRecipe(recipeId: string): boolean {
    const idx = this.recipes.findIndex(r => r.id === recipeId);
    if (idx === -1) return false;
    this.recipes.splice(idx, 1);
    return true;
  }

  /** Record a sale of a recipe with satisfaction score */
  recordRecipeSale(recipeId: string, satisfaction: number): void {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    recipe.timesSold++;
    recipe.totalRating += satisfaction;
  }

  /** Get average rating for a recipe (0-1) */
  getRecipeRating(recipe: Recipe): number {
    return recipe.timesSold > 0 ? recipe.totalRating / recipe.timesSold : 0;
  }

  /** Get popular recipes (sold 3+ times with good ratings), used for customer ordering */
  getPopularRecipes(): Recipe[] {
    return this.recipes.filter(r => r.timesSold >= 3 && this.getRecipeRating(r) > 0.5);
  }

  /** Register or update a loyal customer after being served */
  registerLoyalCustomer(favoriteFlavor: string): LoyalCustomer | null {
    // Chance to register: 15% base, doubled if loyalty card campaign active
    const loyaltyCampaignActive = this.activeCampaigns.some(c => c.id === CampaignId.LOYALTY_CARDS);
    const chance = loyaltyCampaignActive ? 0.30 : 0.15;
    if (Math.random() > chance) return null;

    // Check if an existing loyal customer is "returning"
    // Pick a random existing loyal customer who hasn't visited today
    const returningPool = this.loyalCustomers.filter(lc => lc.lastVisitDay < this.day);
    if (returningPool.length > 0 && Math.random() < 0.5) {
      const returning = returningPool[Math.floor(Math.random() * returningPool.length)];
      returning.visits++;
      returning.points += loyaltyCampaignActive ? 2 : 1;
      returning.lastVisitDay = this.day;
      returning.favoriteFlavor = favoriteFlavor;
      return returning;
    }

    // Create new loyal customer (max 20 tracked)
    if (this.loyalCustomers.length >= 20) {
      // Remove least active
      this.loyalCustomers.sort((a, b) => b.visits - a.visits);
      this.loyalCustomers.pop();
    }

    const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Dakota',
      'Jamie', 'Drew', 'Reese', 'Skyler', 'Peyton', 'Hayden', 'Finley', 'Emery', 'Sage', 'Rowan'];
    const usedNames = new Set(this.loyalCustomers.map(lc => lc.name));
    const available = names.filter(n => !usedNames.has(n));
    const name = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : `Customer #${this.loyalCustomers.length + 1}`;

    const newCustomer: LoyalCustomer = {
      id: `loyal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      visits: 1,
      points: loyaltyCampaignActive ? 2 : 1,
      favoriteFlavor,
      lastVisitDay: this.day,
    };
    this.loyalCustomers.push(newCustomer);
    return newCustomer;
  }

  /** Get top loyal customers sorted by visits */
  getTopCustomers(count: number = 10): LoyalCustomer[] {
    return [...this.loyalCustomers].sort((a, b) => b.visits - a.visits).slice(0, count);
  }

  /** Get loyalty bonus: more loyal customers = slight patience/tip boost */
  getLoyaltyEffects(): { patienceBonus: number; tipBonus: number; spawnBonus: number } {
    const activeLoyal = this.loyalCustomers.filter(lc => lc.visits >= 3).length;
    return {
      patienceBonus: Math.min(activeLoyal * 500, 3000),  // up to +3s
      tipBonus: Math.min(activeLoyal * 0.01, 0.10),       // up to +10%
      spawnBonus: Math.min(activeLoyal * 0.02, 0.15),     // up to 15% more customers
    };
  }

  /** Check if a research node's prerequisites are met */
  canResearch(nodeId: string): boolean {
    if (this.unlockedResearch.has(nodeId)) return false;
    const node = RESEARCH_CATALOG.find(n => n.id === nodeId);
    if (!node) return false;
    if (this.researchPoints < node.cost) return false;
    return node.prerequisites.every(p => this.unlockedResearch.has(p));
  }

  /** Unlock a research node, spending research points and applying effects */
  purchaseResearch(nodeId: string): boolean {
    if (!this.canResearch(nodeId)) return false;
    const node = RESEARCH_CATALOG.find(n => n.id === nodeId)!;
    this.researchPoints -= node.cost;
    this.unlockedResearch.add(nodeId);

    // Apply flavor unlocks
    if (node.effects.unlockFlavors) {
      for (const fid of node.effects.unlockFlavors) {
        this.unlockFlavor(fid);
      }
    }
    return true;
  }

  /** Get combined research effects from all unlocked nodes */
  getResearchEffects(): ResearchEffects {
    const combined: ResearchEffects = {};
    for (const nodeId of this.unlockedResearch) {
      const node = RESEARCH_CATALOG.find(n => n.id === nodeId);
      if (!node) continue;
      const fx = node.effects;
      if (fx.equipmentDiscount) combined.equipmentDiscount = (combined.equipmentDiscount ?? 0) + fx.equipmentDiscount;
      if (fx.staffTrainingDiscount) combined.staffTrainingDiscount = Math.max(combined.staffTrainingDiscount ?? 0, fx.staffTrainingDiscount);
      if (fx.staffMoraleBonus) combined.staffMoraleBonus = Math.max(combined.staffMoraleBonus ?? 0, fx.staffMoraleBonus);
      if (fx.campaignDiscount) combined.campaignDiscount = (combined.campaignDiscount ?? 0) + fx.campaignDiscount;
      if (fx.campaignDurationBonus) combined.campaignDurationBonus = (combined.campaignDurationBonus ?? 0) + fx.campaignDurationBonus;
      if (fx.patienceBonus) combined.patienceBonus = (combined.patienceBonus ?? 0) + fx.patienceBonus;
      if (fx.reputationGainMult) combined.reputationGainMult = (combined.reputationGainMult ?? 1) * fx.reputationGainMult;
      if (fx.qualityBonus) combined.qualityBonus = (combined.qualityBonus ?? 0) + fx.qualityBonus;
    }
    return combined;
  }

  /** Get current milestone stats for checking milestone conditions */
  getMilestoneStats(): MilestoneStats {
    return {
      totalDays: this.day,
      totalCustomersServed: this.totalCustomersServed,
      totalRevenue: this.totalRevenue,
      reputation: this.reputation,
      equipmentOwned: this.loc.equipment.filter(e => e.tier > 0).length,
      staffCount: this.loc.staff.length,
      flavorsUnlocked: this.unlockedFlavors.size,
    };
  }

  /** Check and award milestones, returns newly completed milestone names */
  checkMilestones(): string[] {
    const stats = this.getMilestoneStats();
    const newlyCompleted: string[] = [];
    for (const milestone of MILESTONE_CATALOG) {
      if (this.completedMilestones.has(milestone.id)) continue;
      if (milestone.condition(stats)) {
        this.completedMilestones.add(milestone.id);
        this.researchPoints += milestone.points;
        newlyCompleted.push(milestone.name);
      }
    }
    return newlyCompleted;
  }

  /** Get current decor definition */
  getDecorDef(): DecorThemeDef {
    return DECOR_CATALOG.find(d => d.id === this.currentDecor) ?? DECOR_CATALOG[0];
  }

  /** Purchase and apply a decor theme */
  purchaseDecor(decorId: DecorThemeId): boolean {
    if (this.unlockedDecor.includes(decorId)) {
      // Already owned — just switch
      this.currentDecor = decorId;
      return true;
    }

    const def = DECOR_CATALOG.find(d => d.id === decorId);
    if (!def || this.money < def.cost) return false;

    this.money -= def.cost;
    this.dailyExpenses += def.cost;
    this.unlockedDecor.push(decorId);
    this.currentDecor = decorId;
    return true;
  }

  /** Get serving styles available based on equipment */
  getAvailableStyles(): ServingStyleDef[] {
    return SERVING_STYLE_CATALOG.filter(style => {
      if (!style.requiredEquipment) return true;
      const tier = this.getEquipmentTier(style.requiredEquipment);
      return tier > 0;
    });
  }

  /** Get toppings available based on Toppings Bar equipment tier */
  getAvailableToppings(): ToppingDef[] {
    const toppingsTier = this.getEquipmentTier(EquipmentId.TOPPINGS_BAR);
    return TOPPING_CATALOG.filter(t => t.requiredTier <= toppingsTier);
  }

  /** Get current seating definition */
  getSeatingDef(): SeatingDef {
    return SEATING_CATALOG.find(s => s.id === this.currentSeating) ?? SEATING_CATALOG[0];
  }

  /** Purchase and apply a seating arrangement */
  purchaseSeating(seatingId: SeatingId): boolean {
    if (this.unlockedSeating.includes(seatingId)) {
      // Already owned — just switch
      this.currentSeating = seatingId;
      return true;
    }

    const def = SEATING_CATALOG.find(s => s.id === seatingId);
    if (!def || this.money < def.cost) return false;

    this.money -= def.cost;
    this.dailyExpenses += def.cost;
    this.unlockedSeating.push(seatingId);
    this.currentSeating = seatingId;
    return true;
  }

  /** Get current signage definition */
  getSignageDef(): SignageDef {
    return SIGNAGE_CATALOG.find(s => s.id === this.currentSignage) ?? SIGNAGE_CATALOG[0];
  }

  /** Purchase and apply a signage option */
  purchaseSignage(signageId: SignageId): boolean {
    if (this.unlockedSignage.includes(signageId)) {
      this.currentSignage = signageId;
      return true;
    }

    const def = SIGNAGE_CATALOG.find(s => s.id === signageId);
    if (!def || this.money < def.cost) return false;

    this.money -= def.cost;
    this.dailyExpenses += def.cost;
    this.unlockedSignage.push(signageId);
    this.currentSignage = signageId;
    return true;
  }

  /** Take out a loan */
  takeLoan(loanId: string): boolean {
    // Can't take a loan if one is already active
    if (this.loanAmount > 0) return false;

    const def = LOAN_CATALOG.find(l => l.id === loanId);
    if (!def) return false;

    this.loanAmount = def.amount;
    this.loanInterestRate = def.interestRate;
    this.loanDaysRemaining = def.durationDays;
    this.money += def.amount;
    return true;
  }

  /** Make a payment on the active loan. Returns actual amount paid. */
  makeLoanPayment(amount: number): number {
    if (this.loanAmount <= 0) return 0;
    const payment = Math.min(amount, this.loanAmount, this.money);
    if (payment <= 0) return 0;

    this.money -= payment;
    this.dailyExpenses += payment;
    this.loanAmount = Math.max(0, this.loanAmount - payment);

    // If fully repaid, clear loan state
    if (this.loanAmount <= 0) {
      this.loanAmount = 0;
      this.loanInterestRate = 0;
      this.loanDaysRemaining = 0;
    }

    return payment;
  }

  /** Accrue daily interest on outstanding loan */
  private accrueInterest(): void {
    const loc = this.loc;
    if (loc.loanAmount <= 0) return;

    loc.loanDaysRemaining--;

    // Apply daily interest
    const interest = loc.loanAmount * loc.loanInterestRate;
    loc.loanAmount += interest;

    // If loan is overdue, apply penalty: double interest rate and reputation hit
    if (loc.loanDaysRemaining <= 0 && loc.loanAmount > 0) {
      const penalty = loc.loanAmount * loc.loanInterestRate; // extra interest
      loc.loanAmount += penalty;
      loc.reputation = Math.max(0.5, loc.reputation - 0.1);
    }
  }

  /** Get total amount owed including future interest */
  getLoanTotalOwed(): number {
    if (this.loanAmount <= 0) return 0;
    return this.loanAmount;
  }

  /** Run a health inspection and return the result */
  runHealthInspection(): HealthInspectionResult {
    let score = 100;
    const violations: string[] = [];

    // Equipment condition: each broken piece is -15, low condition is -5
    for (const owned of this.loc.equipment) {
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
    const assignedStaff = this.loc.staff.filter(s => s.assigned).length;
    if (this.loc.staff.length > 0 && assignedStaff === 0) {
      score -= 15;
      violations.push('No staff assigned — understaffed');
    }

    // Low staff morale: -5 per staff with morale < 25 (indicates poor conditions)
    const unhappyStaff = this.loc.staff.filter(s => s.morale < 25).length;
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
    // Track cumulative stats from previous day before resetting
    this.seasonRevenue += this.dailyRevenue;
    this.totalRevenue += this.dailyRevenue;

    this.day++;
    this.seasonDay++;
    this.currentHour = STORE_OPEN_HOUR;
    this.phase = DayPhase.PREPARE;
    this.dailyRevenue = 0;
    this.dailyExpenses = 0;

    // Also reset location-scoped daily counters in franchise mode
    if (this.franchiseMode && this.currentLocation) {
      this.currentLocation.dailyRevenue = 0;
      this.currentLocation.dailyExpenses = 0;
    }

    // Expire ingredients
    const loc = this.loc;
    loc.ingredients = loc.ingredients.map(ing => ({
      ...ing,
      expiresInDays: ing.expiresInDays - 1,
    })).filter(ing => ing.expiresInDays > 0 && ing.quantity > 0);

    // Deduct staff wages
    const totalWages = loc.staff.reduce((sum, s) => sum + s.wage, 0);
    loc.money -= totalWages;
    loc.dailyExpenses += totalWages;

    // Deduct equipment maintenance
    const maintenance = this.getMaintenanceCost();
    loc.money -= maintenance;
    loc.dailyExpenses += maintenance;

    // Degrade equipment
    this.degradeEquipment();

    // Update staff morale
    this.updateStaffMorale();

    // Tick down campaign durations
    this.updateCampaigns();

    // Accrue loan interest
    this.accrueInterest();

    // Tick down closure days from failed inspections
    if (loc.closureDaysRemaining > 0) {
      loc.closureDaysRemaining--;
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
