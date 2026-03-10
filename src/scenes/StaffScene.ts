import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ShiftType, StaffSpecialty, SPECIALTY_LABELS, SPECIALTY_ICONS } from '../config/constants';
import { GameState, getGameState, StaffMember } from '../systems/GameState';
import { uiColor, uiColorNum, scaledFontSize } from '../systems/UIUtils';

// Random name pools
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Jamie', 'Dakota', 'Skyler', 'Reese', 'Sage', 'Drew', 'Emery',
  'Kai', 'Rowan', 'Eden', 'Finley', 'Harper', 'Peyton', 'Blake', 'Charlie',
];

const MAX_STAFF = 6;
const HIRE_CANDIDATES = 3;

interface HireCandidate {
  member: StaffMember;
}

const SPECIALTIES = [StaffSpecialty.NONE, StaffSpecialty.SCOOPING, StaffSpecialty.BLENDING, StaffSpecialty.CASHIERING];

function generateStaffMember(): StaffMember {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const speed = Math.ceil(Math.random() * 7) + 1;       // 2-8
  const accuracy = Math.ceil(Math.random() * 7) + 1;    // 2-8
  const friendliness = Math.ceil(Math.random() * 7) + 1; // 2-8
  const avgStat = (speed + accuracy + friendliness) / 3;
  // Specialists cost 10% more in wages
  const specialty = SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)];
  const specialtyMult = specialty === StaffSpecialty.NONE ? 1.0 : 1.1;
  const wage = Math.round((15 + avgStat * 3) * specialtyMult);

  return {
    id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    speed,
    accuracy,
    friendliness,
    morale: 70 + Math.floor(Math.random() * 30), // 70-100
    wage,
    assigned: false,
    shift: ShiftType.OFF,
    consecutiveDaysWorked: 0,
    lowMoraleDays: 0,
    specialty,
  };
}

export class StaffScene extends Phaser.Scene {
  private gameState!: GameState;
  private moneyText!: Phaser.GameObjects.Text;
  private wagesText!: Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private candidates: HireCandidate[] = [];

  constructor() {
    super({ key: 'StaffScene' });
  }

  create(): void {
    this.gameState = getGameState(this);

    // Generate hire candidates
    this.candidates = [];
    for (let i = 0; i < HIRE_CANDIDATES; i++) {
      this.candidates.push({ member: generateStaffMember() });
    }

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelX = GAME_WIDTH / 2 - 360;
    const panelY = 20;
    const panelW = 720;
    const panelH = 660;

    const panel = this.add.graphics();
    panel.fillStyle(0x2C3E50, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 15);

    // Title
    const titleSuffix = this.gameState.franchiseMode ? ` — ${this.gameState.locationName}` : '';
    this.add.text(GAME_WIDTH / 2, panelY + 25, `Staff Management${titleSuffix}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 28), color: '#FFF',
    }).setOrigin(0.5);

    // Balance + wages
    this.moneyText = this.add.text(panelX + 20, panelY + 60, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 16), color: uiColor(this, 'green'),
    });
    this.wagesText = this.add.text(panelX + panelW - 20, panelY + 60, '', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#E67E22',
    }).setOrigin(1, 0);

    // Content area
    this.contentContainer = this.add.container(0, 0);
    this.buildUI(panelX, panelY);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 35, '← Back', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 20), color: '#FFF',
      backgroundColor: '#E74C3C', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeScene());
    this.input.keyboard!.on('keydown-ESC', () => this.closeScene());

    this.updateDisplay();
  }

  private closeScene(): void {
    this.scene.resume('GameplayScene');
    this.scene.stop();
  }

  private buildUI(panelX: number, panelY: number): void {
    const startY = panelY + 90;

    // --- Current Staff Section ---
    this.contentContainer.add(
      this.add.text(panelX + 20, startY, `Your Staff (${this.gameState.loc.staff.length}/${MAX_STAFF})`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF', fontStyle: 'bold',
      })
    );

    // Column headers
    const headerY = startY + 28;
    const hStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#95A5A6' };
    const cols = { name: panelX + 25, spec: panelX + 120, spd: panelX + 190, acc: panelX + 235, fri: panelX + 280, morale: panelX + 340, wage: panelX + 420, status: panelX + 500, action: panelX + 570 };

    this.contentContainer.add(this.add.text(cols.name, headerY, 'NAME', hStyle));
    this.contentContainer.add(this.add.text(cols.spec, headerY, 'SPEC', hStyle));
    this.contentContainer.add(this.add.text(cols.spd, headerY, 'SPD', hStyle));
    this.contentContainer.add(this.add.text(cols.acc, headerY, 'ACC', hStyle));
    this.contentContainer.add(this.add.text(cols.fri, headerY, 'FRI', hStyle));
    this.contentContainer.add(this.add.text(cols.morale, headerY, 'MORALE', hStyle));
    this.contentContainer.add(this.add.text(cols.wage, headerY, 'WAGE', hStyle));
    this.contentContainer.add(this.add.text(cols.status, headerY, 'SHIFT', hStyle));

    if (this.gameState.loc.staff.length === 0) {
      this.contentContainer.add(
        this.add.text(GAME_WIDTH / 2, headerY + 30, 'No staff hired yet', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#7F8C8D',
        }).setOrigin(0.5, 0)
      );
    }

    this.gameState.loc.staff.forEach((member, i) => {
      this.createStaffRow(member, i, headerY + 25, cols);
    });

    // --- Hire Section ---
    const hireY = startY + 30 + 25 + Math.max(this.gameState.loc.staff.length, 1) * 40 + 20;

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x7F8C8D, 0.5);
    sep.lineBetween(panelX + 20, hireY, panelX + 700, hireY);
    this.contentContainer.add(sep);

    this.contentContainer.add(
      this.add.text(panelX + 20, hireY + 10, 'Available Candidates', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 18), color: '#FFF', fontStyle: 'bold',
      })
    );

    this.contentContainer.add(
      this.add.text(panelX + 260, hireY + 14, '(New candidates each day)', {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#7F8C8D',
      })
    );

    // Candidate headers
    const candHeaderY = hireY + 38;
    this.contentContainer.add(this.add.text(cols.name, candHeaderY, 'NAME', hStyle));
    this.contentContainer.add(this.add.text(cols.spec, candHeaderY, 'SPEC', hStyle));
    this.contentContainer.add(this.add.text(cols.spd, candHeaderY, 'SPD', hStyle));
    this.contentContainer.add(this.add.text(cols.acc, candHeaderY, 'ACC', hStyle));
    this.contentContainer.add(this.add.text(cols.fri, candHeaderY, 'FRI', hStyle));
    this.contentContainer.add(this.add.text(cols.wage, candHeaderY, 'WAGE', hStyle));

    this.candidates.forEach((cand, i) => {
      this.createCandidateRow(cand, i, candHeaderY + 20, cols);
    });
  }

  private createStaffRow(
    member: StaffMember,
    index: number,
    startY: number,
    cols: Record<string, number>,
  ): void {
    const y = startY + index * 40;

    // Row bg
    const bg = this.add.graphics();
    bg.fillStyle(index % 2 === 0 ? 0x34495E : 0x2C3E50, 1);
    bg.fillRect(cols.name - 5, y - 2, 680, 36);
    this.contentContainer.add(bg);

    const vStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#FFF' };

    this.contentContainer.add(this.add.text(cols.name, y + 8, member.name, vStyle));
    const spec = member.specialty ?? StaffSpecialty.NONE;
    const specLabel = `${SPECIALTY_ICONS[spec]} ${SPECIALTY_LABELS[spec]}`.trim();
    this.contentContainer.add(this.add.text(cols.spec, y + 8, specLabel, { ...vStyle, fontSize: scaledFontSize(this, 13), color: spec === StaffSpecialty.NONE ? '#7F8C8D' : '#F1C40F' }));
    this.addStatWithBar(cols.spd, y, member.speed);
    this.addStatWithBar(cols.acc, y, member.accuracy);
    this.addStatWithBar(cols.fri, y, member.friendliness);

    // Morale bar
    const moraleW = 60;
    const moraleRatio = member.morale / 100;
    const moraleBg = this.add.graphics();
    moraleBg.fillStyle(0x1A252F, 1);
    moraleBg.fillRoundedRect(cols.morale, y + 10, moraleW, 10, 3);
    this.contentContainer.add(moraleBg);

    const moraleColor = moraleRatio > 0.6 ? uiColorNum(this, 'green') : moraleRatio > 0.3 ? uiColorNum(this, 'yellow') : uiColorNum(this, 'red');
    const moraleFill = this.add.graphics();
    moraleFill.fillStyle(moraleColor, 1);
    moraleFill.fillRoundedRect(cols.morale, y + 10, moraleW * moraleRatio, 10, 3);
    this.contentContainer.add(moraleFill);

    // Morale warning for low morale
    if (member.morale < 30) {
      this.contentContainer.add(this.add.text(cols.morale + moraleW + 4, y + 6, '😞', { fontSize: scaledFontSize(this, 12) }));
    }

    this.contentContainer.add(this.add.text(cols.wage, y + 8, `$${member.wage}/d`, vStyle));

    // Shift display
    const shiftLabels: Record<ShiftType, string> = {
      [ShiftType.OFF]: 'Off',
      [ShiftType.MORNING]: 'AM',
      [ShiftType.AFTERNOON]: 'PM',
      [ShiftType.FULL_DAY]: 'Full',
    };
    const shiftColors: Record<ShiftType, string> = {
      [ShiftType.OFF]: '#95A5A6',
      [ShiftType.MORNING]: '#F1C40F',
      [ShiftType.AFTERNOON]: '#E67E22',
      [ShiftType.FULL_DAY]: '#2ECC71',
    };
    const currentShift = member.shift ?? ShiftType.OFF;
    this.contentContainer.add(this.add.text(cols.status, y + 8, shiftLabels[currentShift], { ...vStyle, color: shiftColors[currentShift] }));

    // Consecutive days indicator
    const daysWorked = member.consecutiveDaysWorked ?? 0;
    if (daysWorked >= 5) {
      this.contentContainer.add(this.add.text(cols.status + 40, y + 8, '😩', { fontSize: scaledFontSize(this, 12) }));
    }

    // Shift cycle button
    const shifts: ShiftType[] = [ShiftType.OFF, ShiftType.MORNING, ShiftType.AFTERNOON, ShiftType.FULL_DAY];
    const nextShift = shifts[(shifts.indexOf(currentShift) + 1) % shifts.length];
    const toggleBtn = this.add.text(cols.action, y + 5, `→ ${shiftLabels[nextShift]}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
      backgroundColor: '#3498DB',
      padding: { x: 10, y: 8 },
    }).setInteractive({ useHandCursor: true });

    toggleBtn.on('pointerdown', () => {
      member.shift = nextShift;
      member.assigned = nextShift !== ShiftType.OFF;
      this.refreshUI();
    });
    this.contentContainer.add(toggleBtn);

    // Train button
    const avgStat = (member.speed + member.accuracy + member.friendliness) / 3;
    const trainCost = Math.round(20 + avgStat * 10);
    const allMaxed = member.speed >= 10 && member.accuracy >= 10 && member.friendliness >= 10;
    const trainBtn = this.add.text(cols.action + 75, y + 5, allMaxed ? 'Maxed' : `Train $${trainCost}`, {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
      backgroundColor: allMaxed ? '#7F8C8D' : '#8E44AD', padding: { x: 8, y: 8 },
    }).setInteractive({ useHandCursor: true });

    if (!allMaxed) {
      trainBtn.on('pointerdown', () => {
        const result = this.gameState.trainStaff(member.id);
        if (result.success) {
          // Show feedback
          const feedback = this.add.text(cols.action + 80, y - 10, `+1 ${result.stat!}!`, {
            fontFamily: 'Arial', fontSize: scaledFontSize(this, 12), color: '#2ECC71', fontStyle: 'bold',
          }).setOrigin(0.5, 0);
          this.tweens.add({
            targets: feedback,
            y: y - 25,
            alpha: 0,
            duration: 1000,
            onComplete: () => feedback.destroy(),
          });
          this.time.delayedCall(400, () => this.refreshUI());
        } else {
          trainBtn.setStyle({ backgroundColor: '#C0392B' });
          this.time.delayedCall(300, () => trainBtn.setStyle({ backgroundColor: '#8E44AD' }));
        }
      });
    }
    this.contentContainer.add(trainBtn);

    // Fire button (moved further right to fit train button)
    const fireBtn = this.add.text(cols.action + 170, y + 5, 'Fire', {
      fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
      backgroundColor: '#E74C3C', padding: { x: 10, y: 8 },
    }).setInteractive({ useHandCursor: true });

    fireBtn.on('pointerdown', () => {
      this.gameState.loc.staff = this.gameState.loc.staff.filter(s => s.id !== member.id);
      this.refreshUI();
    });
    this.contentContainer.add(fireBtn);
  }

  private createCandidateRow(
    cand: HireCandidate,
    index: number,
    startY: number,
    cols: Record<string, number>,
  ): void {
    const y = startY + index * 45;
    const m = cand.member;

    // Row bg
    const bg = this.add.graphics();
    bg.fillStyle(index % 2 === 0 ? 0x34495E : 0x2C3E50, 1);
    bg.fillRect(cols.name - 5, y - 2, 680, 40);
    this.contentContainer.add(bg);

    const vStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: '#FFF' };

    this.contentContainer.add(this.add.text(cols.name, y + 10, m.name, vStyle));
    const spec = m.specialty ?? StaffSpecialty.NONE;
    const specLabel = `${SPECIALTY_ICONS[spec]} ${SPECIALTY_LABELS[spec]}`.trim();
    this.contentContainer.add(this.add.text(cols.spec, y + 10, specLabel, { ...vStyle, fontSize: scaledFontSize(this, 13), color: spec === StaffSpecialty.NONE ? '#7F8C8D' : '#F1C40F' }));
    this.addStatWithBar(cols.spd, y, m.speed);
    this.addStatWithBar(cols.acc, y, m.accuracy);
    this.addStatWithBar(cols.fri, y, m.friendliness);
    this.contentContainer.add(this.add.text(cols.wage, y + 10, `$${m.wage}/d`, vStyle));

    // Hire button
    if (this.gameState.loc.staff.length < MAX_STAFF) {
      const hireBtn = this.add.text(cols.action, y + 7, `Hire ($${m.wage * 3} signing)`, {
        fontFamily: 'Arial', fontSize: scaledFontSize(this, 14), color: '#FFF',
        backgroundColor: '#27AE60', padding: { x: 12, y: 8 },
      }).setInteractive({ useHandCursor: true });

      hireBtn.on('pointerdown', () => {
        const signingBonus = m.wage * 3;
        if (this.gameState.loc.money >= signingBonus) {
          this.gameState.loc.money -= signingBonus;
          this.gameState.loc.dailyExpenses += signingBonus;
          this.gameState.loc.staff.push(m);
          this.candidates = this.candidates.filter(c => c !== cand);
          this.refreshUI();
        } else {
          hireBtn.setStyle({ backgroundColor: '#C0392B' });
          this.time.delayedCall(300, () => hireBtn.setStyle({ backgroundColor: '#27AE60' }));
        }
      });
      this.contentContainer.add(hireBtn);
    } else {
      this.contentContainer.add(
        this.add.text(cols.action, y + 10, 'Staff full', {
          fontFamily: 'Arial', fontSize: scaledFontSize(this, 13), color: '#7F8C8D',
        })
      );
    }
  }

  /** Draw a stat number with a small progress bar underneath */
  private addStatWithBar(x: number, rowY: number, stat: number): void {
    const vStyle = { fontFamily: 'Arial', fontSize: scaledFontSize(this, 15), color: this.statColor(stat) };
    this.contentContainer.add(this.add.text(x, rowY + 3, `${stat}`, vStyle));

    const barW = 30;
    const barH = 4;
    const barY = rowY + 24;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1A252F, 1);
    barBg.fillRoundedRect(x, barY, barW, barH, 2);
    this.contentContainer.add(barBg);

    const ratio = stat / 10;
    const color = stat >= 7 ? uiColorNum(this, 'green') : stat >= 4 ? uiColorNum(this, 'yellow') : uiColorNum(this, 'red');
    const barFill = this.add.graphics();
    barFill.fillStyle(color, 1);
    barFill.fillRoundedRect(x, barY, barW * ratio, barH, 2);
    this.contentContainer.add(barFill);
  }

  private statColor(stat: number): string {
    if (stat >= 7) return '#2ECC71';
    if (stat >= 4) return '#F39C12';
    return '#E74C3C';
  }

  private refreshUI(): void {
    this.contentContainer.destroy();
    this.contentContainer = this.add.container(0, 0);
    this.buildUI(GAME_WIDTH / 2 - 360, 20);
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.moneyText.setText(`Balance: $${this.gameState.loc.money.toFixed(2)}`);
    const totalWages = this.gameState.loc.staff.reduce((sum, s) => sum + s.wage, 0);
    this.wagesText.setText(`Daily wages: $${totalWages}`);
  }
}
