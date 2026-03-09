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
