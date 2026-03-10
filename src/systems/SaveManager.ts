import { GameState, Ingredient, Flavor, StaffMember, DayReport, OwnedEquipment, CriticReview, ActiveCampaign, LoyalCustomer, Recipe, LocationState, CateringContract } from './GameState';
import { WeatherType, HealthInspectionResult, DecorThemeId, SeatingId, SignageId } from '../config/constants';

const SAVE_KEY_PREFIX = 'icecream_save_';
const AUTO_SAVE_KEY = SAVE_KEY_PREFIX + 'auto';
const MAX_MANUAL_SLOTS = 3;

export interface SaveData {
  version: number;
  timestamp: number;
  gameMode: string;
  state: SerializedGameState;
}

interface SerializedGameState {
  day: number;
  season: number;
  money: number;
  loanBalance: number;
  reputation: number;
  reputationMomentum: number;
  criticReviews: CriticReview[];
  researchPoints: number;
  ingredients: Ingredient[];
  flavors: Flavor[];
  staff: StaffMember[];
  menuPrices: [string, number][];
  dayReports: DayReport[];
  unlockedFlavors: string[];
  equipment: OwnedEquipment[];
  activeCampaigns: ActiveCampaign[];
  weather: WeatherType;
  seasonDay: number;
  seasonRevenue: number;
  lastInspectionDay: number;
  closureDaysRemaining: number;
  inspectionHistory: HealthInspectionResult[];
  loanAmount: number;
  loanInterestRate: number;
  loanDaysRemaining: number;
  currentDecor: DecorThemeId;
  unlockedDecor: DecorThemeId[];
  currentSeating: SeatingId;
  unlockedSeating: SeatingId[];
  currentSignage: SignageId;
  unlockedSignage: SignageId[];
  unlockedResearch: string[];
  completedMilestones: string[];
  totalCustomersServed: number;
  totalRevenue: number;
  loyalCustomers: LoyalCustomer[];
  recipes: Recipe[];
  cateringContracts?: CateringContract[];

  // Multi-location franchise (v9+)
  franchiseMode?: boolean;
  currentLocationId?: number;
  locations?: SerializedLocationState[];
}

interface SerializedLocationState {
  id: number;
  name: string;
  money: number;
  dailyRevenue: number;
  dailyExpenses: number;
  reputation: number;
  reputationMomentum: number;
  criticReviews: CriticReview[];
  ingredients: Ingredient[];
  flavors: Flavor[];
  staff: StaffMember[];
  menuPrices: [string, number][];
  dayReports: DayReport[];
  equipment: OwnedEquipment[];
  activeCampaigns: ActiveCampaign[];
  currentDecor: string;
  unlockedDecor: string[];
  currentSeating: string;
  unlockedSeating: string[];
  currentSignage: string;
  unlockedSignage: string[];
  loanAmount: number;
  loanInterestRate: number;
  loanDaysRemaining: number;
  lastInspectionDay: number;
  closureDaysRemaining: number;
  inspectionHistory: HealthInspectionResult[];
  recipes: Recipe[];
  loyalCustomers: LoyalCustomer[];
  weather: WeatherType;
  cateringContracts?: CateringContract[];
}

const SAVE_VERSION = 10;

export class SaveManager {
  static save(gameState: GameState, slot: string = 'auto', gameMode: string = 'story'): boolean {
    try {
      const data: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        gameMode,
        state: {
          day: gameState.day,
          season: gameState.season,
          money: gameState.money,
          loanBalance: gameState.loanBalance,
          reputation: gameState.reputation,
          reputationMomentum: gameState.reputationMomentum,
          criticReviews: gameState.criticReviews,
          researchPoints: gameState.researchPoints,
          ingredients: gameState.ingredients,
          flavors: gameState.flavors,
          staff: gameState.staff,
          menuPrices: Array.from(gameState.menuPrices.entries()),
          dayReports: gameState.dayReports,
          unlockedFlavors: Array.from(gameState.unlockedFlavors),
          equipment: gameState.equipment,
          activeCampaigns: gameState.activeCampaigns,
          weather: gameState.weather,
          seasonDay: gameState.seasonDay,
          seasonRevenue: gameState.seasonRevenue,
          lastInspectionDay: gameState.lastInspectionDay,
          closureDaysRemaining: gameState.closureDaysRemaining,
          inspectionHistory: gameState.inspectionHistory,
          loanAmount: gameState.loanAmount,
          loanInterestRate: gameState.loanInterestRate,
          loanDaysRemaining: gameState.loanDaysRemaining,
          currentDecor: gameState.currentDecor,
          unlockedDecor: gameState.unlockedDecor,
          currentSeating: gameState.currentSeating,
          unlockedSeating: gameState.unlockedSeating,
          currentSignage: gameState.currentSignage,
          unlockedSignage: gameState.unlockedSignage,
          unlockedResearch: Array.from(gameState.unlockedResearch),
          completedMilestones: Array.from(gameState.completedMilestones),
          totalCustomersServed: gameState.totalCustomersServed,
          totalRevenue: gameState.totalRevenue,
          loyalCustomers: gameState.loyalCustomers,
          recipes: gameState.recipes,
          cateringContracts: gameState.cateringContracts,
          franchiseMode: gameState.franchiseMode,
          currentLocationId: gameState.currentLocationId,
          locations: gameState.franchiseMode
            ? gameState.locations.map(loc => ({
                id: loc.id,
                name: loc.name,
                money: loc.money,
                dailyRevenue: loc.dailyRevenue,
                dailyExpenses: loc.dailyExpenses,
                reputation: loc.reputation,
                reputationMomentum: loc.reputationMomentum,
                criticReviews: loc.criticReviews,
                ingredients: loc.ingredients,
                flavors: loc.flavors,
                staff: loc.staff,
                menuPrices: Array.from(loc.menuPrices.entries()),
                dayReports: loc.dayReports,
                equipment: loc.equipment,
                activeCampaigns: loc.activeCampaigns,
                currentDecor: loc.currentDecor,
                unlockedDecor: loc.unlockedDecor,
                currentSeating: loc.currentSeating,
                unlockedSeating: loc.unlockedSeating,
                currentSignage: loc.currentSignage,
                unlockedSignage: loc.unlockedSignage,
                loanAmount: loc.loanAmount,
                loanInterestRate: loc.loanInterestRate,
                loanDaysRemaining: loc.loanDaysRemaining,
                lastInspectionDay: loc.lastInspectionDay,
                closureDaysRemaining: loc.closureDaysRemaining,
                inspectionHistory: loc.inspectionHistory,
                recipes: loc.recipes,
                loyalCustomers: loc.loyalCustomers,
                weather: loc.weather,
                cateringContracts: loc.cateringContracts,
              }))
            : undefined,
        },
      };

      const key = slot === 'auto' ? AUTO_SAVE_KEY : SAVE_KEY_PREFIX + slot;
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      console.error('Failed to save game');
      return false;
    }
  }

  static load(gameState: GameState, slot: string = 'auto'): boolean {
    try {
      const key = slot === 'auto' ? AUTO_SAVE_KEY : SAVE_KEY_PREFIX + slot;
      const raw = localStorage.getItem(key);
      if (!raw) return false;

      const data: SaveData = JSON.parse(raw);
      if (data.version < 3 || data.version > SAVE_VERSION) return false;
      // Accept older save versions with defaults for missing fields

      const s = data.state;
      gameState.day = s.day;
      gameState.season = s.season;
      gameState.money = s.money;
      gameState.loanBalance = s.loanBalance;
      gameState.reputation = s.reputation;
      gameState.reputationMomentum = s.reputationMomentum ?? 0;
      gameState.criticReviews = s.criticReviews ?? [];
      gameState.researchPoints = s.researchPoints;
      gameState.ingredients = s.ingredients;
      gameState.flavors = s.flavors;
      gameState.staff = s.staff.map(member => ({
        ...member,
        shift: member.shift ?? (member.assigned ? 'full_day' : 'off'),
        consecutiveDaysWorked: member.consecutiveDaysWorked ?? 0,
        specialty: member.specialty ?? 'none',
      }));
      gameState.menuPrices = new Map(s.menuPrices);
      gameState.dayReports = s.dayReports;
      gameState.unlockedFlavors = new Set(s.unlockedFlavors);
      gameState.equipment = s.equipment ?? [];
      gameState.activeCampaigns = s.activeCampaigns ?? [];
      gameState.weather = s.weather ?? 'sunny';
      gameState.seasonDay = s.seasonDay ?? 1;
      gameState.seasonRevenue = s.seasonRevenue ?? 0;
      gameState.lastInspectionDay = s.lastInspectionDay ?? 0;
      gameState.closureDaysRemaining = s.closureDaysRemaining ?? 0;
      gameState.inspectionHistory = s.inspectionHistory ?? [];
      gameState.loanAmount = s.loanAmount ?? 0;
      gameState.loanInterestRate = s.loanInterestRate ?? 0;
      gameState.loanDaysRemaining = s.loanDaysRemaining ?? 0;
      gameState.currentDecor = s.currentDecor ?? 'basic';
      gameState.unlockedDecor = s.unlockedDecor ?? ['basic'];
      gameState.currentSeating = s.currentSeating ?? 'none';
      gameState.unlockedSeating = s.unlockedSeating ?? ['none'];
      gameState.currentSignage = s.currentSignage ?? 'none';
      gameState.unlockedSignage = s.unlockedSignage ?? ['none'];
      gameState.unlockedResearch = new Set(s.unlockedResearch ?? []);
      gameState.completedMilestones = new Set(s.completedMilestones ?? []);
      gameState.totalCustomersServed = s.totalCustomersServed ?? 0;
      gameState.totalRevenue = s.totalRevenue ?? 0;
      gameState.loyalCustomers = s.loyalCustomers ?? [];
      gameState.recipes = s.recipes ?? [];
      gameState.cateringContracts = s.cateringContracts ?? [];

      // Multi-location franchise (v9+)
      gameState.franchiseMode = s.franchiseMode ?? false;
      gameState.currentLocationId = s.currentLocationId ?? 0;
      if (s.locations && s.locations.length > 0) {
        gameState.locations = s.locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          money: loc.money,
          dailyRevenue: loc.dailyRevenue,
          dailyExpenses: loc.dailyExpenses,
          reputation: loc.reputation,
          reputationMomentum: loc.reputationMomentum,
          criticReviews: loc.criticReviews ?? [],
          ingredients: loc.ingredients,
          flavors: loc.flavors,
          staff: loc.staff.map(member => ({
            ...member,
            shift: member.shift ?? (member.assigned ? 'full_day' : 'off'),
            consecutiveDaysWorked: member.consecutiveDaysWorked ?? 0,
            specialty: member.specialty ?? 'none',
          })),
          menuPrices: new Map(loc.menuPrices),
          dayReports: loc.dayReports,
          equipment: loc.equipment ?? [],
          activeCampaigns: loc.activeCampaigns ?? [],
          currentDecor: loc.currentDecor as DecorThemeId,
          unlockedDecor: loc.unlockedDecor as DecorThemeId[],
          currentSeating: loc.currentSeating as SeatingId,
          unlockedSeating: loc.unlockedSeating as SeatingId[],
          currentSignage: loc.currentSignage as SignageId,
          unlockedSignage: loc.unlockedSignage as SignageId[],
          loanAmount: loc.loanAmount ?? 0,
          loanInterestRate: loc.loanInterestRate ?? 0,
          loanDaysRemaining: loc.loanDaysRemaining ?? 0,
          lastInspectionDay: loc.lastInspectionDay ?? 0,
          closureDaysRemaining: loc.closureDaysRemaining ?? 0,
          inspectionHistory: loc.inspectionHistory ?? [],
          recipes: loc.recipes ?? [],
          loyalCustomers: loc.loyalCustomers ?? [],
          weather: loc.weather ?? 'sunny' as WeatherType,
          cateringContracts: loc.cateringContracts ?? [],
        }));
      } else {
        gameState.locations = [];
      }

      return true;
    } catch {
      console.error('Failed to load game');
      return false;
    }
  }

  static listSaves(): { slot: string; data: SaveData | null }[] {
    const saves: { slot: string; data: SaveData | null }[] = [];

    // Auto save
    saves.push({ slot: 'auto', data: this.getSaveData('auto') });

    // Manual slots
    for (let i = 1; i <= MAX_MANUAL_SLOTS; i++) {
      saves.push({ slot: `${i}`, data: this.getSaveData(`${i}`) });
    }

    return saves;
  }

  static getSaveData(slot: string): SaveData | null {
    try {
      const key = slot === 'auto' ? AUTO_SAVE_KEY : SAVE_KEY_PREFIX + slot;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static deleteSave(slot: string): void {
    const key = slot === 'auto' ? AUTO_SAVE_KEY : SAVE_KEY_PREFIX + slot;
    localStorage.removeItem(key);
  }

  static hasSave(slot: string = 'auto'): boolean {
    return this.getSaveData(slot) !== null;
  }
}
