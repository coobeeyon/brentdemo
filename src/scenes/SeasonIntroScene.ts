import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SEASON_NARRATIVES } from '../config/constants';
import { scaledFontSize } from '../systems/UIUtils';
import { getAudioManager } from '../systems/AudioManager';

export class SeasonIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SeasonIntroScene' });
  }

  create(): void {
    const season: number = this.registry.get('introSeason') ?? 1;
    const narrative = SEASON_NARRATIVES.find(n => n.season === season);
    if (!narrative) {
      this.scene.stop();
      this.scene.resume('GameplayScene');
      return;
    }

    const audio = getAudioManager(this);
    audio.notification();

    // Full-screen dark backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const panelW = 560;
    const panelH = 460;
    const panelX = cx - panelW / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;

    // Panel background with themed border
    const seasonColors = [0x8B4513, 0x1E90FF, 0x2F4F4F, 0xDAA520, 0x4B0082];
    const borderColor = seasonColors[season - 1] ?? 0x555555;

    const panel = this.add.graphics();
    panel.fillStyle(0x1A1A2E, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(3, borderColor, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    // All text elements that will fade in
    const fadeElements: Phaser.GameObjects.Text[] = [];
    let y = panelY + 24;

    // Chapter title
    const title = this.add.text(cx, y, narrative.intro.title, {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 22),
      color: '#F1C40F',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setAlpha(0);
    fadeElements.push(title);
    y += 36;

    // Setting subtitle
    const setting = this.add.text(cx, y, narrative.intro.setting, {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 14),
      color: '#7F8C8D',
      fontStyle: 'italic',
    }).setOrigin(0.5, 0).setAlpha(0);
    fadeElements.push(setting);
    y += 32;

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, borderColor, 0.5);
    divider.lineBetween(panelX + 40, y, panelX + panelW - 40, y);
    divider.setAlpha(0);
    y += 16;

    // Story paragraphs
    const textMargin = 36;
    for (const paragraph of narrative.intro.paragraphs) {
      const pText = this.add.text(cx, y, paragraph, {
        fontFamily: 'Arial',
        fontSize: scaledFontSize(this, 14),
        color: '#D5D8DC',
        wordWrap: { width: panelW - textMargin * 2 },
        lineSpacing: 3,
      }).setOrigin(0.5, 0).setAlpha(0);
      fadeElements.push(pText);
      y += pText.height + 14;
    }

    // Tip box
    y += 4;
    const tipBg = this.add.graphics();
    const tipPadding = 10;
    const tipText = this.add.text(cx, y + tipPadding, `Tip: ${narrative.intro.tip}`, {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 12),
      color: '#F39C12',
      wordWrap: { width: panelW - textMargin * 2 - tipPadding * 2 },
      lineSpacing: 2,
    }).setOrigin(0.5, 0).setAlpha(0);

    const tipBoxY = y;
    const tipBoxH = tipText.height + tipPadding * 2;
    tipBg.fillStyle(0x2C3E50, 0.6);
    tipBg.fillRoundedRect(panelX + textMargin, tipBoxY, panelW - textMargin * 2, tipBoxH, 8);
    tipBg.setAlpha(0);

    fadeElements.push(tipText);

    // Continue button at bottom of panel
    const btnY = panelY + panelH - 44;
    const continueBtn = this.add.text(cx, btnY, 'Begin Season  \u25B6', {
      fontFamily: 'Arial',
      fontSize: scaledFontSize(this, 20),
      color: '#FFFFFF',
      backgroundColor: '#27AE60',
      padding: { x: 24, y: 8 },
    }).setOrigin(0.5, 0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#2ECC71' }));
    continueBtn.on('pointerout', () => continueBtn.setStyle({ backgroundColor: '#27AE60' }));
    continueBtn.on('pointerdown', () => {
      audio.click();
      this.scene.stop();
      this.scene.resume('GameplayScene');
    });

    // Staggered fade-in animation
    const baseDelay = 300;
    const stagger = 400;

    fadeElements.forEach((el, i) => {
      this.tweens.add({
        targets: el,
        alpha: 1,
        y: el.y,
        duration: 600,
        delay: baseDelay + i * stagger,
        ease: 'Power2',
      });
    });

    // Fade in divider and tip background
    this.tweens.add({
      targets: divider,
      alpha: 1,
      duration: 400,
      delay: baseDelay + 2 * stagger,
    });

    this.tweens.add({
      targets: tipBg,
      alpha: 1,
      duration: 400,
      delay: baseDelay + (fadeElements.length - 1) * stagger,
    });

    // Continue button fades in last
    this.tweens.add({
      targets: continueBtn,
      alpha: 1,
      duration: 500,
      delay: baseDelay + fadeElements.length * stagger,
    });

    // Allow keyboard continue after button appears
    this.time.delayedCall(baseDelay + fadeElements.length * stagger + 300, () => {
      this.input.keyboard?.on('keydown-SPACE', () => {
        audio.click();
        this.scene.stop();
        this.scene.resume('GameplayScene');
      });
      this.input.keyboard?.on('keydown-ENTER', () => {
        audio.click();
        this.scene.stop();
        this.scene.resume('GameplayScene');
      });
    });
  }
}
