// Display
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Time system
export const DEFAULT_DAY_DURATION_MS = 5 * 60 * 1000; // 5 minutes real time per in-game day
export const HOURS_PER_DAY = 14; // Store open 8am-10pm
export const STORE_OPEN_HOUR = 8;
export const STORE_CLOSE_HOUR = 22;

// Phases within a day
export enum DayPhase {
  PREPARE = 'prepare',
  SERVE = 'serve',
  CLOSE = 'close',
  REPORT = 'report',
}

// Game speed multipliers
export const SPEED_NORMAL = 1;
export const SPEED_FAST = 2;
export const SPEED_PAUSED = 0;

// Inventory thresholds
export const LOW_STOCK_THRESHOLD = 10;

// Loyalty redemption
export const LOYALTY_REDEMPTION_COST = 10;     // points required to redeem
export const LOYALTY_DISCOUNT_PERCENT = 0.25;  // 25% discount when redeemed

// Starting resources
export const STARTING_MONEY = 500;
export const STARTING_REPUTATION = 2.5; // out of 5 stars

// Customer
export const BASE_PATIENCE_MS = 30000; // 30 seconds at 1x speed
export const MAX_QUEUE_LENGTH = 8;

// Dietary Restrictions
export enum DietaryRestriction {
  NONE = 'none',
  VEGAN = 'vegan',       // no milk-based ingredients
  NUT_FREE = 'nut_free', // no nut ingredients or toppings
}

/** Ingredient ids that contain dairy */
export const DAIRY_INGREDIENTS = ['milk', 'cream', 'hot_fudge', 'caramel'];

/** Ingredient ids that contain nuts */
export const NUT_INGREDIENTS = ['nuts'];

// Pricing
export const BASE_SCOOP_PRICE = 3.00;
export const BASE_TOPPING_PRICE = 0.50;

// Suppliers
export interface SupplierDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  priceMult: number;        // multiplier on base ingredient prices
  qualityBonus: number;     // bonus to customer satisfaction from fresh ingredients
  /** Some suppliers don't stock everything */
  excludedIngredients?: string[];
}

export const SUPPLIER_CATALOG: SupplierDef[] = [
  {
    id: 'budget_mart',
    name: 'Budget Mart',
    description: 'Cheapest prices, but no premium ingredients.',
    icon: '🏷️',
    priceMult: 0.80,
    qualityBonus: 0,
    excludedIngredients: ['vanilla_extract', 'caramel', 'fruit'],
  },
  {
    id: 'main_street',
    name: 'Main Street Supply',
    description: 'Standard prices, everything in stock.',
    icon: '🏪',
    priceMult: 1.0,
    qualityBonus: 0,
  },
  {
    id: 'premium_farms',
    name: 'Premium Farms',
    description: 'Higher prices, but premium quality boosts satisfaction.',
    icon: '🌾',
    priceMult: 1.25,
    qualityBonus: 0.10,
  },
];

/** Bulk discount tiers: [minQty, discountFraction] */
export const BULK_DISCOUNT_TIERS: [number, number][] = [
  [5, 0.20],  // 5+ batches: 20% off
  [3, 0.10],  // 3+ batches: 10% off
];

// Flavor Catalog
export interface FlavorDef {
  id: string;
  name: string;
  ingredients: string[];     // ingredient ids required
  popularity: number;        // 0-1 base popularity
  starter: boolean;          // true = unlocked from the start
}

export const FLAVOR_CATALOG: FlavorDef[] = [
  // Starters
  { id: 'vanilla', name: 'Vanilla', ingredients: ['milk', 'sugar', 'vanilla_extract'], popularity: 0.8, starter: true },
  { id: 'chocolate', name: 'Chocolate', ingredients: ['milk', 'sugar', 'cocoa'], popularity: 0.9, starter: true },
  { id: 'strawberry', name: 'Strawberry', ingredients: ['milk', 'sugar', 'strawberries'], popularity: 0.7, starter: true },
  // Season 2 unlocks
  { id: 'mint_chip', name: 'Mint Chip', ingredients: ['milk', 'sugar', 'vanilla_extract'], popularity: 0.7, starter: false },
  { id: 'cookies_cream', name: 'Cookies & Cream', ingredients: ['milk', 'sugar', 'cocoa'], popularity: 0.8, starter: false },
  // Season 3 unlocks
  { id: 'mango', name: 'Mango', ingredients: ['milk', 'sugar', 'fruit'], popularity: 0.6, starter: false },
  { id: 'pistachio', name: 'Pistachio', ingredients: ['milk', 'sugar', 'nuts'], popularity: 0.5, starter: false },
  // Season 4 unlocks
  { id: 'salted_caramel', name: 'Salted Caramel', ingredients: ['milk', 'sugar', 'caramel'], popularity: 0.8, starter: false },
  { id: 'lavender', name: 'Lavender', ingredients: ['milk', 'sugar', 'vanilla_extract'], popularity: 0.4, starter: false },
  // Season 5 unlocks
  { id: 'matcha', name: 'Matcha', ingredients: ['milk', 'sugar'], popularity: 0.5, starter: false },
  { id: 'rocky_road', name: 'Rocky Road', ingredients: ['milk', 'sugar', 'cocoa', 'nuts'], popularity: 0.7, starter: false },
  // Additional unlockable flavors (for research tree / events)
  { id: 'butter_pecan', name: 'Butter Pecan', ingredients: ['milk', 'sugar', 'nuts'], popularity: 0.6, starter: false },
  { id: 'cookie_dough', name: 'Cookie Dough', ingredients: ['milk', 'sugar', 'vanilla_extract'], popularity: 0.75, starter: false },
  { id: 'coffee', name: 'Coffee', ingredients: ['milk', 'sugar'], popularity: 0.65, starter: false },
  { id: 'lemon_sorbet', name: 'Lemon Sorbet', ingredients: ['sugar', 'fruit'], popularity: 0.5, starter: true },
  { id: 'coconut', name: 'Coconut', ingredients: ['milk', 'sugar'], popularity: 0.45, starter: false },
  { id: 'raspberry', name: 'Raspberry', ingredients: ['milk', 'sugar', 'fruit'], popularity: 0.55, starter: false },
  { id: 'peanut_butter', name: 'Peanut Butter', ingredients: ['milk', 'sugar', 'nuts'], popularity: 0.6, starter: false },
  { id: 'birthday_cake', name: 'Birthday Cake', ingredients: ['milk', 'sugar', 'vanilla_extract', 'sprinkles'], popularity: 0.7, starter: false },
  { id: 'caramel_swirl', name: 'Caramel Swirl', ingredients: ['milk', 'sugar', 'caramel'], popularity: 0.65, starter: false },
  { id: 'blueberry', name: 'Blueberry', ingredients: ['milk', 'sugar', 'fruit'], popularity: 0.5, starter: false },
];

// Toppings
export interface ToppingDef {
  id: string;
  name: string;
  ingredientId: string;     // matches an ingredient in inventory
  price: number;            // price charged to customer
  popularity: number;       // 0-1, chance of being requested
  requiredTier: number;     // minimum Toppings Bar tier to offer (0 = always available)
}

export const TOPPING_CATALOG: ToppingDef[] = [
  { id: 'sprinkles', name: 'Sprinkles', ingredientId: 'sprinkles', price: 0.50, popularity: 0.5, requiredTier: 0 },
  { id: 'cream', name: 'Whipped Cream', ingredientId: 'cream', price: 0.50, popularity: 0.4, requiredTier: 0 },
  { id: 'hot_fudge', name: 'Hot Fudge', ingredientId: 'hot_fudge', price: 0.75, popularity: 0.35, requiredTier: 1 },
  { id: 'cherries', name: 'Cherries', ingredientId: 'cherries', price: 0.50, popularity: 0.3, requiredTier: 1 },
  { id: 'nuts', name: 'Crushed Nuts', ingredientId: 'nuts', price: 0.60, popularity: 0.25, requiredTier: 1 },
  { id: 'candy_pieces', name: 'Candy Pieces', ingredientId: 'candy_pieces', price: 0.65, popularity: 0.2, requiredTier: 2 },
  { id: 'fruit', name: 'Fresh Fruit', ingredientId: 'fruit', price: 0.70, popularity: 0.2, requiredTier: 2 },
  { id: 'caramel', name: 'Caramel Drizzle', ingredientId: 'caramel', price: 0.75, popularity: 0.3, requiredTier: 2 },
];

// Equipment
export enum EquipmentId {
  ICE_CREAM_MAKER = 'ice_cream_maker',
  SOFT_SERVE_MACHINE = 'soft_serve_machine',
  FREEZER = 'freezer',
  BLENDER = 'blender',
  TOPPINGS_BAR = 'toppings_bar',
  POS = 'pos',
}

export interface EquipmentTier {
  tier: number;
  name: string;
  cost: number;
  maintenanceCost: number; // per day
  effects: EquipmentEffects;
}

export interface EquipmentEffects {
  serveSpeedMult?: number;     // multiplier on serve time (lower = faster)
  capacityBonus?: number;      // extra max queue slots
  qualityBonus?: number;       // bonus to customer satisfaction/tips
  breakdownChance?: number;    // chance per day of breakdown (0-1)
}

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  description: string;
  tiers: EquipmentTier[];
}

// Story Mode Seasons
export interface SeasonDef {
  season: number;
  name: string;
  setting: string;
  description: string;
  daysPerSeason: number;
  revenueTarget: number;     // total revenue needed to pass
  reputationTarget: number;  // minimum reputation at season end
  startingMoney: number;     // money player starts with (or carries over)
  unlockFlavors?: string[];  // new flavors unlocked at season start
  // Franchise mode (Season 5+)
  isFranchise?: boolean;     // activates multi-location mode
  locationTarget?: number;   // number of locations required to win
  locationSetupCost?: number; // cost to open each new location
}

export const SEASON_CATALOG: SeasonDef[] = [
  {
    season: 1,
    name: 'Humble Beginnings',
    setting: 'Hometown Stand',
    description: 'Start your ice cream journey at a small roadside stand. Learn the basics of running a shop.',
    daysPerSeason: 7,
    revenueTarget: 300,
    reputationTarget: 2.0,
    startingMoney: STARTING_MONEY,
  },
  {
    season: 2,
    name: 'Beach Town',
    setting: 'Small Beach Town',
    description: 'Move to a busy beach town. Higher customer volume but more competition.',
    daysPerSeason: 10,
    revenueTarget: 800,
    reputationTarget: 2.5,
    startingMoney: 800,
    unlockFlavors: ['mint_chip', 'cookies_cream'],
  },
  {
    season: 3,
    name: 'City Food Court',
    setting: 'City Food Court',
    description: 'Take on the big city. Manage multiple stations and face fierce competition.',
    daysPerSeason: 12,
    revenueTarget: 1800,
    reputationTarget: 3.0,
    startingMoney: 1200,
    unlockFlavors: ['mango', 'pistachio'],
  },
  {
    season: 4,
    name: 'Resort Living',
    setting: 'Tourist Resort',
    description: 'Serve premium VIP clientele at a luxury resort. High expectations, high rewards.',
    daysPerSeason: 14,
    revenueTarget: 3000,
    reputationTarget: 3.5,
    startingMoney: 2000,
    unlockFlavors: ['salted_caramel', 'lavender'],
  },
  {
    season: 5,
    name: 'Franchise Launch',
    setting: 'Franchise HQ',
    description: 'Launch your franchise! Open 3 locations and hit aggregate revenue targets across all stores.',
    daysPerSeason: 21,
    revenueTarget: 8000,
    reputationTarget: 3.5,
    startingMoney: 4000,
    unlockFlavors: ['matcha', 'rocky_road'],
    isFranchise: true,
    locationTarget: 3,
    locationSetupCost: 1500,
  },
];

// Accessibility
export interface AccessibilitySettings {
  textScale: number;         // 1.0 = normal, 1.25 = large, 1.5 = extra large
  highContrast: boolean;     // high contrast mode
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  textScale: 1.0,
  highContrast: false,
};

// Weather
export enum WeatherType {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  HOT = 'hot',
  STORMY = 'stormy',
}

export interface WeatherDef {
  type: WeatherType;
  name: string;
  icon: string;
  customerMult: number;     // multiplier on customer spawn (lower = more)
  patienceMult: number;     // multiplier on patience (higher = more patient)
}

export const WEATHER_TABLE: WeatherDef[] = [
  { type: WeatherType.SUNNY, name: 'Sunny', icon: '☀️', customerMult: 0.85, patienceMult: 1.1 },
  { type: WeatherType.CLOUDY, name: 'Cloudy', icon: '⛅', customerMult: 1.0, patienceMult: 1.0 },
  { type: WeatherType.RAINY, name: 'Rainy', icon: '🌧️', customerMult: 1.3, patienceMult: 0.9 },
  { type: WeatherType.HOT, name: 'Hot', icon: '🔥', customerMult: 0.7, patienceMult: 0.85 },
  { type: WeatherType.STORMY, name: 'Stormy', icon: '⛈️', customerMult: 1.5, patienceMult: 0.8 },
];

// Marketing Campaigns
export enum CampaignId {
  LOCAL_ADS = 'local_ads',
  SOCIAL_MEDIA = 'social_media',
  LOYALTY_CARDS = 'loyalty_cards',
}

export interface CampaignDef {
  id: CampaignId;
  name: string;
  description: string;
  icon: string;
  cost: number;           // upfront cost to launch
  durationDays: number;   // how many days it lasts
  effects: CampaignEffects;
}

export interface CampaignEffects {
  customerSpawnMult?: number;   // multiplier on customer spawn rate (lower = more customers)
  reputationBonus?: number;     // daily reputation bonus while active
  tipBonus?: number;            // bonus to tips/revenue
}

export const CAMPAIGN_CATALOG: CampaignDef[] = [
  {
    id: CampaignId.LOCAL_ADS,
    name: 'Local Ads',
    description: 'Place ads in local newspapers and flyers. Attracts more customers.',
    icon: '📰',
    cost: 150,
    durationDays: 5,
    effects: { customerSpawnMult: 0.75 },
  },
  {
    id: CampaignId.SOCIAL_MEDIA,
    name: 'Social Media Promo',
    description: 'Run a social media campaign. Boosts reputation and attracts some customers.',
    icon: '📱',
    cost: 100,
    durationDays: 3,
    effects: { customerSpawnMult: 0.9, reputationBonus: 0.05 },
  },
  {
    id: CampaignId.LOYALTY_CARDS,
    name: 'Loyalty Card Program',
    description: 'Launch loyalty cards. Increases tips and builds long-term reputation.',
    icon: '💳',
    cost: 200,
    durationDays: 7,
    effects: { tipBonus: 0.1, reputationBonus: 0.03 },
  },
];

// Staff Specialties
export enum StaffSpecialty {
  NONE = 'none',
  SCOOPING = 'scooping',     // bonus to speed
  BLENDING = 'blending',     // bonus to accuracy (milkshakes/smoothies)
  CASHIERING = 'cashiering', // bonus to friendliness (tips)
}

export const SPECIALTY_BONUS = 0.15; // 15% bonus to the matching stat

export const SPECIALTY_LABELS: Record<StaffSpecialty, string> = {
  [StaffSpecialty.NONE]: '—',
  [StaffSpecialty.SCOOPING]: 'Scooper',
  [StaffSpecialty.BLENDING]: 'Blender',
  [StaffSpecialty.CASHIERING]: 'Cashier',
};

export const SPECIALTY_ICONS: Record<StaffSpecialty, string> = {
  [StaffSpecialty.NONE]: '',
  [StaffSpecialty.SCOOPING]: '🍨',
  [StaffSpecialty.BLENDING]: '🥤',
  [StaffSpecialty.CASHIERING]: '💰',
};

// Staff Scheduling
export enum ShiftType {
  OFF = 'off',
  MORNING = 'morning',     // 8am-1pm
  AFTERNOON = 'afternoon', // 1pm-6pm
  FULL_DAY = 'full_day',   // 8am-10pm
}

export const SHIFT_HOURS: Record<ShiftType, { start: number; end: number }> = {
  [ShiftType.OFF]: { start: 0, end: 0 },
  [ShiftType.MORNING]: { start: 8, end: 13 },
  [ShiftType.AFTERNOON]: { start: 13, end: 22 },
  [ShiftType.FULL_DAY]: { start: 8, end: 22 },
};

// Health Inspections
export interface HealthInspectionResult {
  day: number;
  score: number;         // 0-100
  passed: boolean;       // score >= 60
  violations: string[];  // list of violations found
  closureDays: number;   // 0 if passed, 1-3 if failed badly
  reputationChange: number;
}

/** Inspection chance per day (10%) */
export const INSPECTION_CHANCE = 0.10;
/** Minimum days between inspections */
export const INSPECTION_COOLDOWN_DAYS = 5;
/** Score threshold to pass */
export const INSPECTION_PASS_THRESHOLD = 60;

// Loans
export interface LoanDef {
  id: string;
  name: string;
  amount: number;         // principal
  interestRate: number;   // daily interest rate (e.g., 0.02 = 2% per day)
  durationDays: number;   // repayment period
  description: string;
}

export const LOAN_CATALOG: LoanDef[] = [
  {
    id: 'small_loan',
    name: 'Small Loan',
    amount: 300,
    interestRate: 0.01,
    durationDays: 14,
    description: 'A small loan for minor upgrades. Low interest.',
  },
  {
    id: 'medium_loan',
    name: 'Business Loan',
    amount: 800,
    interestRate: 0.015,
    durationDays: 21,
    description: 'A standard business loan for equipment and expansion.',
  },
  {
    id: 'large_loan',
    name: 'Expansion Loan',
    amount: 2000,
    interestRate: 0.02,
    durationDays: 30,
    description: 'A large loan for major expansion. Higher interest rate.',
  },
];

// Store Decor Themes
export enum DecorThemeId {
  BASIC = 'basic',
  CLASSIC_PARLOR = 'classic_parlor',
  TROPICAL = 'tropical',
  MODERN = 'modern',
  RETRO_DINER = 'retro_diner',
}

export interface DecorThemeDef {
  id: DecorThemeId;
  name: string;
  description: string;
  icon: string;
  cost: number;               // one-time purchase cost
  ambiance: number;           // ambiance score 0-100
  patienceMult: number;       // multiplier on customer patience (>1 = more patient)
  priceTolerance: number;     // willingness to pay premium (0 = none, 0.1 = 10% more)
  floorColor: number;         // hex color for store floor
  accentColor: number;        // hex color for accents
}

export const DECOR_CATALOG: DecorThemeDef[] = [
  {
    id: DecorThemeId.BASIC,
    name: 'Basic Setup',
    description: 'A simple, no-frills ice cream stand.',
    icon: '🏠',
    cost: 0,
    ambiance: 10,
    patienceMult: 1.0,
    priceTolerance: 0,
    floorColor: 0xFFF5E6,
    accentColor: 0xADD8E6,
  },
  {
    id: DecorThemeId.CLASSIC_PARLOR,
    name: 'Classic Parlor',
    description: 'Checkered floors, chrome stools, and a warm nostalgic feel.',
    icon: '🍨',
    cost: 400,
    ambiance: 40,
    patienceMult: 1.1,
    priceTolerance: 0.05,
    floorColor: 0xFAEBD7,
    accentColor: 0xCD853F,
  },
  {
    id: DecorThemeId.TROPICAL,
    name: 'Tropical Paradise',
    description: 'Palm trees, bright colors, and island vibes.',
    icon: '🌴',
    cost: 600,
    ambiance: 55,
    patienceMult: 1.15,
    priceTolerance: 0.08,
    floorColor: 0xE0F8E0,
    accentColor: 0x20B2AA,
  },
  {
    id: DecorThemeId.MODERN,
    name: 'Modern Minimalist',
    description: 'Clean lines, soft lighting, and a premium feel.',
    icon: '✨',
    cost: 900,
    ambiance: 70,
    patienceMult: 1.2,
    priceTolerance: 0.12,
    floorColor: 0xF0F0F0,
    accentColor: 0x708090,
  },
  {
    id: DecorThemeId.RETRO_DINER,
    name: 'Retro Diner',
    description: 'Neon signs, jukeboxes, and 50s Americana charm.',
    icon: '🎶',
    cost: 750,
    ambiance: 60,
    patienceMult: 1.18,
    priceTolerance: 0.10,
    floorColor: 0xFFE4E1,
    accentColor: 0xFF6347,
  },
];

// Seating Arrangements
export enum SeatingId {
  NONE = 'none',
  BASIC_STOOLS = 'basic_stools',
  BOOTHS = 'booths',
  PATIO_SET = 'patio_set',
  PREMIUM_LOUNGE = 'premium_lounge',
}

export interface SeatingDef {
  id: SeatingId;
  name: string;
  description: string;
  icon: string;
  cost: number;               // one-time purchase cost
  capacityBonus: number;      // extra max queue slots
  ambianceBonus: number;      // added to decor ambiance score
  patienceMult: number;       // multiplier on patience (>1 = more patient)
}

export const SEATING_CATALOG: SeatingDef[] = [
  {
    id: SeatingId.NONE,
    name: 'No Seating',
    description: 'Customers stand in line. No extras.',
    icon: '🚶',
    cost: 0,
    capacityBonus: 0,
    ambianceBonus: 0,
    patienceMult: 1.0,
  },
  {
    id: SeatingId.BASIC_STOOLS,
    name: 'Counter Stools',
    description: 'Simple stools along the counter. A few extra seats.',
    icon: '🪑',
    cost: 150,
    capacityBonus: 2,
    ambianceBonus: 5,
    patienceMult: 1.05,
  },
  {
    id: SeatingId.BOOTHS,
    name: 'Cozy Booths',
    description: 'Padded booths for families and groups. Comfortable wait.',
    icon: '🛋️',
    cost: 400,
    capacityBonus: 3,
    ambianceBonus: 15,
    patienceMult: 1.12,
  },
  {
    id: SeatingId.PATIO_SET,
    name: 'Outdoor Patio',
    description: 'Umbrella tables outside. Great for sunny days.',
    icon: '☂️',
    cost: 600,
    capacityBonus: 4,
    ambianceBonus: 20,
    patienceMult: 1.1,
  },
  {
    id: SeatingId.PREMIUM_LOUNGE,
    name: 'Premium Lounge',
    description: 'Plush seating, mood lighting, the works. Maximum comfort.',
    icon: '💎',
    cost: 1000,
    capacityBonus: 5,
    ambianceBonus: 30,
    patienceMult: 1.2,
  },
];

export const EQUIPMENT_CATALOG: EquipmentDef[] = [
  {
    id: EquipmentId.ICE_CREAM_MAKER,
    name: 'Ice Cream Maker',
    description: 'Produces base flavors. Upgrades improve quality.',
    tiers: [
      { tier: 1, name: 'Basic Maker', cost: 0, maintenanceCost: 5, effects: { qualityBonus: 0 } },
      { tier: 2, name: 'Standard Maker', cost: 200, maintenanceCost: 10, effects: { qualityBonus: 0.1 } },
      { tier: 3, name: 'Pro Maker', cost: 500, maintenanceCost: 20, effects: { qualityBonus: 0.25 } },
    ],
  },
  {
    id: EquipmentId.FREEZER,
    name: 'Display Freezer',
    description: 'Stores pre-made batches. Upgrades increase queue capacity.',
    tiers: [
      { tier: 1, name: 'Mini Freezer', cost: 0, maintenanceCost: 3, effects: { capacityBonus: 0 } },
      { tier: 2, name: 'Standard Freezer', cost: 250, maintenanceCost: 8, effects: { capacityBonus: 2 } },
      { tier: 3, name: 'Walk-In Freezer', cost: 600, maintenanceCost: 15, effects: { capacityBonus: 4 } },
    ],
  },
  {
    id: EquipmentId.POS,
    name: 'Point of Sale',
    description: 'Handles payments. Upgrades speed up serving.',
    tiers: [
      { tier: 1, name: 'Cash Register', cost: 0, maintenanceCost: 2, effects: { serveSpeedMult: 1.0 } },
      { tier: 2, name: 'Digital POS', cost: 300, maintenanceCost: 8, effects: { serveSpeedMult: 0.8 } },
      { tier: 3, name: 'Smart POS', cost: 700, maintenanceCost: 15, effects: { serveSpeedMult: 0.6 } },
    ],
  },
  {
    id: EquipmentId.SOFT_SERVE_MACHINE,
    name: 'Soft-Serve Machine',
    description: 'Enables soft-serve options. Improves quality and speed.',
    tiers: [
      { tier: 0, name: 'Not Purchased', cost: 0, maintenanceCost: 0, effects: {} },
      { tier: 1, name: 'Basic Soft-Serve', cost: 400, maintenanceCost: 10, effects: { qualityBonus: 0.05, serveSpeedMult: 0.95 } },
      { tier: 2, name: 'Dual Swirl Machine', cost: 800, maintenanceCost: 18, effects: { qualityBonus: 0.15, serveSpeedMult: 0.85 } },
    ],
  },
  {
    id: EquipmentId.BLENDER,
    name: 'Blender Station',
    description: 'For milkshakes and smoothies. Boosts quality.',
    tiers: [
      { tier: 0, name: 'Not Purchased', cost: 0, maintenanceCost: 0, effects: {} },
      { tier: 1, name: 'Basic Blender', cost: 150, maintenanceCost: 5, effects: { qualityBonus: 0.05 } },
      { tier: 2, name: 'Commercial Blender', cost: 400, maintenanceCost: 12, effects: { qualityBonus: 0.15 } },
    ],
  },
  {
    id: EquipmentId.TOPPINGS_BAR,
    name: 'Toppings Bar',
    description: 'Self-serve toppings. Improves satisfaction and tips.',
    tiers: [
      { tier: 0, name: 'Not Purchased', cost: 0, maintenanceCost: 0, effects: {} },
      { tier: 1, name: 'Basic Bar', cost: 200, maintenanceCost: 5, effects: { qualityBonus: 0.05 } },
      { tier: 2, name: 'Deluxe Bar', cost: 500, maintenanceCost: 12, effects: { qualityBonus: 0.2 } },
    ],
  },
];

// Serving Styles
export interface ServingStyleDef {
  id: string;
  name: string;
  priceMult: number;         // multiplier on base scoop price
  ingredientMult: number;    // multiplier on ingredient usage
  maxScoops: number;         // max scoops for this style
  requiredEquipment?: EquipmentId;  // equipment needed (undefined = always available)
}

// Research Tree
export enum ResearchCategory {
  FLAVORS = 'flavors',
  EQUIPMENT = 'equipment',
  STAFF = 'staff',
  MARKETING = 'marketing',
  STORE = 'store',
}

export interface ResearchNodeDef {
  id: string;
  name: string;
  description: string;
  category: ResearchCategory;
  cost: number;                    // research points to unlock
  prerequisites: string[];         // ids of required research nodes
  effects: ResearchEffects;
}

export interface ResearchEffects {
  unlockFlavors?: string[];        // flavor ids to unlock
  equipmentDiscount?: number;      // fractional discount on equipment purchases (0.1 = 10%)
  staffTrainingDiscount?: number;  // fractional discount on training costs
  staffMoraleBonus?: number;       // flat daily morale bonus for all staff
  campaignDiscount?: number;       // fractional discount on campaign costs
  campaignDurationBonus?: number;  // extra days added to campaigns
  patienceBonus?: number;          // flat bonus seconds to customer patience
  reputationGainMult?: number;     // multiplier on positive reputation changes (e.g. 1.1 = 10% more)
  qualityBonus?: number;           // bonus to customer satisfaction
}

export const RESEARCH_CATALOG: ResearchNodeDef[] = [
  // Flavors branch
  {
    id: 'flavor_basics',
    name: 'Flavor Experimentation',
    description: 'Learn to develop new flavors. Unlocks Mint Chip and Cookies & Cream.',
    category: ResearchCategory.FLAVORS,
    cost: 3,
    prerequisites: [],
    effects: { unlockFlavors: ['mint_chip', 'cookies_cream'] },
  },
  {
    id: 'flavor_fruity',
    name: 'Fruity Flavors',
    description: 'Master fruit-based flavors. Unlocks Mango, Raspberry, and Blueberry.',
    category: ResearchCategory.FLAVORS,
    cost: 5,
    prerequisites: ['flavor_basics'],
    effects: { unlockFlavors: ['mango', 'raspberry', 'blueberry'] },
  },
  {
    id: 'flavor_nutty',
    name: 'Nutty Creations',
    description: 'Explore nut-based flavors. Unlocks Pistachio, Butter Pecan, and Peanut Butter.',
    category: ResearchCategory.FLAVORS,
    cost: 5,
    prerequisites: ['flavor_basics'],
    effects: { unlockFlavors: ['pistachio', 'butter_pecan', 'peanut_butter'] },
  },
  {
    id: 'flavor_premium',
    name: 'Premium Flavors',
    description: 'Craft luxury flavors. Unlocks Salted Caramel, Lavender, and Matcha.',
    category: ResearchCategory.FLAVORS,
    cost: 8,
    prerequisites: ['flavor_fruity', 'flavor_nutty'],
    effects: { unlockFlavors: ['salted_caramel', 'lavender', 'matcha'] },
  },
  {
    id: 'flavor_specialty',
    name: 'Specialty Flavors',
    description: 'Create unique specialties. Unlocks Cookie Dough, Birthday Cake, and Coffee.',
    category: ResearchCategory.FLAVORS,
    cost: 6,
    prerequisites: ['flavor_basics'],
    effects: { unlockFlavors: ['cookie_dough', 'birthday_cake', 'coffee'] },
  },
  {
    id: 'flavor_exotic',
    name: 'Exotic Collection',
    description: 'The rarest flavors. Unlocks Rocky Road, Coconut, Lemon Sorbet, and Caramel Swirl.',
    category: ResearchCategory.FLAVORS,
    cost: 10,
    prerequisites: ['flavor_premium'],
    effects: { unlockFlavors: ['rocky_road', 'coconut', 'lemon_sorbet', 'caramel_swirl'] },
  },

  // Equipment branch
  {
    id: 'equip_maintenance',
    name: 'Preventive Maintenance',
    description: 'Better equipment care. 10% discount on equipment purchases.',
    category: ResearchCategory.EQUIPMENT,
    cost: 4,
    prerequisites: [],
    effects: { equipmentDiscount: 0.1 },
  },
  {
    id: 'equip_efficiency',
    name: 'Equipment Mastery',
    description: 'Advanced techniques. 20% equipment discount and quality bonus.',
    category: ResearchCategory.EQUIPMENT,
    cost: 7,
    prerequisites: ['equip_maintenance'],
    effects: { equipmentDiscount: 0.2, qualityBonus: 0.05 },
  },

  // Staff branch
  {
    id: 'staff_training',
    name: 'Training Program',
    description: 'Structured training reduces costs by 20%.',
    category: ResearchCategory.STAFF,
    cost: 4,
    prerequisites: [],
    effects: { staffTrainingDiscount: 0.2 },
  },
  {
    id: 'staff_morale',
    name: 'Employee Wellness',
    description: 'Wellness programs boost daily morale by +3.',
    category: ResearchCategory.STAFF,
    cost: 6,
    prerequisites: ['staff_training'],
    effects: { staffMoraleBonus: 3 },
  },
  {
    id: 'staff_mastery',
    name: 'Staff Mastery',
    description: 'Elite training: 40% training discount and +5 daily morale.',
    category: ResearchCategory.STAFF,
    cost: 9,
    prerequisites: ['staff_morale'],
    effects: { staffTrainingDiscount: 0.4, staffMoraleBonus: 5 },
  },

  // Marketing branch
  {
    id: 'marketing_savvy',
    name: 'Marketing Savvy',
    description: 'Smarter spending. 15% discount on campaigns.',
    category: ResearchCategory.MARKETING,
    cost: 3,
    prerequisites: [],
    effects: { campaignDiscount: 0.15 },
  },
  {
    id: 'marketing_reach',
    name: 'Extended Reach',
    description: 'Campaigns last 2 extra days.',
    category: ResearchCategory.MARKETING,
    cost: 5,
    prerequisites: ['marketing_savvy'],
    effects: { campaignDurationBonus: 2 },
  },
  {
    id: 'marketing_brand',
    name: 'Brand Building',
    description: 'Strong brand. 10% more reputation from positive days.',
    category: ResearchCategory.MARKETING,
    cost: 8,
    prerequisites: ['marketing_reach'],
    effects: { reputationGainMult: 1.1 },
  },

  // Store branch
  {
    id: 'store_comfort',
    name: 'Customer Comfort',
    description: 'Improve the waiting experience. +3s customer patience.',
    category: ResearchCategory.STORE,
    cost: 3,
    prerequisites: [],
    effects: { patienceBonus: 3000 },
  },
  {
    id: 'store_ambiance',
    name: 'Ambiance Expertise',
    description: 'Master the atmosphere. +5s patience and quality bonus.',
    category: ResearchCategory.STORE,
    cost: 7,
    prerequisites: ['store_comfort'],
    effects: { patienceBonus: 5000, qualityBonus: 0.05 },
  },
];

// Milestones that award research points
export interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  points: number;
  condition: (stats: MilestoneStats) => boolean;
}

export interface MilestoneStats {
  totalDays: number;
  totalCustomersServed: number;
  totalRevenue: number;
  reputation: number;
  equipmentOwned: number;
  staffCount: number;
  flavorsUnlocked: number;
}

export const MILESTONE_CATALOG: MilestoneDef[] = [
  { id: 'day_3', name: 'Getting Started', description: 'Survive 3 days', points: 1, condition: s => s.totalDays >= 3 },
  { id: 'day_7', name: 'First Week', description: 'Survive 7 days', points: 2, condition: s => s.totalDays >= 7 },
  { id: 'day_14', name: 'Two Weeks In', description: 'Survive 14 days', points: 3, condition: s => s.totalDays >= 14 },
  { id: 'day_30', name: 'Veteran', description: 'Survive 30 days', points: 4, condition: s => s.totalDays >= 30 },
  { id: 'serve_25', name: 'First Customers', description: 'Serve 25 customers total', points: 1, condition: s => s.totalCustomersServed >= 25 },
  { id: 'serve_100', name: 'Popular Spot', description: 'Serve 100 customers total', points: 2, condition: s => s.totalCustomersServed >= 100 },
  { id: 'serve_500', name: 'Customer Magnet', description: 'Serve 500 customers total', points: 4, condition: s => s.totalCustomersServed >= 500 },
  { id: 'revenue_500', name: 'First Profits', description: 'Earn $500 total revenue', points: 1, condition: s => s.totalRevenue >= 500 },
  { id: 'revenue_2000', name: 'Growing Business', description: 'Earn $2,000 total revenue', points: 3, condition: s => s.totalRevenue >= 2000 },
  { id: 'revenue_10000', name: 'Ice Cream Empire', description: 'Earn $10,000 total revenue', points: 5, condition: s => s.totalRevenue >= 10000 },
  { id: 'rep_3', name: 'Good Reviews', description: 'Reach 3-star reputation', points: 2, condition: s => s.reputation >= 3 },
  { id: 'rep_4', name: 'Acclaimed', description: 'Reach 4-star reputation', points: 3, condition: s => s.reputation >= 4 },
  { id: 'rep_5', name: 'Legendary', description: 'Reach 5-star reputation', points: 5, condition: s => s.reputation >= 5 },
  { id: 'staff_3', name: 'Team Builder', description: 'Hire 3 staff', points: 1, condition: s => s.staffCount >= 3 },
  { id: 'equip_4', name: 'Well Equipped', description: 'Own 4 pieces of equipment', points: 2, condition: s => s.equipmentOwned >= 4 },
  { id: 'flavors_8', name: 'Flavor Explorer', description: 'Unlock 8 flavors', points: 2, condition: s => s.flavorsUnlocked >= 8 },
  { id: 'flavors_15', name: 'Flavor Master', description: 'Unlock 15 flavors', points: 4, condition: s => s.flavorsUnlocked >= 15 },
];

export const SERVING_STYLE_CATALOG: ServingStyleDef[] = [
  { id: 'cone', name: 'Cone', priceMult: 1.0, ingredientMult: 1.0, maxScoops: 3 },
  { id: 'cup', name: 'Cup', priceMult: 1.0, ingredientMult: 1.0, maxScoops: 3 },
  { id: 'sundae', name: 'Sundae', priceMult: 1.4, ingredientMult: 1.2, maxScoops: 3 },
  { id: 'milkshake', name: 'Milkshake', priceMult: 1.6, ingredientMult: 1.5, maxScoops: 2, requiredEquipment: EquipmentId.BLENDER },
  { id: 'float', name: 'Float', priceMult: 1.5, ingredientMult: 1.3, maxScoops: 2, requiredEquipment: EquipmentId.BLENDER },
];

// Exterior Signage
export enum SignageId {
  NONE = 'none',
  CHALKBOARD = 'chalkboard',
  NEON = 'neon',
  LIGHT_BOX = 'light_box',
  DIGITAL = 'digital',
}

export interface SignageDef {
  id: SignageId;
  name: string;
  description: string;
  icon: string;
  cost: number;
  /** Multiplier on customer spawn rate (lower = more customers) */
  curbAppealMult: number;
  /** Flat reputation bonus per day from visibility */
  dailyRepBonus: number;
}

export const SIGNAGE_CATALOG: SignageDef[] = [
  {
    id: SignageId.NONE,
    name: 'No Sign',
    description: 'Customers have to find you on their own.',
    icon: '🚫',
    cost: 0,
    curbAppealMult: 1.0,
    dailyRepBonus: 0,
  },
  {
    id: SignageId.CHALKBOARD,
    name: 'Chalkboard Sign',
    description: 'A handwritten menu board on the sidewalk. Charming and affordable.',
    icon: '📋',
    cost: 100,
    curbAppealMult: 0.92,
    dailyRepBonus: 0.02,
  },
  {
    id: SignageId.NEON,
    name: 'Neon Sign',
    description: 'A glowing neon ice cream cone. Hard to miss!',
    icon: '💡',
    cost: 400,
    curbAppealMult: 0.85,
    dailyRepBonus: 0.04,
  },
  {
    id: SignageId.LIGHT_BOX,
    name: 'Illuminated Light Box',
    description: 'Professional backlit sign with your logo. Day or night visibility.',
    icon: '🔲',
    cost: 700,
    curbAppealMult: 0.80,
    dailyRepBonus: 0.06,
  },
  {
    id: SignageId.DIGITAL,
    name: 'Digital Display Board',
    description: 'LED screen showing today\'s specials and flavors. Maximum curb appeal!',
    icon: '📺',
    cost: 1200,
    curbAppealMult: 0.75,
    dailyRepBonus: 0.08,
  },
];
