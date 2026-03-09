import {
  DayPhase,
  STARTING_MONEY,
  STARTING_REPUTATION,
  DEFAULT_DAY_DURATION_MS,
  STORE_OPEN_HOUR,
  HOURS_PER_DAY,
  SPEED_NORMAL,
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

export interface DayReport {
  day: number;
  revenue: number;
  expenses: number;
  customersServed: number;
  customersLost: number;
  satisfactionScore: number;
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
  unlockedEquipment: Set<string> = new Set(['basic_maker', 'basic_freezer', 'basic_pos']);

  constructor() {
    this.initializeStartingInventory();
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
    this.day++;
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
