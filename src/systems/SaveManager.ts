import { GameState, Ingredient, Flavor, StaffMember, DayReport, OwnedEquipment, CriticReview, ActiveCampaign } from './GameState';
import { WeatherType } from '../config/constants';

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
}

const SAVE_VERSION = 4;

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
      gameState.staff = s.staff;
      gameState.menuPrices = new Map(s.menuPrices);
      gameState.dayReports = s.dayReports;
      gameState.unlockedFlavors = new Set(s.unlockedFlavors);
      gameState.equipment = s.equipment ?? [];
      gameState.activeCampaigns = s.activeCampaigns ?? [];
      gameState.weather = s.weather ?? 'sunny';
      gameState.seasonDay = s.seasonDay ?? 1;
      gameState.seasonRevenue = s.seasonRevenue ?? 0;

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
