// Display
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Time system
export const DEFAULT_DAY_DURATION_MS = 10 * 60 * 1000; // 10 minutes real time per in-game day
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

// Starting resources
export const STARTING_MONEY = 500;
export const STARTING_REPUTATION = 2.5; // out of 5 stars

// Customer
export const BASE_PATIENCE_MS = 30000; // 30 seconds at 1x speed
export const MAX_QUEUE_LENGTH = 8;

// Pricing
export const BASE_SCOOP_PRICE = 3.00;
export const BASE_TOPPING_PRICE = 0.50;

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
}

export const SEASON_CATALOG: SeasonDef[] = [
  {
    season: 1,
    name: 'Humble Beginnings',
    setting: 'Hometown Stand',
    description: 'Start your ice cream journey at a small roadside stand. Learn the basics of running a shop.',
    daysPerSeason: 14,
    revenueTarget: 500,
    reputationTarget: 2.0,
    startingMoney: STARTING_MONEY,
  },
  {
    season: 2,
    name: 'Beach Town',
    setting: 'Small Beach Town',
    description: 'Move to a busy beach town. Higher customer volume but more competition.',
    daysPerSeason: 18,
    revenueTarget: 1500,
    reputationTarget: 2.5,
    startingMoney: 800,
    unlockFlavors: ['mint_chip', 'cookies_cream'],
  },
  {
    season: 3,
    name: 'City Food Court',
    setting: 'City Food Court',
    description: 'Take on the big city. Manage multiple stations and face fierce competition.',
    daysPerSeason: 21,
    revenueTarget: 3000,
    reputationTarget: 3.0,
    startingMoney: 1200,
    unlockFlavors: ['mango', 'pistachio'],
  },
  {
    season: 4,
    name: 'Resort Living',
    setting: 'Tourist Resort',
    description: 'Serve premium VIP clientele at a luxury resort. High expectations, high rewards.',
    daysPerSeason: 21,
    revenueTarget: 5000,
    reputationTarget: 3.5,
    startingMoney: 2000,
    unlockFlavors: ['salted_caramel', 'lavender'],
  },
  {
    season: 5,
    name: 'Franchise Launch',
    setting: 'Franchise HQ',
    description: 'The ultimate challenge: launch your franchise. Prove you can build a brand.',
    daysPerSeason: 28,
    revenueTarget: 10000,
    reputationTarget: 4.0,
    startingMoney: 3000,
    unlockFlavors: ['matcha', 'rocky_road'],
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
