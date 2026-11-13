import type { AudioSound, Side } from '../../types/room';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private muted = false;
  private volume = 0.45;
  private sound: AudioSound = 'soft-click';
  private lastSide: Side | null = null;
  private unsupported = false;

  get isUnsupported(): boolean {
    return this.unsupported;
  }

  async ensure(): Promise<boolean> {
    if (this.unsupported) return false;
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) {
          this.unsupported = true;
          return false;
        }
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    } catch {
      this.unsupported = true;
      return false;
    }
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  setMuted(v: boolean): void {
    this.muted = v;
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
  }

  setSound(s: AudioSound): void {
    this.sound = s;
  }

  async onSide(side: Side): Promise<void> {
    if (!this.enabled || this.muted) return;
    if (this.lastSide === side) return;
    this.lastSide = side;
    const ok = await this.ensure();
    if (!ok) return;
    this.play(side);
  }

  /** Audio-only tick when visual is off — call on a timer aligned to Hz */
  async tickSide(side: Side): Promise<void> {
    await this.onSide(side);
  }

  reset(): void {
    this.lastSide = null;
  }

  private play(side: Side): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const pan = side === 'L' ? -1 : 1;
    const now = ctx.currentTime;
    const vol = this.volume;

    if (this.sound === 'soft-click') {
      const len = Math.floor(ctx.sampleRate * 0.028);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const env = Math.exp(-i / (data.length * 0.2));
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.4 * vol;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      src.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
      src.start(now);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    if (this.sound === 'soft-tone') {
      osc.type = 'sine';
      osc.frequency.value = side === 'L' ? 392 : 494;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18 * vol, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      osc.type = 'triangle';
      osc.frequency.value = 165;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22 * vol, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  async dispose(): Promise<void> {
    if (this.ctx) {
      await this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}
