import { GameState } from './GameState';

export enum GameEventId {
  SUMMER_RUSH = 'summer_rush',
  HEAT_WAVE = 'heat_wave',
  POWER_OUTAGE = 'power_outage',
  COMPETITOR_OPENS = 'competitor_opens',
  TREND_ALERT = 'trend_alert',
  SUPPLY_SHORTAGE = 'supply_shortage',
  BULK_DISCOUNT = 'bulk_discount',
  CHARITY_DRIVE = 'charity_drive',
  LOCAL_FAIR = 'local_fair',
  // Season-specific events
  NEIGHBORHOOD_COOKOUT = 'neighborhood_cookout',
  BEACH_PARTY = 'beach_party',
  SUNBURN_SURGE = 'sunburn_surge',
  FOOD_COURT_RIVALRY = 'food_court_rivalry',
  LUNCH_RUSH = 'lunch_rush',
  VIP_GALA = 'vip_gala',
  RESORT_FESTIVAL = 'resort_festival',
  FRANCHISE_INSPECTION = 'franchise_inspection',
  GRAND_OPENING_BUZZ = 'grand_opening_buzz',
}

export interface GameEventDef {
  id: GameEventId;
  name: string;
  description: string;
  icon: string;
  /** Minimum day before this event can trigger */
  minDay: number;
  /** Base chance per day (0-1) */
  chance: number;
  /** Effects applied while event is active */
  effects: GameEventEffects;
  /** If set, event only triggers during these seasons (1-5). Omit for all seasons. */
  seasons?: number[];
}

export interface GameEventEffects {
  /** Multiplier on customer spawn rate (lower = more customers) */
  customerSpawnMult?: number;
  /** Multiplier on ingredient spoilage rate */
  spoilageMult?: number;
  /** Flat reputation change at end of day */
  reputationBonus?: number;
  /** Multiplier on all equipment breakdown chance */
  breakdownMult?: number;
  /** If true, all broken equipment stays broken (can't use equipment) */
  equipmentOffline?: boolean;
  /** Multiplier on ingredient purchase prices */
  ingredientPriceMult?: number;
  /** Specific flavor gets popularity boost */
  trendingFlavor?: string;
  /** Multiplier on revenue */
  revenueMult?: number;
}

export interface ActiveEvent {
  def: GameEventDef;
  /** Flavor selected for trend events */
  trendingFlavorId?: string;
}

const EVENT_CATALOG: GameEventDef[] = [
  // === Universal events (all seasons) ===
  {
    id: GameEventId.SUMMER_RUSH,
    name: 'Summer Rush',
    description: 'Perfect weather brings double the customers!',
    icon: '☀️',
    minDay: 3,
    chance: 0.12,
    effects: { customerSpawnMult: 0.5 }, // half spawn interval = double customers
  },
  {
    id: GameEventId.HEAT_WAVE,
    name: 'Heat Wave',
    description: 'Extreme heat — ingredients spoil faster, but more customers want ice cream!',
    icon: '🔥',
    minDay: 5,
    chance: 0.08,
    effects: { customerSpawnMult: 0.7, spoilageMult: 2.0 },
  },
  {
    id: GameEventId.POWER_OUTAGE,
    name: 'Power Outage',
    description: 'Power is out! Equipment is offline — serve only what you can by hand.',
    icon: '⚡',
    minDay: 7,
    chance: 0.05,
    effects: { equipmentOffline: true, customerSpawnMult: 1.5, breakdownMult: 2.0 },
  },
  {
    id: GameEventId.COMPETITOR_OPENS,
    name: 'Competitor Opens Nearby',
    description: 'A new ice cream shop opened down the street. Fewer customers today.',
    icon: '🏪',
    minDay: 5,
    chance: 0.08,
    effects: { customerSpawnMult: 1.8 },
  },
  {
    id: GameEventId.TREND_ALERT,
    name: 'Flavor Trend Alert',
    description: 'A flavor is going viral! Customers want it — stock up!',
    icon: '📱',
    minDay: 3,
    chance: 0.10,
    effects: { customerSpawnMult: 0.8, revenueMult: 1.15 },
  },
  {
    id: GameEventId.SUPPLY_SHORTAGE,
    name: 'Supply Shortage',
    description: 'Supplier problems — ingredient prices are up 50% today.',
    icon: '📦',
    minDay: 4,
    chance: 0.08,
    effects: { ingredientPriceMult: 1.5 },
  },
  {
    id: GameEventId.BULK_DISCOUNT,
    name: 'Bulk Discount Day',
    description: 'Your supplier is running a sale — ingredients are 30% off!',
    icon: '🏷️',
    minDay: 2,
    chance: 0.10,
    effects: { ingredientPriceMult: 0.7 },
  },
  {
    id: GameEventId.CHARITY_DRIVE,
    name: 'Charity Drive',
    description: 'Donate 10% of today\'s revenue for a reputation boost!',
    icon: '💝',
    minDay: 5,
    chance: 0.07,
    effects: { revenueMult: 0.9, reputationBonus: 0.3 },
  },
  {
    id: GameEventId.LOCAL_FAIR,
    name: 'Local Fair',
    description: 'A local fair is in town! Set up a pop-up booth for bonus revenue!',
    icon: '🎪',
    minDay: 5,
    chance: 0.08,
    effects: { reputationBonus: 0.15 }, // small rep boost just for the fair being in town
  },

  // === Season 1: Hometown Stand ===
  {
    id: GameEventId.NEIGHBORHOOD_COOKOUT,
    name: 'Neighborhood Cookout',
    description: 'The neighborhood is having a cookout! Everyone wants dessert.',
    icon: '🍔',
    minDay: 3,
    chance: 0.12,
    seasons: [1],
    effects: { customerSpawnMult: 0.6, revenueMult: 1.1 },
  },

  // === Season 2: Beach Town ===
  {
    id: GameEventId.BEACH_PARTY,
    name: 'Beach Party',
    description: 'A massive beach party brings waves of customers and generous tips!',
    icon: '🏖️',
    minDay: 3,
    chance: 0.10,
    seasons: [2],
    effects: { customerSpawnMult: 0.4, revenueMult: 1.2 },
  },
  {
    id: GameEventId.SUNBURN_SURGE,
    name: 'Sunburn Surge',
    description: 'Sunburned beachgoers flock to your shop for cooling treats!',
    icon: '🌞',
    minDay: 5,
    chance: 0.10,
    seasons: [2],
    effects: { customerSpawnMult: 0.6 },
  },

  // === Season 3: City Food Court ===
  {
    id: GameEventId.FOOD_COURT_RIVALRY,
    name: 'Food Court Rivalry',
    description: 'A rival shop is running aggressive promos. Fight back or lose customers!',
    icon: '🥊',
    minDay: 3,
    chance: 0.10,
    seasons: [3],
    effects: { customerSpawnMult: 1.6, reputationBonus: -0.1 },
  },
  {
    id: GameEventId.LUNCH_RUSH,
    name: 'Office Lunch Rush',
    description: 'Office workers flood the food court during lunch — huge demand!',
    icon: '🏢',
    minDay: 4,
    chance: 0.12,
    seasons: [3],
    effects: { customerSpawnMult: 0.4 },
  },

  // === Season 4: Tourist Resort ===
  {
    id: GameEventId.VIP_GALA,
    name: 'VIP Gala Night',
    description: 'A resort gala brings wealthy VIP customers with premium expectations.',
    icon: '🥂',
    minDay: 3,
    chance: 0.10,
    seasons: [4],
    effects: { customerSpawnMult: 0.7, revenueMult: 1.3 },
  },
  {
    id: GameEventId.RESORT_FESTIVAL,
    name: 'Resort Festival',
    description: 'The resort festival draws huge crowds — big reputation opportunity!',
    icon: '🎆',
    minDay: 5,
    chance: 0.08,
    seasons: [4],
    effects: { customerSpawnMult: 0.5, reputationBonus: 0.25 },
  },

  // === Season 5: Franchise Launch ===
  {
    id: GameEventId.FRANCHISE_INSPECTION,
    name: 'Franchise Inspection',
    description: 'Corporate is checking brand consistency. Maintain standards for a bonus!',
    icon: '📋',
    minDay: 5,
    chance: 0.10,
    seasons: [5],
    effects: { reputationBonus: 0.2 },
  },
  {
    id: GameEventId.GRAND_OPENING_BUZZ,
    name: 'Grand Opening Buzz',
    description: 'Word of your franchise is spreading! Extra customers across all locations.',
    icon: '🎉',
    minDay: 3,
    chance: 0.10,
    seasons: [5],
    effects: { customerSpawnMult: 0.5, reputationBonus: 0.15 },
  },
];

export class EventManager {
  private activeEvent: ActiveEvent | null = null;
  /** Callback to notify UI about new events */
  onEventTriggered?: (event: ActiveEvent) => void;

  /** Roll for a random event at the start of a new day */
  rollForEvent(gameState: GameState): ActiveEvent | null {
    this.activeEvent = null;

    const currentSeason = gameState.season;

    // Filter eligible events by day and season
    const eligible = EVENT_CATALOG.filter(e => {
      if (gameState.day < e.minDay) return false;
      if (e.seasons && !e.seasons.includes(currentSeason)) return false;
      return true;
    });
    if (eligible.length === 0) return null;

    // Roll for each event (only one can trigger per day)
    // Shuffle to avoid bias toward earlier entries
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    for (const eventDef of shuffled) {
      if (Math.random() < eventDef.chance) {
        const active: ActiveEvent = { def: eventDef };

        // For trend alert, pick a random available flavor
        if (eventDef.id === GameEventId.TREND_ALERT) {
          const flavors = gameState.flavors.filter(f => f.unlocked);
          if (flavors.length > 0) {
            active.trendingFlavorId = flavors[Math.floor(Math.random() * flavors.length)].id;
          }
        }

        this.activeEvent = active;
        this.onEventTriggered?.(active);
        return active;
      }
    }

    return null;
  }

  getActiveEvent(): ActiveEvent | null {
    return this.activeEvent;
  }

  getEffects(): GameEventEffects {
    return this.activeEvent?.def.effects ?? {};
  }

  /** Apply end-of-day event effects (reputation bonus, spoilage, etc.) */
  applyEndOfDayEffects(gameState: GameState): void {
    if (!this.activeEvent) return;

    const effects = this.activeEvent.def.effects;

    // Reputation bonus/penalty
    if (effects.reputationBonus) {
      gameState.loc.reputation = Math.max(0.5, Math.min(5,
        gameState.loc.reputation + effects.reputationBonus));
    }

    // Extra spoilage from heat wave
    if (effects.spoilageMult && effects.spoilageMult > 1) {
      for (const ing of gameState.loc.ingredients) {
        // Reduce expiry by extra amount (spoilageMult - 1 extra days)
        const extraSpoilage = Math.floor(effects.spoilageMult - 1);
        ing.expiresInDays = Math.max(0, ing.expiresInDays - extraSpoilage);
      }
    }

    // Increased equipment breakdown chance during event
    if (effects.breakdownMult && effects.breakdownMult > 1) {
      for (const owned of gameState.loc.equipment) {
        if (owned.tier === 0 || owned.broken) continue;
        // Extra breakdown chance proportional to the multiplier
        const extraChance = (effects.breakdownMult - 1) * 0.15;
        if (Math.random() < extraChance) {
          owned.broken = true;
        }
      }
    }
  }

  clearEvent(): void {
    this.activeEvent = null;
  }
}
