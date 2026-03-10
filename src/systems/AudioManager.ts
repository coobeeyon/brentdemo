/**
 * AudioManager — procedural sound effects using Web Audio API.
 * No audio files needed; all sounds are synthesized on the fly.
 * Singleton accessed via getAudioManager(scene).
 */

const AUDIO_SETTINGS_KEY = 'icecream_audio';
const REGISTRY_KEY = 'audioManager';

interface AudioSettings {
  sfxVolume: number;   // 0–1
  muted: boolean;
}

const DEFAULT_AUDIO: AudioSettings = {
  sfxVolume: 0.5,
  muted: false,
};

export function loadAudioSettings(): AudioSettings {
  try {
    const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (saved) return { ...DEFAULT_AUDIO, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_AUDIO };
}

export function saveAudioSettings(settings: AudioSettings): void {
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings;

  constructor() {
    this.settings = loadAudioSettings();
  }

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private get vol(): number {
    return this.settings.muted ? 0 : this.settings.sfxVolume;
  }

  // --- Settings API ---

  get sfxVolume(): number { return this.settings.sfxVolume; }
  get muted(): boolean { return this.settings.muted; }

  setVolume(v: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, v));
    saveAudioSettings(this.settings);
  }

  setMuted(m: boolean): void {
    this.settings.muted = m;
    saveAudioSettings(this.settings);
  }

  // --- Tone helpers ---

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const effectiveVol = volume * this.vol;
    if (effectiveVol <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume = 0.1): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const effectiveVol = volume * this.vol;
    if (effectiveVol <= 0) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // --- Sound Effects ---

  /** UI button click — short, crisp tick */
  click(): void {
    this.playTone(800, 0.06, 'square', 0.15);
  }

  /** Purchase / spend money — cash register "ka-ching" */
  purchase(): void {
    const ctx = this.getCtx();
    if (!ctx || this.vol <= 0) return;
    this.playTone(523, 0.08, 'square', 0.2);   // C5
    setTimeout(() => this.playTone(659, 0.08, 'square', 0.2), 60);  // E5
    setTimeout(() => this.playTone(784, 0.12, 'triangle', 0.25), 120); // G5
  }

  /** Customer served successfully — happy chime */
  serve(): void {
    this.playTone(660, 0.1, 'sine', 0.2);  // E5
    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.25), 80); // A5
  }

  /** Customer arrives — subtle door bell */
  customerArrive(): void {
    this.playTone(1200, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(1500, 0.1, 'sine', 0.08), 70);
  }

  /** Customer leaves unhappy — descending tone */
  customerLeave(): void {
    this.playTone(400, 0.15, 'sine', 0.12);
    setTimeout(() => this.playTone(300, 0.2, 'sine', 0.1), 100);
  }

  /** Day start — ascending fanfare */
  dayStart(): void {
    this.playTone(440, 0.12, 'triangle', 0.2);  // A4
    setTimeout(() => this.playTone(554, 0.12, 'triangle', 0.2), 120); // C#5
    setTimeout(() => this.playTone(659, 0.15, 'triangle', 0.25), 240); // E5
    setTimeout(() => this.playTone(880, 0.25, 'triangle', 0.3), 360); // A5
  }

  /** Day end — soft descending close */
  dayEnd(): void {
    this.playTone(659, 0.15, 'sine', 0.2);  // E5
    setTimeout(() => this.playTone(554, 0.15, 'sine', 0.18), 150); // C#5
    setTimeout(() => this.playTone(440, 0.25, 'sine', 0.15), 300); // A4
  }

  /** Error / wrong order — buzzer */
  error(): void {
    this.playTone(200, 0.2, 'sawtooth', 0.15);
    this.playTone(195, 0.2, 'sawtooth', 0.15); // slight detune for roughness
  }

  /** Success / milestone — bright arpeggio */
  success(): void {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 80);
    });
  }

  /** Notification / alert — attention ping */
  notification(): void {
    this.playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(880, 0.1, 'sine', 0.15), 150);
  }

  /** Hire staff — welcoming sound */
  hire(): void {
    this.playTone(440, 0.1, 'triangle', 0.2);
    setTimeout(() => this.playTone(554, 0.1, 'triangle', 0.2), 100);
    setTimeout(() => this.playTone(659, 0.15, 'triangle', 0.25), 200);
  }

  /** Equipment break / warning */
  warning(): void {
    this.playTone(300, 0.15, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(250, 0.2, 'sawtooth', 0.1), 150);
  }

  /** Season / level complete — victory fanfare */
  victory(): void {
    const notes = [523, 659, 784, 880, 1047]; // C5 E5 G5 A5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.25), i * 120);
    });
  }

  /** Game over — sad descend */
  gameOver(): void {
    const notes = [440, 415, 370, 330, 262]; // A4 Ab4 F#4 E4 C4
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.2), i * 180);
    });
  }

  /** Coins / tip received — tinkle */
  coins(): void {
    this.playNoise(0.04, 0.08);
    this.playTone(2000, 0.06, 'sine', 0.12);
    setTimeout(() => {
      this.playNoise(0.03, 0.06);
      this.playTone(2400, 0.05, 'sine', 0.1);
    }, 50);
  }

  /** Research unlock */
  unlock(): void {
    const notes = [392, 494, 587, 784]; // G4 B4 D5 G5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'sine', 0.2), i * 90);
    });
  }
}

/** Get the singleton AudioManager instance from Phaser registry */
export function getAudioManager(scene: Phaser.Scene): AudioManager {
  let mgr = scene.registry.get(REGISTRY_KEY) as AudioManager | undefined;
  if (!mgr) {
    mgr = new AudioManager();
    scene.registry.set(REGISTRY_KEY, mgr);
  }
  return mgr;
}
