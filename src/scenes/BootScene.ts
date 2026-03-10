import Phaser from 'phaser';
import { loadSettings } from './SettingsScene';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xF5A9B8, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 8);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Placeholder: generate basic textures programmatically until we have real assets
    this.createPlaceholderTextures();
  }

  create(): void {
    // Load accessibility settings into registry for all scenes
    this.registry.set('gameSettings', loadSettings());
    this.scene.start('MainMenuScene');
  }

  private createPlaceholderTextures(): void {
    // Ice cream scoop textures for all flavors
    const scoopGfx = this.make.graphics({ x: 0, y: 0 });
    const flavorColors: Record<string, number> = {
      vanilla: 0xFFF8DC,
      chocolate: 0x8B4513,
      strawberry: 0xFFB6C1,
      lemon_sorbet: 0xFFF44F,
      mint_chip: 0x98FF98,
      cookies_cream: 0xE8DCC8,
      mango: 0xFFBE4F,
      pistachio: 0x93C572,
      salted_caramel: 0xC68E17,
      lavender: 0xB57EDC,
      matcha: 0x7BC67E,
      rocky_road: 0x6B3A2A,
      butter_pecan: 0xDEB887,
      cookie_dough: 0xD2B48C,
      coffee: 0x6F4E37,
      coconut: 0xFFFAFA,
      raspberry: 0xE30B5C,
      peanut_butter: 0xC19A6B,
      birthday_cake: 0xFFC1CC,
      caramel_swirl: 0xDAA520,
      blueberry: 0x6A5ACD,
    };

    for (const [id, color] of Object.entries(flavorColors)) {
      scoopGfx.clear();
      scoopGfx.fillStyle(color);
      scoopGfx.fillCircle(16, 16, 14);
      scoopGfx.generateTexture(`scoop_${id}`, 32, 32);
    }

    // Cone
    scoopGfx.clear();
    scoopGfx.fillStyle(0xDEB887);
    scoopGfx.fillTriangle(8, 0, 24, 0, 16, 40);
    scoopGfx.generateTexture('cone', 32, 40);

    // Customer placeholder (simple colored circle)
    scoopGfx.clear();
    scoopGfx.fillStyle(0x4A90D9);
    scoopGfx.fillCircle(16, 16, 14);
    scoopGfx.fillStyle(0xFFDBAC);
    scoopGfx.fillCircle(16, 8, 8);
    scoopGfx.generateTexture('customer', 32, 32);

    // Staff placeholder
    scoopGfx.clear();
    scoopGfx.fillStyle(0xFF6B6B);
    scoopGfx.fillCircle(16, 16, 14);
    scoopGfx.fillStyle(0xFFDBAC);
    scoopGfx.fillCircle(16, 8, 8);
    scoopGfx.generateTexture('staff', 32, 32);

    // Store counter
    scoopGfx.clear();
    scoopGfx.fillStyle(0x8B7355);
    scoopGfx.fillRect(0, 0, 200, 30);
    scoopGfx.generateTexture('counter', 200, 30);

    scoopGfx.destroy();
  }
}
