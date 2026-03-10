/**
 * TipManager — shows contextual gameplay tips at key moments.
 *
 * Each tip fires at most once per save. Seen-tip IDs are persisted in localStorage.
 */
import { GameState } from './GameState';

export interface GameplayTip {
  id: string;
  title: string;
  body: string;
  /** Return true when conditions are met for this tip to show. */
  condition: (gs: GameState) => boolean;
}

const STORAGE_KEY = 'icecream_tips_seen';

const TIPS: GameplayTip[] = [
  {
    id: 'low_reputation',
    title: 'Reputation Dropping!',
    body:
      'Your star rating is falling. Serve customers\n' +
      'quickly and avoid running out of ingredients\n' +
      'to recover. Check the Menu Editor for pricing.',
    condition: (gs) => gs.loc.reputation <= 2.5 && gs.day >= 3,
  },
  {
    id: 'hire_staff',
    title: 'Hire Some Help',
    body:
      'You can hire staff from the Pause menu (ESC)\n' +
      'to serve customers faster. Staff improve\n' +
      'speed, accuracy, and friendliness!',
    condition: (gs) => gs.loc.staff.length === 0 && gs.day >= 3,
  },
  {
    id: 'equipment_worn',
    title: 'Equipment Wearing Down',
    body:
      'Some equipment is below 50% condition.\n' +
      'Open Equipment from the Pause menu (ESC)\n' +
      'to repair it before it breaks down!',
    condition: (gs) =>
      gs.loc.equipment.some(
        (e) => e.condition !== undefined && e.condition < 50
      ),
  },
  {
    id: 'check_prices',
    title: 'Review Your Prices',
    body:
      'You haven\'t changed your menu prices yet.\n' +
      'Open Menu Editor (ESC) and use the "Suggest"\n' +
      'button to set competitive prices.',
    condition: (gs) => {
      // Trigger on day 2+ if no custom prices have been set
      return gs.day >= 2 && gs.loc.menuPrices.size === 0;
    },
  },
  {
    id: 'try_research',
    title: 'Unlock New Flavors',
    body:
      'You have Research Points available!\n' +
      'Open Research from the Pause menu (ESC)\n' +
      'to unlock new flavors and upgrades.',
    condition: (gs) => gs.researchPoints >= 2 && gs.day >= 4,
  },
  {
    id: 'try_marketing',
    title: 'Boost Your Business',
    body:
      'Marketing campaigns can bring in more\n' +
      'customers. Open Marketing from the Pause\n' +
      'menu (ESC) to launch a campaign.',
    condition: (gs) => gs.loc.money >= 200 && gs.day >= 5 && gs.loc.activeCampaigns.length === 0,
  },
];

export class TipManager {
  private seenTips: Set<string>;

  constructor() {
    this.seenTips = new Set<string>();
    this.loadSeen();
  }

  /**
   * Check conditions and return the first eligible tip, or null.
   * Call this at the start of each day (prepare phase).
   */
  checkTips(gs: GameState): GameplayTip | null {
    for (const tip of TIPS) {
      if (this.seenTips.has(tip.id)) continue;
      if (tip.condition(gs)) {
        this.markSeen(tip.id);
        return tip;
      }
    }
    return null;
  }

  private markSeen(id: string): void {
    this.seenTips.add(id);
    this.saveSeen();
  }

  private loadSeen(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((id: string) => this.seenTips.add(id));
        }
      }
    } catch {
      // localStorage may not be available
    }
  }

  private saveSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.seenTips]));
    } catch {
      // localStorage may not be available
    }
  }
}
