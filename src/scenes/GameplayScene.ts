import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DayPhase, STORE_CLOSE_HOUR, EQUIPMENT_CATALOG, CAMPAIGN_CATALOG, SEASON_CATALOG, HealthInspectionResult, WeatherType, LOW_STOCK_THRESHOLD, VIP_PERK_THRESHOLDS } from '../config/constants';
import { ChallengeDef } from './ChallengeScene';
import { GameState, getGameState, CriticReview, LocationState, DayReport } from '../systems/GameState';
import { CustomerManager } from '../systems/CustomerManager';
import { EventManager, ActiveEvent, GameEventId } from '../systems/EventManager';
import { SaveManager } from '../systems/SaveManager';
import { TipManager } from '../systems/TipManager';
import { uiColor, uiColorNum, scaledFontSize } from '../systems/UIUtils';
import { DAY_LENGTH_MS, DayLengthSetting } from './SettingsScene';
import { getAudioManager } from '../systems/AudioManager';

export class GameplayScene extends Phaser.Scene {
  private gameState!: GameState;
  private customerManager!: CustomerManager;
  private eventManager!: EventManager;
  private timeText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private reputationText!: Phaser.GameObjects.Text;
  private queueText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private stockWarningText!: Phaser.GameObjects.Text;
  private equipWarningText!: Phaser.GameObjects.Text;
  private serveButton!: Phaser.GameObjects.Text;
  private eventText!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;
  private dailyRevText!: Phaser.GameObjects.Text;
  private emergencyResupplyBtn!: Phaser.GameObjects.Text;
  private challengeDef: ChallengeDef | null = null;
  private tipManager!: TipManager;
  private sidePanelLeft!: Phaser.GameObjects.Container;
  private sidePanelRight!: Phaser.GameObjects.Container;
  private sidePanelLeftOpen: boolean = false;
  private sidePanelRightOpen: boolean = false;
  private sidePanelUpdateTimer: number = 0;

  constructor() {
    super({ key: 'GameplayScene' });
  }

  create(): void {
    this.gameState = getGameState(this);
    this.customerManager = new CustomerManager(this, this.gameState);
    this.eventManager = new EventManager();
    this.tipManager = new TipManager();

    // Stop ambient audio when this scene shuts down
    this.events.on('shutdown', () => getAudioManager(this).stopAmbience());

    // Apply day length setting
    const settings = this.registry.get('gameSettings') as { dayLength?: string } | undefined;
    if (settings?.dayLength && DAY_LENGTH_MS[settings.dayLength as DayLengthSetting]) {
      this.gameState.dayDurationMs = DAY_LENGTH_MS[settings.dayLength as DayLengthSetting];
    }

    const isLoadingSave = this.registry.get('loadSave') as boolean;
    const gameMode = this.registry.get('gameMode') as string ?? 'story';

    // Sandbox mode: unlimited funds
    if (!isLoadingSave && gameMode === 'sandbox') {
      this.gameState.loc.money = 99999;
    }

    if (!isLoadingSave) {
      this.gameState.startNewDay();
    }
    this.challengeDef = gameMode === 'challenge'
      ? (this.registry.get('challengeDef') as ChallengeDef | null) ?? null
      : null;

    // Apply challenge weather constraint
    if (this.challengeDef?.constraints.forcedWeather) {
      const weatherMap: Record<string, WeatherType> = {
        sunny: WeatherType.SUNNY, cloudy: WeatherType.CLOUDY,
        rainy: WeatherType.RAINY, hot: WeatherType.HOT, stormy: WeatherType.STORMY,
      };
      const wt = weatherMap[this.challengeDef.constraints.forcedWeather];
      if (wt !== undefined) this.gameState.loc.weather = wt;
    }

    // Apply challenge patience constraint via customer manager
    if (this.challengeDef?.constraints.patienceMultiplier) {
      this.registry.set('challengePatienceMult', this.challengeDef.constraints.patienceMultiplier);
    } else {
      this.registry.set('challengePatienceMult', 1.0);
    }

    // Apply forced customer type constraint (e.g. VIP Reception challenge)
    if (this.challengeDef?.constraints.forcedCustomerType) {
      this.registry.set('forcedCustomerType', this.challengeDef.constraints.forcedCustomerType);
    } else {
      this.registry.set('forcedCustomerType', '');
    }

    this.createStoreView();
    this.createHUD();
    this.createPhaseUI();
    this.createSidePanels();

    // Show notification when a critic leaves a review
    this.customerManager.onCriticReview = (review: CriticReview) => {
      this.showCriticReviewNotification(review);
    };

    // Show notification when a daily event triggers
    this.eventManager.onEventTriggered = (event: ActiveEvent) => {
      this.showEventNotification(event);
    };

    // Roll for today's event
    this.rollDailyEvent();

    // Check for health inspection (sandbox mode has no failure state)
    if (gameMode !== 'sandbox' && this.gameState.shouldTriggerInspection()) {
      const result = this.gameState.runHealthInspection();
      this.showInspectionNotification(result);
    }

    // If store is closed due to failed inspection, show closure notice
    if (gameMode !== 'sandbox' && this.gameState.loc.closureDaysRemaining > 0) {
      this.showClosureNotice();
    }

    // Launch tutorial for new players on Day 1
    // Note: startNewDay() already incremented day from 1 to 2, so check day === 2
    if (!isLoadingSave && this.gameState.day === 2 && gameMode === 'story') {
      const tutorialSeen = this.registry.get('tutorialSeen') as boolean;
      let seenInStorage = false;
      try {
        seenInStorage = localStorage.getItem('icecream_tutorial_seen') === 'true';
      } catch {
        // localStorage may not be available
      }
      if (!tutorialSeen && !seenInStorage) {
        this.scene.launch('TutorialScene');
        this.scene.pause();
      }
    }

    // Show contextual gameplay tips (skips first day to let tutorial play)
    if (this.gameState.day > 2) {
      this.checkGameplayTips();
    }

    // Keyboard shortcuts
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.launch('PauseScene');
      this.scene.pause();
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.toggleSpeed();
    });

    // Serve customer with Enter or click
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.serveNextCustomer();
    });
  }

  update(_time: number, delta: number): void {
    if (this.gameState.phase === DayPhase.SERVE) {
      this.gameState.advanceTime(delta);
      this.customerManager.update(delta);

      // Check if store should close
      if (this.gameState.currentHour >= STORE_CLOSE_HOUR) {
        this.gameState.phase = DayPhase.CLOSE;
        this.onDayEnd();
      }
    }

    this.updateHUD();
    this.updateSidePanels();
  }

  private serveNextCustomer(): void {
    if (this.gameState.phase !== DayPhase.SERVE) return;

    const result = this.customerManager.serveFirstCustomer();
    if (result !== null) {
      this.gameState.loc.dailyRevenue += result.revenue;
      this.gameState.loc.money += result.revenue;

      // SFX
      const audio = getAudioManager(this);
      if (result.orderError || result.dietaryViolation) {
        audio.error();
      } else {
        audio.serve();
      }

      // Show floating revenue text
      const revenueColor = (result.dietaryViolation || result.orderError) ? '#E67E22' : uiColor(this, 'green');
      const floatText = this.add.text(GAME_WIDTH / 2, 340, `+$${result.revenue.toFixed(2)}`, {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 22),
        color: revenueColor,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: floatText,
        y: 280,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => floatText.destroy(),
      });

      // Show dietary violation warning
      if (result.dietaryViolation) {
        const warningText = this.add.text(
          GAME_WIDTH / 2, 370,
          `⚠ ${result.violationType} violation — no tip!`,
          {
            fontFamily: 'Arial',
            fontSize: scaledFontSize(this, 16),
            color: uiColor(this, 'red'),
            fontStyle: 'bold',
          }
        ).setOrigin(0.5);

        this.tweens.add({
          targets: warningText,
          y: 310,
          alpha: 0,
          duration: 1500,
          ease: 'Power2',
          onComplete: () => warningText.destroy(),
        });
      }

      // Show order error warning
      if (result.orderError) {
        const revenueColor2 = '#E67E22';
        const errorText = this.add.text(
          GAME_WIDTH / 2, 370,
          'Wrong order! Customer unhappy (-40% revenue)',
          {
            fontFamily: 'Arial',
            fontSize: scaledFontSize(this, 14),
            color: revenueColor2,
            fontStyle: 'bold',
          }
        ).setOrigin(0.5);

        this.tweens.add({
          targets: errorText,
          y: 310,
          alpha: 0,
          duration: 1500,
          ease: 'Power2',
          onComplete: () => errorText.destroy(),
        });
      }

      // Show loyalty discount indicator
      if (result.loyaltyDiscount) {
        const loyalText = this.add.text(
          GAME_WIDTH / 2, 365,
          '🎁 Loyalty discount applied!',
          {
            fontFamily: 'Arial',
            fontSize: scaledFontSize(this, 14),
            color: uiColor(this, 'yellow'),
            fontStyle: 'bold',
          }
        ).setOrigin(0.5);

        this.tweens.add({
          targets: loyalText,
          y: 315,
          alpha: 0,
          duration: 1500,
          ease: 'Power2',
          onComplete: () => loyalText.destroy(),
        });
      }

      // Show VIP perk unlock notification
      if (result.vipSatisfied) {
        const vipCount = this.gameState.loc.vipSatisfied;
        let perkMsg = '';
        if (vipCount === VIP_PERK_THRESHOLDS.PREMIUM_PRICING) {
          perkMsg = 'VIP Perk unlocked: Premium Pricing (+10% revenue)';
        } else if (vipCount === VIP_PERK_THRESHOLDS.WORD_OF_MOUTH) {
          perkMsg = 'VIP Perk unlocked: Word of Mouth (+0.1 rep/day)';
        } else if (vipCount === VIP_PERK_THRESHOLDS.ELITE_CLIENTELE) {
          perkMsg = 'VIP Perk unlocked: Elite Clientele (2x VIP visits)';
        }
        if (perkMsg) {
          getAudioManager(this).success();
          const perkText = this.add.text(
            GAME_WIDTH / 2, 340,
            perkMsg,
            {
              fontFamily: 'Arial',
              fontSize: scaledFontSize(this, 15),
              color: '#FFD700',
              fontStyle: 'bold',
            }
          ).setOrigin(0.5);

          this.tweens.add({
            targets: perkText,
            y: 290,
            alpha: 0,
            duration: 2500,
            ease: 'Power2',
            onComplete: () => perkText.destroy(),
          });
        }
      }
    }
  }

  private createStoreView(): void {
    // Store floor background (color from decor theme)
    const decorDef = this.gameState.getDecorDef();
    const floor = this.add.graphics();
    floor.fillStyle(decorDef.floorColor, 1);
    floor.fillRect(0, 60, GAME_WIDTH, GAME_HEIGHT - 60);

    // Counter
    this.add.image(GAME_WIDTH / 2, 300, 'counter').setScale(3, 1.5);

    // Display case area (accent from decor theme)
    const displayCase = this.add.graphics();
    displayCase.fillStyle(decorDef.accentColor, 0.3);
    displayCase.fillRoundedRect(GAME_WIDTH / 2 - 250, 260, 500, 40, 5);
    displayCase.lineStyle(2, decorDef.accentColor);
    displayCase.strokeRoundedRect(GAME_WIDTH / 2 - 250, 260, 500, 40, 5);

    // Place flavor scoops in display
    const flavors = this.gameState.loc.flavors.filter(f => f.unlocked);
    const spacing = 500 / (flavors.length + 1);
    flavors.forEach((flavor, i) => {
      const x = (GAME_WIDTH / 2 - 250) + spacing * (i + 1);
      const textureKey = `scoop_${flavor.id}`;
      if (this.textures.exists(textureKey)) {
        this.add.image(x, 280, textureKey).setScale(1.2);
      }
      this.add.text(x, 305, flavor.name, {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 11),
        color: '#555',
      }).setOrigin(0.5, 0);
    });

    // Queue area label
    this.add.text(GAME_WIDTH / 2, 440, '— Customer Queue —', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 16),
      color: '#999',
    }).setOrigin(0.5);

    // Serve button
    this.serveButton = this.add.text(GAME_WIDTH / 2, 360, '🍦 Serve Next [Enter]', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 20),
      color: '#FFF',
      backgroundColor: '#3498DB',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.serveButton.on('pointerdown', () => this.serveNextCustomer());
    this.serveButton.on('pointerover', () => this.serveButton.setStyle({ backgroundColor: '#5DADE2' }));
    this.serveButton.on('pointerout', () => this.serveButton.setStyle({ backgroundColor: '#3498DB' }));
  }

  private createHUD(): void {
    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x2C3E50, 0.9);
    topBar.fillRect(0, 0, GAME_WIDTH, 56);

    this.dayText = this.add.text(12, 8, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
    });

    this.timeText = this.add.text(12, 30, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFD700',
    });

    this.weatherText = this.add.text(160, 8, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#FFF',
    });

    this.phaseText = this.add.text(160, 30, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#7FDBFF',
    });

    this.speedText = this.add.text(280, 30, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#95A5A6',
    });

    this.queueText = this.add.text(GAME_WIDTH / 2, 14, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#FFF',
    }).setOrigin(0.5, 0);

    this.moneyText = this.add.text(GAME_WIDTH - 20, 8, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: uiColor(this, 'green'),
    }).setOrigin(1, 0);

    this.dailyRevText = this.add.text(GAME_WIDTH - 20, 30, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#95A5A6',
    }).setOrigin(1, 0);

    this.reputationText = this.add.text(GAME_WIDTH - 20, 46, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: uiColor(this, 'yellow'),
    }).setOrigin(1, 0);

    // Active event indicator (below top bar, center)
    this.eventText = this.add.text(GAME_WIDTH / 2, 38, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: uiColor(this, 'yellow'),
    }).setOrigin(0.5, 0).setVisible(false);

    // Equipment warnings (bottom-right)
    this.equipWarningText = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: uiColor(this, 'yellow'),
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
      lineSpacing: 2,
    }).setOrigin(1, 1).setVisible(false);

    // Low stock warnings (bottom-left during serve phase)
    this.stockWarningText = this.add.text(10, GAME_HEIGHT - 10, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: uiColor(this, 'red'),
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
      lineSpacing: 2,
    }).setOrigin(0, 1).setVisible(false);

    // Emergency resupply button (shown during serve phase when out of stock)
    this.emergencyResupplyBtn = this.add.text(10, GAME_HEIGHT - 50, '🚚 Emergency Resupply (1.5x cost)', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
      backgroundColor: '#C0392B',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true }).setVisible(false);

    this.emergencyResupplyBtn.on('pointerdown', () => {
      this.registry.set('emergencyResupply', true);
      this.registry.set('shopJustOpened', true);
      this.scene.launch('ShopScene');
      this.scene.pause();
    });
    this.emergencyResupplyBtn.on('pointerover', () => this.emergencyResupplyBtn.setStyle({ backgroundColor: '#E74C3C' }));
    this.emergencyResupplyBtn.on('pointerout', () => this.emergencyResupplyBtn.setStyle({ backgroundColor: '#C0392B' }));
  }

  private createSidePanels(): void {
    const panelW = 180;
    const panelH = 320;
    const topY = 64;

    // Left panel: Inventory
    this.sidePanelLeft = this.add.container(-panelW, topY).setDepth(50);
    const leftBg = this.add.graphics();
    leftBg.fillStyle(0x1A252F, 0.92);
    leftBg.fillRoundedRect(0, 0, panelW, panelH, { tl: 0, tr: 10, br: 10, bl: 0 });
    this.sidePanelLeft.add(leftBg);

    // Left tab (toggle button)
    const leftTab = this.add.text(panelW, 0, '📦', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16),
      backgroundColor: '#1A252FE8', padding: { x: 10, y: 10 },
    }).setInteractive({ useHandCursor: true });
    this.sidePanelLeft.add(leftTab);
    leftTab.on('pointerdown', () => {
      this.sidePanelLeftOpen = !this.sidePanelLeftOpen;
      this.tweens.add({
        targets: this.sidePanelLeft,
        x: this.sidePanelLeftOpen ? 0 : -panelW,
        duration: 200, ease: 'Power2',
      });
    });

    // Right panel: Orders & Staff
    this.sidePanelRight = this.add.container(GAME_WIDTH, topY).setDepth(50);
    const rightBg = this.add.graphics();
    rightBg.fillStyle(0x1A252F, 0.92);
    rightBg.fillRoundedRect(0, 0, panelW, panelH, { tl: 10, tr: 0, br: 0, bl: 10 });
    this.sidePanelRight.add(rightBg);

    // Right tab (toggle button)
    const rightTab = this.add.text(-28, 0, '👥', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16),
      backgroundColor: '#1A252FE8', padding: { x: 10, y: 10 },
    }).setInteractive({ useHandCursor: true });
    this.sidePanelRight.add(rightTab);
    rightTab.on('pointerdown', () => {
      this.sidePanelRightOpen = !this.sidePanelRightOpen;
      this.tweens.add({
        targets: this.sidePanelRight,
        x: this.sidePanelRightOpen ? GAME_WIDTH - panelW : GAME_WIDTH,
        duration: 200, ease: 'Power2',
      });
    });
  }

  private updateSidePanels(): void {
    const s = this.gameState;
    const isServe = s.phase === DayPhase.SERVE;

    // Only show side panels during serve phase
    this.sidePanelLeft.setVisible(isServe);
    this.sidePanelRight.setVisible(isServe);
    if (!isServe) return;

    // Throttle updates to every 500ms to avoid excessive object creation
    this.sidePanelUpdateTimer -= this.game.loop.delta;
    if (this.sidePanelUpdateTimer > 0) return;
    this.sidePanelUpdateTimer = 500;

    // Remove previous dynamic content (keep bg at index 0 and tab at index 1)
    while (this.sidePanelLeft.length > 2) {
      this.sidePanelLeft.removeAt(2, true);
    }
    while (this.sidePanelRight.length > 2) {
      this.sidePanelRight.removeAt(2, true);
    }

    // -- Left: Inventory --
    let ly = 8;
    const invTitle = this.add.text(10, ly, 'Inventory', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#FFD700', fontStyle: 'bold',
    });
    this.sidePanelLeft.add(invTitle);
    ly += 20;

    for (const ing of s.loc.ingredients) {
      if (ing.quantity <= 0 && !s.flavors.some(f => f.unlocked && f.ingredients.includes(ing.id))) continue;
      const color = ing.quantity === 0 ? '#E74C3C' : ing.quantity <= LOW_STOCK_THRESHOLD ? '#F39C12' : '#BDC3C7';
      const ingText = this.add.text(10, ly, `${ing.name}: ${ing.quantity}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color,
      });
      this.sidePanelLeft.add(ingText);
      ly += 15;
      if (ly > 300) break;
    }

    // -- Right: Queue & Staff --
    let ry = 8;
    const qTitle = this.add.text(10, ry, 'Queue', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#FFD700', fontStyle: 'bold',
    });
    this.sidePanelRight.add(qTitle);
    ry += 20;

    const queue = this.customerManager.getQueue();
    if (queue.length === 0) {
      const noQ = this.add.text(10, ry, 'No customers', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#7F8C8D',
      });
      this.sidePanelRight.add(noQ);
      ry += 15;
    } else {
      const typeIcons: Record<string, string> = {
        regular: '', tourist: '📷', child: '🧒', critic: '📝', vip: '⭐',
      };
      for (let i = 0; i < Math.min(queue.length, 8); i++) {
        const c = queue[i];
        const pct = Math.round((c.patience / c.maxPatience) * 100);
        const pColor = pct > 50 ? '#2ECC71' : pct > 25 ? '#F39C12' : '#E74C3C';
        const icon = typeIcons[c.type] ?? '';
        const items = c.order.items.map(it => it.flavorId.slice(0, 6)).join('+');
        const line = this.add.text(10, ry, `${icon}${items} ${pct}%`, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 10), color: pColor,
        });
        this.sidePanelRight.add(line);
        ry += 14;
      }
      if (queue.length > 8) {
        const more = this.add.text(10, ry, `+${queue.length - 8} more...`, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 10), color: '#7F8C8D',
        });
        this.sidePanelRight.add(more);
        ry += 14;
      }
    }

    // Staff section
    ry += 8;
    const staffTitle = this.add.text(10, ry, 'Staff', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#FFD700', fontStyle: 'bold',
    });
    this.sidePanelRight.add(staffTitle);
    ry += 20;

    const activeStaff = s.getActiveStaff();
    if (activeStaff.length === 0) {
      const noStaff = this.add.text(10, ry, 'No active staff', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#7F8C8D',
      });
      this.sidePanelRight.add(noStaff);
    } else {
      for (const staff of activeStaff) {
        if (ry > 300) break;
        const moraleColor = staff.morale > 60 ? '#2ECC71' : staff.morale > 30 ? '#F39C12' : '#E74C3C';
        const specLabel = staff.specialty !== 'none' ? ` [${staff.specialty.slice(0, 4)}]` : '';
        const staffLine = this.add.text(10, ry, `${staff.name}${specLabel}`, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 10), color: moraleColor,
        });
        this.sidePanelRight.add(staffLine);
        ry += 14;
      }
    }
  }

  private createPhaseUI(): void {
    this.updatePhaseUI();
  }

  private updatePhaseUI(): void {
    const { phase } = this.gameState;

    this.children.getByName('phaseUI')?.destroy();

    if (phase === DayPhase.PREPARE) {
      this.serveButton.setVisible(false);
      this.customerManager.resetDayStats();
      this.customerManager.clearQueue();
      getAudioManager(this).startAmbience('prep');

      const prepContainer = this.add.container(0, 0).setName('phaseUI');

      const equipBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 180, '🔧 Equipment', {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 22),
        color: '#FFF',
        backgroundColor: '#2980B9',
        padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      equipBtn.on('pointerdown', () => {
        this.scene.launch('EquipmentScene');
        this.scene.pause();
      });
      prepContainer.add(equipBtn);

      const shopBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, '🛒 Buy Ingredients', {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 22),
        color: '#FFF',
        backgroundColor: '#8E44AD',
        padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      shopBtn.on('pointerdown', () => {
        this.registry.set('shopJustOpened', true);
        this.scene.launch('ShopScene');
        this.scene.pause();
      });
      prepContainer.add(shopBtn);

      const isClosed = this.gameState.loc.closureDaysRemaining > 0;

      if (isClosed) {
        // Store is closed — show skip day button instead
        const skipBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '⏭ Skip Day (Store Closed)', {
          fontFamily: 'Arial',
          fontSize: scaledFontSize(this, 22),
          color: '#FFF',
          backgroundColor: '#7F8C8D',
          padding: { x: 24, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipBtn.on('pointerdown', () => {
          prepContainer.destroy();
          // Skip directly to end of day with no customers
          this.gameState.phase = DayPhase.CLOSE;
          this.onDayEnd();
        });
        prepContainer.add(skipBtn);
      } else {
        const openBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🔔 Open Store', {
          fontFamily: 'Arial',
          fontSize: scaledFontSize(this, 24),
          color: '#FFF',
          backgroundColor: '#27AE60',
          padding: { x: 24, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        openBtn.on('pointerdown', () => {
          const audio = getAudioManager(this);
          audio.dayStart();
          audio.startAmbience('serve');
          this.gameState.phase = DayPhase.SERVE;
          this.serveButton.setVisible(true);
          prepContainer.destroy();
        });
        prepContainer.add(openBtn);

        // Pop-up booth button when Local Fair event is active
        const activeEvt = this.eventManager.getActiveEvent();
        if (activeEvt && activeEvt.def.id === GameEventId.LOCAL_FAIR) {
          const boothBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 240, '🎪 Set Up Pop-Up Booth', {
            fontFamily: 'Arial',
            fontSize: scaledFontSize(this, 20),
            color: '#FFF',
            backgroundColor: '#D35400',
            padding: { x: 18, y: 8 },
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });

          boothBtn.on('pointerdown', () => {
            this.scene.launch('PopUpBoothScene');
            this.scene.pause();
          });
          boothBtn.on('pointerover', () => boothBtn.setStyle({ backgroundColor: '#E67E22' }));
          boothBtn.on('pointerout', () => boothBtn.setStyle({ backgroundColor: '#D35400' }));
          prepContainer.add(boothBtn);
        }

        // Charity Drive button when event is active
        if (activeEvt && activeEvt.def.id === GameEventId.CHARITY_DRIVE) {
          const charityBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 240, '💝 Charity Drive', {
            fontFamily: 'Arial',
            fontSize: scaledFontSize(this, 20),
            color: '#FFF',
            backgroundColor: '#C0392B',
            padding: { x: 18, y: 8 },
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });

          charityBtn.on('pointerdown', () => {
            this.scene.launch('CharityDriveScene');
            this.scene.pause();
          });
          charityBtn.on('pointerover', () => charityBtn.setStyle({ backgroundColor: '#E74C3C' }));
          charityBtn.on('pointerout', () => charityBtn.setStyle({ backgroundColor: '#C0392B' }));
          prepContainer.add(charityBtn);
        }
      }

      // Show inventory summary during prepare
      const invSummary = this.gameState.loc.ingredients
        .map(i => `${i.name}: ${i.quantity} (${i.expiresInDays}d)`)
        .join('\n');

      const invText = this.add.text(GAME_WIDTH - 20, 70, 'Inventory:\n' + invSummary, {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 13),
        color: '#333',
        backgroundColor: '#FFFFFFCC',
        padding: { x: 10, y: 8 },
        lineSpacing: 3,
      }).setOrigin(1, 0);
      prepContainer.add(invText);

      // Catering contract offers
      const contracts = this.gameState.loc.cateringContracts;
      if (contracts.length > 0) {
        let cateringY = 70;
        for (const contract of contracts) {
          const flavorName = this.gameState.loc.flavors.find(f => f.id === contract.flavorId)?.name ?? contract.flavorId;
          const offerBg = this.add.graphics();
          offerBg.fillStyle(0x1A5276, 0.9);
          offerBg.fillRoundedRect(15, cateringY, 280, 60, 8);
          prepContainer.add(offerBg);

          const offerText = this.add.text(25, cateringY + 5, `🍨 Catering: ${contract.clientName}`, {
            fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: uiColor(this, 'yellow'), fontStyle: 'bold',
          });
          prepContainer.add(offerText);

          const detailText = this.add.text(25, cateringY + 22, `${contract.scoops} scoops of ${flavorName} — $${contract.payment.toFixed(2)}`, {
            fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#BDC3C7',
          });
          prepContainer.add(detailText);

          if (!contract.accepted) {
            const acceptBtn = this.add.text(25, cateringY + 40, '✓ Accept', {
              fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
              backgroundColor: '#27AE60', padding: { x: 10, y: 8 },
            }).setInteractive({ useHandCursor: true });
            acceptBtn.on('pointerdown', () => {
              this.gameState.acceptCatering(contract.id);
              this.updatePhaseUI();
            });
            prepContainer.add(acceptBtn);

            const declineBtn = this.add.text(130, cateringY + 40, '✗ Decline', {
              fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
              backgroundColor: '#7F8C8D', padding: { x: 10, y: 8 },
            }).setInteractive({ useHandCursor: true });
            declineBtn.on('pointerdown', () => {
              this.gameState.loc.cateringContracts = contracts.filter(c => c.id !== contract.id);
              this.updatePhaseUI();
            });
            prepContainer.add(declineBtn);
          } else {
            const acceptedLabel = this.add.text(25, cateringY + 40, '✓ Accepted — will fulfill at close', {
              fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: uiColor(this, 'green'),
            });
            prepContainer.add(acceptedLabel);
          }

          cateringY += 70;
        }
      }

      // Season progress (story mode)
      const gameMode = this.registry.get('gameMode') as string ?? 'story';
      const curSeasonDef = this.gameState.getSeasonDef();
      if (gameMode === 'story' && curSeasonDef) {
        const progressLines = [
          `Season ${curSeasonDef.season}: ${curSeasonDef.name}`,
          `Revenue: $${this.gameState.seasonRevenue.toFixed(0)} / $${curSeasonDef.revenueTarget}`,
          `Reputation: ${this.gameState.loc.reputation.toFixed(1)} / ${curSeasonDef.reputationTarget.toFixed(1)}`,
          `Days: ${this.gameState.seasonDay} / ${curSeasonDef.daysPerSeason}`,
        ];
        const progressText = this.add.text(GAME_WIDTH / 2, 70, progressLines.join('\n'), {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#333',
          backgroundColor: '#D5F5E3CC', padding: { x: 10, y: 8 },
          lineSpacing: 3, align: 'center',
        }).setOrigin(0.5, 0);
        prepContainer.add(progressText);
      }

      // Daily costs summary
      const totalWages = this.gameState.loc.staff.reduce((sum, st) => sum + st.wage, 0);
      const maintenance = this.gameState.getMaintenanceCost();
      const assignedCount = this.gameState.loc.staff.filter(st => st.assigned).length;
      const costLines = [
        'Daily Costs:',
        `  Staff (${assignedCount}/${this.gameState.loc.staff.length}): $${totalWages}`,
        `  Maintenance: $${maintenance}`,
        `  Total: $${totalWages + maintenance}/day`,
      ];

      // Add active campaigns
      if (this.gameState.loc.activeCampaigns.length > 0) {
        costLines.push('');
        costLines.push('Active Campaigns:');
        for (const campaign of this.gameState.loc.activeCampaigns) {
          const def = CAMPAIGN_CATALOG.find(c => c.id === campaign.id);
          costLines.push(`  ${def?.icon ?? ''} ${def?.name ?? campaign.id} (${campaign.daysRemaining}d)`);
        }
      }

      // Loan status
      if (this.gameState.loc.loanAmount > 0) {
        const isOverdue = this.gameState.loc.loanDaysRemaining <= 0;
        costLines.push('');
        costLines.push(`🏦 Loan: $${this.gameState.loc.loanAmount.toFixed(0)} owed`);
        costLines.push(`  ${isOverdue ? '⚠ OVERDUE!' : `${this.gameState.loc.loanDaysRemaining}d remaining`}`);
      }

      // Health inspection status
      if (this.gameState.loc.closureDaysRemaining > 0) {
        costLines.push('');
        costLines.push(`⛔ CLOSED: ${this.gameState.loc.closureDaysRemaining} day(s) left`);
      } else if (this.gameState.loc.inspectionHistory.length > 0) {
        const last = this.gameState.loc.inspectionHistory[this.gameState.loc.inspectionHistory.length - 1];
        costLines.push('');
        costLines.push(`Last Inspection: ${last.passed ? '✅' : '❌'} ${last.score}/100`);
      }

      // Add broken equipment warnings
      const brokenEquip = this.gameState.loc.equipment.filter(e => e.broken);
      if (brokenEquip.length > 0) {
        costLines.push('');
        costLines.push('Broken Equipment:');
        for (const eq of brokenEquip) {
          const def = EQUIPMENT_CATALOG.find(e => e.id === eq.id);
          costLines.push(`  🔧 ${def?.name ?? eq.id}`);
        }
      }

      const costText = this.add.text(20, 70, costLines.join('\n'), {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 13),
        color: '#333',
        backgroundColor: '#FFFFFFCC',
        padding: { x: 10, y: 8 },
        lineSpacing: 3,
      });
      prepContainer.add(costText);
    }
  }

  private updateHUD(): void {
    const s = this.gameState;
    const seasonDef = s.getSeasonDef();
    let dayLabel: string;
    if (this.challengeDef) {
      const daysLeft = Math.max(0, this.challengeDef.days - s.day + 1);
      dayLabel = `Day ${s.day}/${this.challengeDef.days} | ${this.challengeDef.icon} ${this.challengeDef.name} (${daysLeft}d left)`;
    } else {
      const seasonLabel = seasonDef ? `${seasonDef.name}` : `Season ${s.season}`;
      const daysLeft = seasonDef ? ` (${seasonDef.daysPerSeason - s.seasonDay + 1}d left)` : '';
      dayLabel = `Day ${s.seasonDay} | ${seasonLabel}${daysLeft}`;
    }
    this.dayText.setText(dayLabel);
    this.timeText.setText(s.currentTimeString);
    const weatherDef = s.getWeatherDef();
    this.weatherText.setText(`${weatherDef.icon} ${weatherDef.name}`);
    this.phaseText.setText(s.phase.toUpperCase());
    this.moneyText.setText(`$${s.loc.money.toFixed(2)}`);
    this.dailyRevText.setText(`Today: $${s.loc.dailyRevenue.toFixed(2)}`);
    this.reputationText.setText('★'.repeat(Math.round(s.loc.reputation)) + '☆'.repeat(5 - Math.round(s.loc.reputation)));
    const activeStaff = s.getActiveStaff().length;
    const totalAssigned = s.loc.staff.filter(st => st.assigned).length;
    const staffLabel = totalAssigned > 0 ? ` | Staff: ${activeStaff}/${totalAssigned}` : '';
    this.queueText.setText(`Queue: ${this.customerManager.getQueueLength()} | Served: ${this.customerManager.customersServed} | Lost: ${this.customerManager.customersLost}${staffLabel}`);

    const speedLabels: Record<number, string> = { 0: '⏸ PAUSED', 1: '▶ 1x', 2: '▶▶ 2x' };
    this.speedText.setText(speedLabels[s.gameSpeed] ?? `${s.gameSpeed}x`);

    // Active event indicator
    const activeEvent = this.eventManager.getActiveEvent();
    if (activeEvent) {
      this.eventText.setText(`${activeEvent.def.icon} ${activeEvent.def.name}`);
      this.eventText.setVisible(true);
    } else {
      this.eventText.setVisible(false);
    }

    // Stock warnings during serve phase
    if (s.phase === DayPhase.SERVE) {
      const warnings = s.loc.ingredients
        .filter(i => i.quantity <= LOW_STOCK_THRESHOLD)
        .map(i => i.quantity === 0 ? `⛔ ${i.name}: OUT` : `⚠ ${i.name}: ${i.quantity}`);

      const hasOutOfStock = s.loc.ingredients.some(i => i.quantity === 0);

      if (warnings.length > 0) {
        this.stockWarningText.setText(warnings.join('\n'));
        this.stockWarningText.setVisible(true);
        // Show emergency resupply button when something is out
        this.emergencyResupplyBtn.setVisible(hasOutOfStock);
        // Position the resupply button above the warnings
        if (hasOutOfStock) {
          this.emergencyResupplyBtn.setY(this.stockWarningText.y - this.stockWarningText.height - 8);
        }
      } else {
        this.stockWarningText.setVisible(false);
        this.emergencyResupplyBtn.setVisible(false);
      }
    } else {
      this.stockWarningText.setVisible(false);
      this.emergencyResupplyBtn.setVisible(false);
    }

    // Equipment warnings (broken or low condition)
    const equipWarnings: string[] = [];
    for (const owned of s.equipment) {
      if (owned.tier === 0) continue;
      const def = EQUIPMENT_CATALOG.find(e => e.id === owned.id);
      const name = def?.name ?? owned.id;
      if (owned.broken) {
        equipWarnings.push(`🔧 ${name}: BROKEN`);
      } else if (owned.condition < 30) {
        equipWarnings.push(`⚠ ${name}: ${Math.round(owned.condition)}% — repair soon!`);
      } else if (owned.condition < 50) {
        equipWarnings.push(`⚠ ${name}: ${Math.round(owned.condition)}%`);
      }
    }
    if (equipWarnings.length > 0) {
      this.equipWarningText.setText(equipWarnings.join('\n'));
      this.equipWarningText.setVisible(true);
    } else {
      this.equipWarningText.setVisible(false);
    }
  }

  private toggleSpeed(): void {
    const speeds = [1, 2, 0];
    const idx = speeds.indexOf(this.gameState.gameSpeed);
    this.gameState.gameSpeed = speeds[(idx + 1) % speeds.length];
  }

  private rollDailyEvent(): void {
    this.eventManager.rollForEvent(this.gameState);
    // Pass event effects to customer manager
    this.customerManager.eventEffects = this.eventManager.getEffects();
    // Pass trending flavor to customer manager
    const activeEvent = this.eventManager.getActiveEvent();
    this.customerManager.trendingFlavorId = activeEvent?.trendingFlavorId;
    // Store ingredient price multiplier in registry for ShopScene access
    const effects = this.eventManager.getEffects();
    this.registry.set('eventIngredientPriceMult', effects.ingredientPriceMult ?? 1.0);
    // Reset charity donation choice for new day
    this.registry.set('charityDonationPercent', 0);
    this.registry.set('charityRepBonus', 0);
  }

  private showEventNotification(event: ActiveEvent): void {
    getAudioManager(this).notification();
    const notif = this.add.container(GAME_WIDTH / 2, 140);
    let text = event.def.description;
    if (event.trendingFlavorId) {
      const flavorName = this.gameState.loc.flavors.find(f => f.id === event.trendingFlavorId)?.name ?? event.trendingFlavorId;
      text = event.def.description.replace('A flavor', `"${flavorName}"`);
    }

    const bg = this.add.graphics();
    bg.fillStyle(0x34495E, 0.95);
    bg.fillRoundedRect(-180, -30, 360, 60, 10);
    bg.lineStyle(2, 0x3498DB);
    bg.strokeRoundedRect(-180, -30, 360, 60, 10);
    notif.add(bg);

    const title = this.add.text(0, -18, `${event.def.icon} ${event.def.name}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#F1C40F', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    notif.add(title);

    const desc = this.add.text(0, 2, text, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#BDC3C7',
      wordWrap: { width: 340 },
    }).setOrigin(0.5, 0);
    notif.add(desc);

    notif.setAlpha(0);
    this.tweens.add({
      targets: notif,
      alpha: 1,
      y: 160,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(4000, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 140,
            duration: 500,
            onComplete: () => notif.destroy(),
          });
        });
      },
    });
  }

  private showStaffQuitNotices(): void {
    const quitList = this.gameState.loc._staffQuit;
    if (!quitList || quitList.length === 0) return;

    const msg = quitList.length === 1
      ? `${quitList[0]} quit due to low morale!`
      : `${quitList.join(', ')} quit due to low morale!`;

    const notice = this.add.text(
      GAME_WIDTH / 2, 340, msg,
      {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 14),
        color: '#FF6B6B',
        fontStyle: 'bold',
        backgroundColor: '#2C0000',
        padding: { x: 10, y: 6 },
      }
    ).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: notice,
      alpha: 0,
      y: 300,
      duration: 4000,
      delay: 2000,
      ease: 'Power2',
      onComplete: () => notice.destroy(),
    });
  }

  private checkGameplayTips(): void {
    const tip = this.tipManager.checkTips(this.gameState);
    if (!tip) return;

    // Delay tip slightly so it doesn't overlap with other start-of-day notifications
    this.time.delayedCall(2000, () => {
      const notif = this.add.container(GAME_WIDTH / 2, 100);

      const bg = this.add.graphics();
      bg.fillStyle(0x1A5276, 0.95);
      bg.fillRoundedRect(-200, -35, 400, 70, 10);
      bg.lineStyle(2, 0xF39C12);
      bg.strokeRoundedRect(-200, -35, 400, 70, 10);
      notif.add(bg);

      const title = this.add.text(0, -23, `💡 ${tip.title}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F1C40F', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      notif.add(title);

      const body = this.add.text(0, -4, tip.body, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#ECF0F1',
        wordWrap: { width: 370 }, lineSpacing: 2,
      }).setOrigin(0.5, 0);
      notif.add(body);

      // Resize background to fit content
      const totalH = body.height + 35;
      bg.clear();
      bg.fillStyle(0x1A5276, 0.95);
      bg.fillRoundedRect(-200, -35, 400, totalH, 10);
      bg.lineStyle(2, 0xF39C12);
      bg.strokeRoundedRect(-200, -35, 400, totalH, 10);

      notif.setAlpha(0);
      this.tweens.add({
        targets: notif,
        alpha: 1,
        y: 120,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          this.time.delayedCall(6000, () => {
            this.tweens.add({
              targets: notif,
              alpha: 0,
              y: 100,
              duration: 500,
              onComplete: () => notif.destroy(),
            });
          });
        },
      });
    });
  }

  private showMilestoneNotification(milestones: string[]): void {
    getAudioManager(this).success();
    const notif = this.add.container(GAME_WIDTH / 2, 130);
    const bg = this.add.graphics();
    bg.fillStyle(0x2C3E50, 0.95);
    bg.fillRoundedRect(-180, -25, 360, 50, 10);
    bg.lineStyle(2, 0xF1C40F);
    bg.strokeRoundedRect(-180, -25, 360, 50, 10);
    notif.add(bg);

    const title = this.add.text(0, -14, `Milestone${milestones.length > 1 ? 's' : ''} Complete!`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F1C40F', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    notif.add(title);

    const names = this.add.text(0, 4, milestones.join(', ') + ' (+RP)', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#BDC3C7',
    }).setOrigin(0.5, 0);
    notif.add(names);

    notif.setAlpha(0);
    this.tweens.add({
      targets: notif,
      alpha: 1,
      y: 150,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(4000, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 130,
            duration: 400,
            onComplete: () => notif.destroy(),
          });
        });
      },
    });
  }

  private showCriticReviewNotification(review: CriticReview): void {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const color = review.rating >= 4 ? '#2ECC40' : review.rating >= 3 ? '#F39C12' : '#E74C3C';
    const messages = review.rating >= 4
      ? ['Excellent!', 'Outstanding service!', 'A hidden gem!']
      : review.rating >= 3
      ? ['Decent experience.', 'Nothing special.', 'Adequate.']
      : ['Disappointing.', 'Would not recommend.', 'Poor service.'];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    const notif = this.add.container(GAME_WIDTH / 2, 80);
    const bg = this.add.graphics();
    bg.fillStyle(0x2C3E50, 0.95);
    bg.fillRoundedRect(-160, -30, 320, 60, 10);
    bg.lineStyle(2, review.rating >= 4 ? 0x2ECC71 : review.rating >= 3 ? 0xF39C12 : 0xE74C3C);
    bg.strokeRoundedRect(-160, -30, 320, 60, 10);
    notif.add(bg);

    const title = this.add.text(0, -18, `📝 Critic Review: ${stars}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color,
    }).setOrigin(0.5, 0);
    notif.add(title);

    const quote = this.add.text(0, 2, `"${msg}"`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#BDC3C7', fontStyle: 'italic',
    }).setOrigin(0.5, 0);
    notif.add(quote);

    // Animate in and out
    notif.setAlpha(0);
    this.tweens.add({
      targets: notif,
      alpha: 1,
      y: 100,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 80,
            duration: 400,
            onComplete: () => notif.destroy(),
          });
        });
      },
    });
  }

  private showInspectionNotification(result: HealthInspectionResult): void {
    const passed = result.passed;
    const color = passed ? '#2ECC71' : '#E74C3C';
    const icon = passed ? '✅' : '❌';
    const title = passed ? 'Health Inspection Passed!' : 'Health Inspection FAILED!';

    const notif = this.add.container(GAME_WIDTH / 2, 140);

    const panelH = 80 + result.violations.length * 16;
    const bg = this.add.graphics();
    bg.fillStyle(passed ? 0x1A5276 : 0x4A1A1A, 0.95);
    bg.fillRoundedRect(-200, -30, 400, panelH, 10);
    bg.lineStyle(2, passed ? 0x2ECC71 : 0xE74C3C);
    bg.strokeRoundedRect(-200, -30, 400, panelH, 10);
    notif.add(bg);

    const titleText = this.add.text(0, -18, `${icon} ${title} (Score: ${result.score}/100)`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color, fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    notif.add(titleText);

    let yOff = 6;
    for (const v of result.violations.slice(0, 5)) {
      const vText = this.add.text(0, yOff, `• ${v}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 11), color: '#BDC3C7',
        wordWrap: { width: 370 },
      }).setOrigin(0.5, 0);
      notif.add(vText);
      yOff += 16;
    }

    if (!passed && result.closureDays > 0) {
      const closureText = this.add.text(0, yOff + 4, `⛔ Store closed for ${result.closureDays} day(s)!`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#E74C3C', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      notif.add(closureText);
    }

    notif.setAlpha(0);
    this.tweens.add({
      targets: notif,
      alpha: 1,
      y: 160,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(6000, () => {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 140,
            duration: 500,
            onComplete: () => notif.destroy(),
          });
        });
      },
    });
  }

  private showClosureNotice(): void {
    // During prepare phase, show a notice that the store is closed
    const days = this.gameState.loc.closureDaysRemaining;
    const notif = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `⛔ STORE CLOSED\nHealth inspection failure\n${days} day(s) remaining`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 24), color: '#E74C3C',
      backgroundColor: '#00000088', padding: { x: 20, y: 16 },
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setName('closureNotice');
  }

  private onDayEnd(): void {
    const audio = getAudioManager(this);
    audio.stopAmbience();
    audio.dayEnd();
    this.serveButton.setVisible(false);
    this.customerManager.clearQueue();

    // Capture active event before clearing (for report display)
    const activeEvent = this.eventManager.getActiveEvent();

    // Apply event end-of-day effects (spoilage, reputation bonus, etc.)
    this.eventManager.applyEndOfDayEffects(this.gameState);

    // Calculate enhanced reputation change
    const served = this.customerManager.customersServed;
    const lost = this.customerManager.customersLost;
    const total = served + lost;
    const avgSatisfaction = this.customerManager.getAverageSatisfaction();
    const criticReview = this.customerManager.getLastCriticReview() ?? undefined;

    let repChange = this.gameState.calculateReputationChange(
      served, lost, avgSatisfaction, criticReview,
    );

    // Apply research reputation gain multiplier
    const researchEffects = this.gameState.getResearchEffects();
    if (repChange > 0 && researchEffects.reputationGainMult) {
      const bonus = repChange * (researchEffects.reputationGainMult - 1);
      repChange += bonus;
      this.gameState.loc.reputation = Math.max(0.5, Math.min(5, this.gameState.loc.reputation + bonus));
    }

    // Apply campaign reputation bonus
    const campaignEffects = this.gameState.getCampaignEffects();
    if (campaignEffects.reputationBonus) {
      repChange += campaignEffects.reputationBonus;
      this.gameState.loc.reputation = Math.max(0.5, Math.min(5, this.gameState.loc.reputation + campaignEffects.reputationBonus));
    }

    // Apply signage daily reputation bonus
    const signageRepBonus = this.gameState.getSignageDef().dailyRepBonus;
    if (signageRepBonus > 0) {
      repChange += signageRepBonus;
      this.gameState.loc.reputation = Math.max(0.5, Math.min(5, this.gameState.loc.reputation + signageRepBonus));
    }

    // Track cumulative stats for milestones
    this.gameState.totalCustomersServed += served;

    // Check milestones and award research points
    const newMilestones = this.gameState.checkMilestones();
    if (newMilestones.length > 0) {
      this.showMilestoneNotification(newMilestones);
    }

    // Fulfill accepted catering contracts
    const cateringResult = this.gameState.fulfillCatering();
    if (cateringResult.revenue > 0) {
      this.gameState.loc.dailyRevenue += cateringResult.revenue;
      this.gameState.loc.money += cateringResult.revenue;
    }

    // Apply charity donation if player chose to donate
    const charityDonationPercent = this.registry.get('charityDonationPercent') as number ?? 0;
    const charityRepBonus = this.registry.get('charityRepBonus') as number ?? 0;
    let charityDonationAmount = 0;
    if (charityDonationPercent > 0 && this.gameState.loc.dailyRevenue > 0) {
      charityDonationAmount = this.gameState.loc.dailyRevenue * charityDonationPercent;
      this.gameState.loc.dailyRevenue -= charityDonationAmount;
      this.gameState.loc.money -= charityDonationAmount;
      if (charityRepBonus > 0) {
        this.gameState.loc.reputation = Math.max(0.5, Math.min(5,
          this.gameState.loc.reputation + charityRepBonus));
        repChange += charityRepBonus;
      }
    }

    // Record day report with full stats
    const s = this.gameState;
    const satisfaction = total > 0 ? Math.round((served / total) * 100) : 0;
    s.loc.dayReports.push({
      day: s.day,
      revenue: s.loc.dailyRevenue,
      expenses: s.loc.dailyExpenses,
      customersServed: served,
      customersLost: lost,
      satisfactionScore: satisfaction,
      criticReview,
      reputationChange: repChange,
      waste: s.loc._todayWaste,
    });

    // Show end-of-day report
    const report = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    report.add(bg);

    // Wider panel to fit chart
    const panelW = 520;
    const panelH = 480;
    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 15);
    report.add(panel);

    // Title
    const titleText = this.add.text(0, -panelH / 2 + 20, `— Day ${s.day} Report —`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    report.add(titleText);

    // Stats in two columns
    const leftX = -panelW / 2 + 30;
    const rightX = 20;
    let y = -panelH / 2 + 60;
    const labelStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#95A5A6' };
    const valueStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#FFF' };
    const profitColor = s.profit >= 0 ? '#2ECC40' : '#E74C3C';

    const addStat = (x: number, yPos: number, label: string, value: string, color?: string) => {
      const l = this.add.text(x, yPos, label, labelStyle);
      const v = this.add.text(x, yPos + 16, value, { ...valueStyle, color: color ?? '#FFF' });
      report.add(l);
      report.add(v);
    };

    addStat(leftX, y, 'CUSTOMERS SERVED', `${served}`, '#2ECC40');
    addStat(rightX, y, 'CUSTOMERS LOST', `${lost}`, lost > 0 ? '#E74C3C' : '#FFF');
    y += 45;
    addStat(leftX, y, 'SATISFACTION', `${satisfaction}%`, satisfaction >= 70 ? '#2ECC40' : '#F39C12');
    const repChangeSign = repChange >= 0 ? '+' : '';
    const repChangeColor = repChange > 0 ? '#2ECC40' : repChange < 0 ? '#E74C3C' : '#95A5A6';
    addStat(rightX, y, 'REPUTATION', '★'.repeat(Math.round(s.loc.reputation)) + '☆'.repeat(5 - Math.round(s.loc.reputation)) + ` (${repChangeSign}${repChange.toFixed(2)})`, '#FFDC00');
    y += 45;

    // Show critic review in report if present
    if (criticReview) {
      const criticStars = '★'.repeat(criticReview.rating) + '☆'.repeat(5 - criticReview.rating);
      const criticColor = criticReview.rating >= 4 ? '#2ECC71' : criticReview.rating >= 3 ? '#F39C12' : '#E74C3C';
      const criticLabel = this.add.text(leftX, y, `📝 CRITIC REVIEW: ${criticStars}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: criticColor, fontStyle: 'bold',
      });
      report.add(criticLabel);
      y += 25;
    }

    // Show weather in report
    const weather = this.gameState.getWeatherDef();
    const weatherLabel = this.add.text(leftX, y, `${weather.icon} WEATHER: ${weather.name}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#BDC3C7',
    });
    report.add(weatherLabel);
    y += 25;

    // Show active event in report
    if (activeEvent) {
      const eventLabel = this.add.text(leftX, y, `${activeEvent.def.icon} EVENT: ${activeEvent.def.name}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#F1C40F', fontStyle: 'bold',
      });
      report.add(eventLabel);
      y += 25;
    }

    // Show catering results in report
    if (cateringResult.fulfilled > 0 || cateringResult.failed > 0) {
      const cateringColor = cateringResult.failed > 0 ? uiColor(this, 'yellow') : uiColor(this, 'green');
      let cateringLabel = `🍨 CATERING: ${cateringResult.fulfilled} fulfilled (+$${cateringResult.revenue.toFixed(2)})`;
      if (cateringResult.failed > 0) cateringLabel += ` | ${cateringResult.failed} failed`;
      const cateringText = this.add.text(leftX, y, cateringLabel, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: cateringColor, fontStyle: 'bold',
      });
      report.add(cateringText);
      y += 25;
    }

    // Show charity donation in report
    if (charityDonationAmount > 0) {
      const charityText = this.add.text(leftX, y, `💝 CHARITY: -$${charityDonationAmount.toFixed(2)} donated (+${charityRepBonus.toFixed(2)} ★)`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#E74C3C', fontStyle: 'bold',
      });
      report.add(charityText);
      y += 25;
    }

    // Waste log (ingredients that expired overnight)
    const waste = s.loc._todayWaste;
    if (waste && waste.length > 0) {
      const wasteItems = waste.map(w => `${w.name} x${w.quantity}`).join(', ');
      const wasteText = this.add.text(leftX, y, `🗑 SPOILED: ${wasteItems}`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#E67E22',
        wordWrap: { width: panelW - 60 },
      });
      report.add(wasteText);
      y += 22;
    }

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x7F8C8D, 0.5);
    sep.lineBetween(-panelW / 2 + 20, y, panelW / 2 - 20, y);
    report.add(sep);
    y += 10;

    addStat(leftX, y, 'REVENUE', `$${s.loc.dailyRevenue.toFixed(2)}`, uiColor(this, 'green'));
    addStat(rightX, y, 'EXPENSES', `$${s.loc.dailyExpenses.toFixed(2)}`, '#E74C3C');
    y += 45;
    addStat(leftX, y, 'PROFIT', `$${s.profit.toFixed(2)}`, profitColor);
    addStat(rightX, y, 'BALANCE', `$${s.loc.money.toFixed(2)}`);
    y += 50;

    // Low balance warning in story mode — check ALL franchise locations
    const gameMode = this.registry.get('gameMode') as string ?? 'story';
    if (gameMode === 'story') {
      const locationsToCheck = s.franchiseMode && s.locations.length > 0
        ? s.locations : [s.loc];
      for (const loc of locationsToCheck) {
        if (loc.money < 0) {
          const warningColor = loc.money < -50 ? uiColor(this, 'red') : uiColor(this, 'yellow');
          const locLabel = s.franchiseMode ? ` (${loc.name})` : '';
          const warningMsg = loc.money < -50
            ? `⚠️ DANGER${locLabel}: Bankruptcy at -$100! Cut costs immediately!`
            : `⚠️ Warning${locLabel}: Balance is negative. Risk of bankruptcy!`;
          const warning = this.add.text(0, y - 10, warningMsg, {
            fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: warningColor, fontStyle: 'bold',
            wordWrap: { width: panelW - 60 },
          }).setOrigin(0.5, 0);
          report.add(warning);
          y += 22;
        }
      }
    }

    // Mini revenue chart (last 7 days)
    const recentReports = s.loc.dayReports.slice(-7);
    if (recentReports.length > 1) {
      const chartX = -panelW / 2 + 30;
      const chartW = panelW - 60;
      const chartH = 80;

      const chartLabel = this.add.text(0, y, 'Revenue Trend (Last 7 Days)', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#95A5A6',
      }).setOrigin(0.5, 0);
      report.add(chartLabel);
      y += 20;

      const chartGfx = this.add.graphics();

      // Chart background
      chartGfx.fillStyle(0x1A252F, 1);
      chartGfx.fillRoundedRect(chartX, y, chartW, chartH, 5);

      // Find max value for scaling
      const maxRev = Math.max(...recentReports.map(r => r.revenue), 1);
      const barWidth = (chartW - 20) / recentReports.length;

      recentReports.forEach((r, i) => {
        const barH = (r.revenue / maxRev) * (chartH - 20);
        const bx = chartX + 10 + i * barWidth;
        const by = y + chartH - 10 - barH;

        // Bar
        const profit = r.revenue - r.expenses;
        chartGfx.fillStyle(profit >= 0 ? uiColorNum(this, 'green') : uiColorNum(this, 'red'), 0.8);
        chartGfx.fillRoundedRect(bx + 2, by, barWidth - 4, barH, 2);

        // Day label
        const dayLabel = this.add.text(bx + barWidth / 2, y + chartH - 6, `D${r.day}`, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 9), color: '#7F8C8D',
        }).setOrigin(0.5, 0);
        report.add(dayLabel);
      });

      report.add(chartGfx);
    }

    // Next day button
    const nextBtn = this.add.text(0, panelH / 2 - 45, 'Next Day →', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 22),
      color: '#FFF',
      backgroundColor: '#3498DB',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    report.add(nextBtn);

    nextBtn.on('pointerdown', () => {
      report.destroy();
      // Auto-save at end of day
      const gameMode = this.registry.get('gameMode') as string ?? 'story';
      SaveManager.save(this.gameState, 'auto', gameMode);

      // Check for mid-season bankruptcy in story mode
      if (gameMode === 'story') {
        const gs = this.gameState;
        const isBankrupt = gs.franchiseMode
          ? gs.locations.some(loc => loc.money < -100)
          : gs.loc.money < -100;
        if (isBankrupt || gs.isSeasonComplete()) {
          this.showSeasonResults();
          return;
        }
      }

      // Check for challenge completion
      if (gameMode === 'challenge' && this.challengeDef && this.gameState.day >= this.challengeDef.days) {
        this.showChallengeResults();
        return;
      }

      // Sandbox mode: ensure unlimited funds persist
      if (gameMode === 'sandbox' && this.gameState.loc.money < 99999) {
        this.gameState.loc.money = 99999;
      }

      this.gameState.startNewDay();
      // Roll for next day's event
      this.rollDailyEvent();
      this.updatePhaseUI();
      // Notify player if staff quit
      this.showStaffQuitNotices();
      // Show contextual tips at start of new day
      this.checkGameplayTips();
    });
  }

  private showSeasonResults(): void {
    const s = this.gameState;
    const seasonDef = s.getSeasonDef();
    if (!seasonDef) return;

    // Include today's revenue in the total (sum all locations in franchise mode)
    const pendingRevenue = s.franchiseMode && s.locations.length > 0
      ? s.locations.reduce((sum, loc) => sum + loc.dailyRevenue, 0)
      : s.loc.dailyRevenue;
    const totalRevenue = s.seasonRevenue + pendingRevenue;
    const result = s.getSeasonResult();

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Full-screen backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.8);
    backdrop.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    container.add(backdrop);

    const panelW = 500;
    const panelH = 440;
    const panel = this.add.graphics();

    // Panel color based on result
    const panelColor = result === 'win' ? 0x1A5276 : result === 'soft_fail' ? 0x4A3728 : 0x4A1A1A;
    panel.fillStyle(panelColor, 1);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 15);

    const gc = uiColorNum(this, 'green');
    const rc = uiColorNum(this, 'red');
    const yc = uiColorNum(this, 'yellow');
    const borderColor = result === 'win' ? gc : result === 'soft_fail' ? yc : rc;
    panel.lineStyle(3, borderColor);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 15);
    container.add(panel);

    // Result header
    const resultLabels = {
      win: 'Season Complete!',
      soft_fail: 'Season Over — Targets Missed',
      hard_fail: 'Bankrupt — Game Over',
    };
    const resultColors = { win: uiColor(this, 'green'), soft_fail: uiColor(this, 'yellow'), hard_fail: uiColor(this, 'red') };
    const resultIcons = { win: '🎉', soft_fail: '😔', hard_fail: '💀' };

    const title = this.add.text(0, -panelH / 2 + 25, `${resultIcons[result]} ${resultLabels[result]}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 24), color: resultColors[result], fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(title);

    const seasonName = this.add.text(0, -panelH / 2 + 60, `Season ${seasonDef.season}: ${seasonDef.name}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#BDC3C7',
    }).setOrigin(0.5, 0);
    container.add(seasonName);

    // Targets vs actual
    let y = -panelH / 2 + 100;
    const leftX = -panelW / 2 + 40;

    const addTarget = (yPos: number, label: string, actual: string, target: string, met: boolean) => {
      const l = this.add.text(leftX, yPos, label, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#95A5A6',
      });
      container.add(l);
      const check = met ? '✅' : '❌';
      const v = this.add.text(leftX, yPos + 20, `${check} ${actual}  (target: ${target})`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: met ? uiColor(this, 'green') : uiColor(this, 'red'),
      });
      container.add(v);
    };

    const metRevenue = totalRevenue >= seasonDef.revenueTarget;
    addTarget(y, 'TOTAL REVENUE', `$${totalRevenue.toFixed(2)}`, `$${seasonDef.revenueTarget}`, metRevenue);
    y += 55;

    // In franchise mode, show aggregate reputation
    const effectiveRep = (seasonDef.isFranchise && s.franchiseMode)
      ? s.getFranchiseStats().totalReputation
      : s.loc.reputation;
    const metRep = effectiveRep >= seasonDef.reputationTarget;
    const repStars = '★'.repeat(Math.round(effectiveRep)) + '☆'.repeat(5 - Math.round(effectiveRep));
    addTarget(y, 'REPUTATION', `${repStars} (${effectiveRep.toFixed(1)})`, `${seasonDef.reputationTarget.toFixed(1)}+`, metRep);
    y += 55;

    // Franchise location target
    if (seasonDef.isFranchise && seasonDef.locationTarget) {
      const locationCount = s.franchiseMode ? s.getFranchiseStats().locationCount : 1;
      const metLocations = locationCount >= seasonDef.locationTarget;
      addTarget(y, 'LOCATIONS OPENED', `${locationCount}`, `${seasonDef.locationTarget}`, metLocations);
      y += 55;
    }

    // Season stats summary — aggregate all locations in franchise mode
    const allLocs: LocationState[] = s.franchiseMode && s.locations.length > 0
      ? s.locations : [s.loc];
    let totalServed = 0;
    let totalLost = 0;
    let aggregateBalance = 0;
    for (const loc of allLocs) {
      const locReports = (loc.dayReports ?? []).slice(-seasonDef.daysPerSeason);
      totalServed += locReports.reduce((sum: number, r: DayReport) => sum + r.customersServed, 0);
      totalLost += locReports.reduce((sum: number, r: DayReport) => sum + r.customersLost, 0);
      aggregateBalance += loc.money;
    }

    const statsText = this.add.text(leftX, y, [
      `Days Played: ${seasonDef.daysPerSeason}`,
      `Customers Served: ${totalServed}`,
      `Customers Lost: ${totalLost}`,
      `Final Balance: $${aggregateBalance.toFixed(2)}`,
    ].join('\n'), {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#BDC3C7', lineSpacing: 4,
    });
    container.add(statsText);

    y += 100;

    // Action buttons based on result
    if (result === 'win') {
      const nextSeasonDef = SEASON_CATALOG.find(sd => sd.season === seasonDef.season + 1);
      if (nextSeasonDef) {
        // Preview next season
        const preview = this.add.text(0, y, `Next: Season ${nextSeasonDef.season} — ${nextSeasonDef.name}`, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#7FDBFF',
        }).setOrigin(0.5, 0);
        container.add(preview);

        const previewDesc = this.add.text(0, y + 22, nextSeasonDef.description, {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#95A5A6',
          wordWrap: { width: panelW - 80 },
        }).setOrigin(0.5, 0);
        container.add(previewDesc);

        const nextBtn = this.add.text(0, panelH / 2 - 45, 'Next Season →', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
          backgroundColor: '#27AE60', padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(nextBtn);

        nextBtn.on('pointerdown', () => {
          container.destroy();
          s.advanceSeason();
          s.startNewDay();
          SaveManager.save(s, 'auto', 'story');
          this.rollDailyEvent();
          this.updatePhaseUI();
          this.showStaffQuitNotices();
        });
      } else {
        // Game complete! All 5 seasons done — transition to VictoryScene
        const victoryBtn = this.add.text(0, panelH / 2 - 45, '🏆 View Victory!', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
          backgroundColor: '#D4AC0D', padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(victoryBtn);

        victoryBtn.on('pointerdown', () => {
          this.scene.start('VictoryScene');
        });
      }
    } else if (result === 'soft_fail') {
      // Retry, continue anyway, or main menu options
      const retryBtn = this.add.text(-130, panelH / 2 - 45, 'Retry Season', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
        backgroundColor: '#F39C12', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      container.add(retryBtn);

      retryBtn.on('pointerdown', () => {
        container.destroy();
        // Reset season state but keep equipment/staff
        s.seasonDay = 0;
        s.seasonRevenue = 0;
        // In franchise mode, distribute startingMoney equally across all locations
        if (s.franchiseMode && s.locations.length > 0) {
          const perLocation = Math.floor(seasonDef.startingMoney / s.locations.length);
          for (const loc of s.locations) {
            loc.money = perLocation;
          }
        } else {
          s.loc.money = seasonDef.startingMoney;
        }
        s.startNewDay();
        SaveManager.save(s, 'auto', 'story');
        this.rollDailyEvent();
        this.updatePhaseUI();
        this.showStaffQuitNotices();
      });

      // "Continue Anyway" — advance to next season without win bonus
      const nextSeasonDef = SEASON_CATALOG.find(sd => sd.season === seasonDef.season + 1);
      if (nextSeasonDef) {
        const continueBtn = this.add.text(0, panelH / 2 - 45, 'Continue Anyway →', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
          backgroundColor: '#8E44AD', padding: { x: 12, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(continueBtn);

        continueBtn.on('pointerdown', () => {
          container.destroy();
          s.advanceSeason();
          s.startNewDay();
          SaveManager.save(s, 'auto', 'story');
          this.rollDailyEvent();
          this.updatePhaseUI();
          this.showStaffQuitNotices();
        });
      } else {
        // Final season soft-fail — allow accepting partial completion
        const acceptBtn = this.add.text(0, panelH / 2 - 45, 'Accept Result', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
          backgroundColor: '#8E44AD', padding: { x: 12, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(acceptBtn);

        acceptBtn.on('pointerdown', () => {
          this.registry.set('partialVictory', true);
          this.scene.start('VictoryScene');
        });
      }

      const menuBtn = this.add.text(130, panelH / 2 - 45, 'Main Menu', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
        backgroundColor: '#34495E', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      container.add(menuBtn);

      menuBtn.on('pointerdown', () => {
        this.scene.start('MainMenuScene');
      });
    } else {
      // Hard fail — transition to GameOverScene
      const gameOverBtn = this.add.text(0, panelH / 2 - 45, 'Continue', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFF',
        backgroundColor: '#E74C3C', padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      container.add(gameOverBtn);

      gameOverBtn.on('pointerdown', () => {
        this.scene.start('GameOverScene');
      });
    }
  }

  private showChallengeResults(): void {
    const ch = this.challengeDef;
    if (!ch) return;

    const s = this.gameState;
    const totalRevenue = s.loc.dayReports.reduce((sum, r) => sum + r.revenue, 0);
    const totalServed = s.loc.dayReports.reduce((sum, r) => sum + r.customersServed, 0);
    const totalLost = s.loc.dayReports.reduce((sum, r) => sum + r.customersLost, 0);

    // Calculate stars
    const stars = totalRevenue >= ch.revenueTargets[2] ? 3
      : totalRevenue >= ch.revenueTargets[1] ? 2
      : totalRevenue >= ch.revenueTargets[0] ? 1 : 0;

    // Save best score
    const bestKey = `challenge_best_${ch.id}`;
    const prevBest = parseInt(localStorage.getItem(bestKey) ?? '0', 10);
    const isNewBest = totalRevenue > prevBest;
    if (isNewBest) {
      localStorage.setItem(bestKey, Math.floor(totalRevenue).toString());
    }

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.8);
    backdrop.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    container.add(backdrop);

    const panelW = 480;
    const panelH = 420;
    const panel = this.add.graphics();
    const panelColor = stars >= 3 ? 0x1A5276 : stars >= 1 ? 0x2C3E50 : 0x4A1A1A;
    panel.fillStyle(panelColor, 1);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 15);
    const borderColor = stars >= 3 ? 0xFFD700 : stars >= 1 ? 0xF1C40F : 0xE74C3C;
    panel.lineStyle(3, borderColor);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 15);
    container.add(panel);

    // Title
    const resultIcon = stars >= 3 ? '🏆' : stars >= 1 ? '⭐' : '😔';
    container.add(this.add.text(0, -panelH / 2 + 25, `${resultIcon} ${ch.icon} ${ch.name} Complete!`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 22), color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5));

    // Stars display
    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    container.add(this.add.text(0, -panelH / 2 + 60, starStr, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 36), color: '#FFD700',
    }).setOrigin(0.5));

    if (isNewBest) {
      container.add(this.add.text(0, -panelH / 2 + 100, 'NEW BEST!', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: '#2ECC71', fontStyle: 'bold',
      }).setOrigin(0.5));
    }

    // Stats
    let y = -panelH / 2 + 130;
    const leftX = -panelW / 2 + 40;

    const addLine = (text: string, color: string = '#BDC3C7') => {
      container.add(this.add.text(leftX, y, text, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color,
      }));
      y += 28;
    };

    addLine(`Total Revenue: $${totalRevenue.toFixed(2)}`, '#FFD700');
    addLine(`★ Target: $${ch.revenueTargets[0]}  ★★ $${ch.revenueTargets[1]}  ★★★ $${ch.revenueTargets[2]}`, '#7F8C8D');
    y += 8;
    addLine(`Customers Served: ${totalServed}`, '#2ECC71');
    addLine(`Customers Lost: ${totalLost}`, totalLost > 0 ? '#E74C3C' : '#FFF');
    addLine(`Final Reputation: ${'★'.repeat(Math.round(s.loc.reputation))}${'☆'.repeat(5 - Math.round(s.loc.reputation))}`, '#FFDC00');

    // Buttons
    const retryBtn = this.add.text(-150, panelH / 2 - 45, 'Retry Challenge', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
      backgroundColor: '#F39C12', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    container.add(retryBtn);

    retryBtn.on('pointerdown', () => {
      container.destroy();
      this.scene.start('ChallengeScene');
    });

    const lbBtn = this.add.text(0, panelH / 2 - 45, '🏆 Leaderboard', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF',
      backgroundColor: '#1A5276', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    container.add(lbBtn);

    lbBtn.on('pointerdown', () => {
      this.scene.start('LeaderboardScene');
    });

    const menuBtn = this.add.text(140, panelH / 2 - 45, 'Menu', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
      backgroundColor: '#34495E', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    container.add(menuBtn);

    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
