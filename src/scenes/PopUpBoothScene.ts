import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BASE_SCOOP_PRICE, BASE_PATIENCE_MS } from '../config/constants';
import { GameState, getGameState } from '../systems/GameState';
import { scaledFontSize } from '../systems/UIUtils';

interface BoothCustomer {
  container: Phaser.GameObjects.Container;
  flavorId: string;
  patience: number;
  maxPatience: number;
  price: number;
  served: boolean;
  left: boolean;
}

const BOOTH_DURATION_MS = 60000; // 60 seconds real time
const BOOTH_SPAWN_INTERVAL = 1800; // ms between spawns
const BOOTH_MAX_QUEUE = 5;
const BOOTH_QUEUE_X = 200;
const BOOTH_QUEUE_Y = 420;
const BOOTH_QUEUE_SPACING = 80;

export class PopUpBoothScene extends Phaser.Scene {
  private gameState!: GameState;
  private selectedFlavors: string[] = [];
  private phase: 'select' | 'serve' | 'results' = 'select';
  private timeRemaining: number = BOOTH_DURATION_MS;
  private queue: BoothCustomer[] = [];
  private spawnTimer: number = 0;
  private served: number = 0;
  private lost: number = 0;
  private totalRevenue: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private serveBtn!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PopUpBoothScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.selectedFlavors = [];
    this.phase = 'select';
    this.timeRemaining = BOOTH_DURATION_MS;
    this.queue = [];
    this.spawnTimer = 0;
    this.served = 0;
    this.lost = 0;
    this.totalRevenue = 0;

    this.showFlavorSelection();
  }

  private showFlavorSelection(): void {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1A5276, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Fair atmosphere - bunting/banner at top
    const banner = this.add.graphics();
    banner.fillStyle(0xE74C3C, 0.8);
    for (let i = 0; i < 20; i++) {
      const x = i * 70;
      const color = i % 2 === 0 ? 0xE74C3C : 0xF1C40F;
      banner.fillStyle(color, 0.8);
      banner.fillTriangle(x, 0, x + 35, 40, x + 70, 0);
    }

    this.add.text(GAME_WIDTH / 2, 60, '🎪 Pop-Up Booth Setup', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 28), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 100, 'Pick 3 flavors for your booth menu (60 second rush!)', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#BDC3C7',
    }).setOrigin(0.5);

    const unlocked = this.gameState.flavors.filter(f => f.unlocked);
    const perRow = 5;
    const startX = GAME_WIDTH / 2 - (perRow - 1) * 70;
    const startY = 160;

    const selectedDisplay = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'Selected: none', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
    }).setOrigin(0.5);

    const goBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Start Booth!', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
      backgroundColor: '#555', padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    const flavorBtns: Phaser.GameObjects.Text[] = [];

    unlocked.forEach((flavor, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = startX + col * 140;
      const y = startY + row * 60;

      const btn = this.add.text(x, y, `🍨 ${flavor.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#FFF',
        backgroundColor: '#2C3E50', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        const idx = this.selectedFlavors.indexOf(flavor.id);
        if (idx >= 0) {
          this.selectedFlavors.splice(idx, 1);
          btn.setStyle({ backgroundColor: '#2C3E50' });
        } else if (this.selectedFlavors.length < 3) {
          this.selectedFlavors.push(flavor.id);
          btn.setStyle({ backgroundColor: '#27AE60' });
        }

        const names = this.selectedFlavors.map(id => {
          const f = this.gameState.flavors.find(fl => fl.id === id);
          return f?.name ?? id;
        });
        selectedDisplay.setText(`Selected: ${names.length > 0 ? names.join(', ') : 'none'}`);

        if (this.selectedFlavors.length === 3) {
          goBtn.setStyle({ backgroundColor: '#27AE60' });
          goBtn.setInteractive({ useHandCursor: true });
        } else {
          goBtn.setStyle({ backgroundColor: '#555' });
          goBtn.disableInteractive();
        }
      });

      flavorBtns.push(btn);
    });

    // If less than 3 flavors unlocked, auto-select all and allow starting
    if (unlocked.length <= 3) {
      this.selectedFlavors = unlocked.map(f => f.id);
      flavorBtns.forEach(btn => btn.setStyle({ backgroundColor: '#27AE60' }));
      const names = this.selectedFlavors.map(id => {
        const f = this.gameState.flavors.find(fl => fl.id === id);
        return f?.name ?? id;
      });
      selectedDisplay.setText(`Selected: ${names.join(', ')}`);
      goBtn.setStyle({ backgroundColor: '#27AE60' });
      goBtn.setInteractive({ useHandCursor: true });
    }

    goBtn.on('pointerdown', () => {
      if (this.selectedFlavors.length < 1) return;
      this.children.removeAll(true);
      this.startBoothRush();
    });

    // Cancel button
    const cancelBtn = this.add.text(GAME_WIDTH - 20, 20, 'Cancel', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#E74C3C',
      backgroundColor: '#2C3E5088', padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    cancelBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('GameplayScene');
    });
  }

  private startBoothRush(): void {
    this.phase = 'serve';

    // Background - outdoor fair scene
    const bg = this.add.graphics();
    bg.fillStyle(0x87CEEB, 1); // sky
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fillStyle(0x27AE60, 1); // grass
    bg.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);

    // Booth counter
    const booth = this.add.graphics();
    booth.fillStyle(0xD35400, 1);
    booth.fillRect(GAME_WIDTH / 2 - 200, 280, 400, 60);
    booth.fillStyle(0xE67E22, 1);
    booth.fillRect(GAME_WIDTH / 2 - 210, 260, 420, 25);

    // Booth awning
    const awning = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const color = i % 2 === 0 ? 0xE74C3C : 0xFFFFFF;
      awning.fillStyle(color, 0.9);
      const x = GAME_WIDTH / 2 - 210 + i * 52.5;
      awning.fillTriangle(x, 200, x + 26, 260, x + 52.5, 200);
    }

    // Booth sign
    this.add.text(GAME_WIDTH / 2, 215, '🍦 ICE CREAM BOOTH 🍦', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF', fontStyle: 'bold',
      backgroundColor: '#E74C3C88', padding: { x: 12, y: 4 },
    }).setOrigin(0.5);

    // Show selected flavors on counter
    this.selectedFlavors.forEach((id, i) => {
      const flavor = this.gameState.flavors.find(f => f.id === id);
      const x = GAME_WIDTH / 2 - 100 + i * 100;
      this.add.text(x, 300, `🍨 ${flavor?.name ?? id}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#FFF',
      }).setOrigin(0.5);
    });

    // Timer
    this.timerText = this.add.text(GAME_WIDTH / 2, 30, '60s', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 36), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats
    this.statsText = this.add.text(20, 20, 'Served: 0 | Revenue: $0.00', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
      backgroundColor: '#00000066', padding: { x: 8, y: 4 },
    });

    // Queue area label
    this.add.text(GAME_WIDTH / 2, 380, '— Fair Customers —', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#666',
    }).setOrigin(0.5);

    // Serve button
    this.serveBtn = this.add.text(GAME_WIDTH / 2, 350, '🍦 Serve! [Enter]', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
      backgroundColor: '#3498DB', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.serveBtn.on('pointerdown', () => this.serveBoothCustomer());
    this.serveBtn.on('pointerover', () => this.serveBtn.setStyle({ backgroundColor: '#5DADE2' }));
    this.serveBtn.on('pointerout', () => this.serveBtn.setStyle({ backgroundColor: '#3498DB' }));

    this.input.keyboard!.on('keydown-ENTER', () => this.serveBoothCustomer());
    this.input.keyboard!.on('keydown-SPACE', () => this.serveBoothCustomer());
  }

  update(_time: number, delta: number): void {
    if (this.phase !== 'serve') return;

    this.timeRemaining -= delta;

    // Update timer display
    const secs = Math.max(0, Math.ceil(this.timeRemaining / 1000));
    this.timerText.setText(`${secs}s`);
    if (secs <= 10) {
      this.timerText.setColor('#E74C3C');
    }

    // Spawn customers
    this.spawnTimer += delta;
    if (this.spawnTimer >= BOOTH_SPAWN_INTERVAL && this.queue.length < BOOTH_MAX_QUEUE) {
      this.spawnTimer = 0;
      this.spawnBoothCustomer();
    }

    // Update customer patience
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const c = this.queue[i];
      if (c.served || c.left) continue;

      c.patience -= delta;
      this.updateBoothCustomerVisual(c);

      if (c.patience <= 0) {
        c.left = true;
        this.lost++;
        this.tweens.add({
          targets: c.container,
          x: c.container.x - 200,
          alpha: 0,
          duration: 500,
          onComplete: () => c.container.destroy(),
        });
        this.queue.splice(i, 1);
        this.repositionBoothQueue();
      }
    }

    // Time's up
    if (this.timeRemaining <= 0) {
      this.phase = 'results';
      this.showResults();
    }

    // Update stats
    this.statsText.setText(`Served: ${this.served} | Lost: ${this.lost} | Revenue: $${this.totalRevenue.toFixed(2)}`);
  }

  private spawnBoothCustomer(): void {
    const flavorId = this.selectedFlavors[Math.floor(Math.random() * this.selectedFlavors.length)];
    const flavor = this.gameState.flavors.find(f => f.id === flavorId);
    const price = this.gameState.menuPrices.get(flavorId) ?? BASE_SCOOP_PRICE;

    const slotIndex = this.queue.length;
    const x = BOOTH_QUEUE_X + slotIndex * BOOTH_QUEUE_SPACING;
    const y = BOOTH_QUEUE_Y;

    const container = this.add.container(GAME_WIDTH + 50, y);

    // Body
    const body = this.add.graphics();
    const colors = [0x4A90D9, 0x2ECC71, 0xF39C12, 0x9B59B6, 0xE74C3C];
    body.fillStyle(colors[Math.floor(Math.random() * colors.length)], 1);
    body.fillCircle(0, 0, 16);
    body.fillStyle(0xFFDBAC, 1);
    body.fillCircle(0, -10, 9);
    container.add(body);

    // Order bubble
    const bubble = this.add.graphics();
    bubble.fillStyle(0xFFFFFF, 0.9);
    bubble.fillRoundedRect(-28, -36, 56, 18, 6);
    container.add(bubble);

    const orderText = this.add.text(0, -29, flavor?.name.slice(0, 6) ?? '???', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 10), color: '#333',
    }).setOrigin(0.5);
    container.add(orderText);

    // Patience bar (drawn in update)
    const patienceBar = this.add.graphics();
    container.add(patienceBar);

    const customer: BoothCustomer = {
      container,
      flavorId,
      patience: BASE_PATIENCE_MS * 0.6, // shorter patience at booth
      maxPatience: BASE_PATIENCE_MS * 0.6,
      price: price * 1.2, // fair markup
      served: false,
      left: false,
    };

    // Entrance animation
    this.tweens.add({
      targets: container,
      x,
      duration: 400,
      ease: 'Power2',
    });

    this.queue.push(customer);
    this.updateBoothCustomerVisual(customer);
  }

  private updateBoothCustomerVisual(c: BoothCustomer): void {
    const barGfx = c.container.list[c.container.list.length - 1] as Phaser.GameObjects.Graphics;
    if (!barGfx || !(barGfx instanceof Phaser.GameObjects.Graphics)) return;

    barGfx.clear();
    const ratio = c.patience / c.maxPatience;
    const barW = 28;
    barGfx.fillStyle(0x333333, 0.5);
    barGfx.fillRect(-barW / 2, 20, barW, 4);
    const color = ratio > 0.5 ? 0x2ECC71 : ratio > 0.25 ? 0xF39C12 : 0xE74C3C;
    barGfx.fillStyle(color, 1);
    barGfx.fillRect(-barW / 2, 20, barW * ratio, 4);
  }

  private serveBoothCustomer(): void {
    if (this.phase !== 'serve' || this.queue.length === 0) return;

    const customer = this.queue[0];
    if (customer.served || customer.left) return;

    // Check ingredients
    const flavor = this.gameState.flavors.find(f => f.id === customer.flavorId);
    if (!flavor) return;

    let canServe = true;
    for (const ingId of flavor.ingredients) {
      const ing = this.gameState.ingredients.find(i => i.id === ingId);
      if (!ing || ing.quantity < 1) {
        canServe = false;
        break;
      }
    }

    if (!canServe) {
      // Flash red text
      const warn = this.add.text(GAME_WIDTH / 2, 300, 'Out of ingredients!', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#E74C3C', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: warn, alpha: 0, y: 280, duration: 800,
        onComplete: () => warn.destroy(),
      });
      return;
    }

    // Deduct ingredients
    for (const ingId of flavor.ingredients) {
      const ing = this.gameState.ingredients.find(i => i.id === ingId);
      if (ing) ing.quantity -= 1;
    }

    // Calculate revenue with patience bonus
    const patienceRatio = customer.patience / customer.maxPatience;
    const tip = customer.price * 0.15 * patienceRatio;
    const revenue = customer.price + tip;

    customer.served = true;
    this.served++;
    this.totalRevenue += revenue;

    // Happy animation
    this.tweens.add({
      targets: customer.container,
      y: customer.container.y - 25,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => customer.container.destroy(),
    });

    // Floating revenue
    const floatText = this.add.text(GAME_WIDTH / 2, 330, `+$${revenue.toFixed(2)}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#2ECC40', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: floatText, y: 280, alpha: 0, duration: 800,
      onComplete: () => floatText.destroy(),
    });

    this.queue.shift();
    this.repositionBoothQueue();
  }

  private repositionBoothQueue(): void {
    this.queue.forEach((c, i) => {
      const targetX = BOOTH_QUEUE_X + i * BOOTH_QUEUE_SPACING;
      this.tweens.add({
        targets: c.container,
        x: targetX,
        duration: 250,
        ease: 'Power1',
      });
    });
  }

  private showResults(): void {
    // Clean up remaining queue
    for (const c of this.queue) {
      c.container.destroy();
    }
    this.queue = [];

    // Darken screen
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panelW = 450;
    const panelH = 340;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 15);
    panel.lineStyle(3, 0xF1C40F);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 15);

    this.add.text(cx, cy - panelH / 2 + 25, '🎪 Booth Results!', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 26), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    let y = cy - panelH / 2 + 70;
    const leftX = cx - panelW / 2 + 40;

    const addLine = (text: string, color: string) => {
      this.add.text(leftX, y, text, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color,
      });
      y += 30;
    };

    addLine(`Customers Served: ${this.served}`, '#2ECC71');
    addLine(`Customers Lost: ${this.lost}`, this.lost > 0 ? '#E74C3C' : '#FFF');

    const satisfaction = this.served + this.lost > 0
      ? Math.round((this.served / (this.served + this.lost)) * 100)
      : 0;
    addLine(`Satisfaction: ${satisfaction}%`, satisfaction >= 70 ? '#2ECC71' : '#F39C12');

    y += 10;
    addLine(`Booth Revenue: $${this.totalRevenue.toFixed(2)}`, '#FFD700');

    // Bonus: good performance earns reputation
    const repBonus = this.served >= 10 ? 0.3 : this.served >= 5 ? 0.15 : 0;
    if (repBonus > 0) {
      addLine(`Reputation Bonus: +${repBonus.toFixed(2)} ★`, '#F1C40F');
    }

    // Apply rewards to game state
    this.gameState.loc.money += this.totalRevenue;
    this.gameState.loc.dailyRevenue += this.totalRevenue;
    this.gameState.totalCustomersServed += this.served;
    this.gameState.totalRevenue += this.totalRevenue;
    if (repBonus > 0) {
      this.gameState.loc.reputation = Math.min(5, this.gameState.loc.reputation + repBonus);
    }

    const closeBtn = this.add.text(cx, cy + panelH / 2 - 40, 'Back to Store', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
      backgroundColor: '#3498DB', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('GameplayScene');
    });
  }
}
