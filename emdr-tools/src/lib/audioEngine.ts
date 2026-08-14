import type { AudioSound, Side } from './types';

/**
 * Stereo bilateral audio via Web Audio API.
 * Therapist mute silences local output while remote client still receives cues via their own engine.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private muted = true;
  private sound: AudioSound = 'soft-click';
  private lastSide: Side | null = null;

  async ensure(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  setMuteTherapist(v: boolean): void {
    this.muted = v;
  }

  setSound(s: AudioSound): void {
    this.sound = s;
  }

  /** Call on side change from BlsEngine */
  async onSide(side: Side): Promise<void> {
    if (!this.enabled || this.muted) return;
    if (this.lastSide === side) return;
    this.lastSide = side;
    await this.ensure();
    this.play(side);
  }

  reset(): void {
    this.lastSide = null;
  }

  private play(side: Side): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const pan = side === 'L' ? -1 : 1;
    const now = ctx.currentTime;

    if (this.sound === 'soft-click') {
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const env = Math.exp(-i / (data.length * 0.18));
        data[i] = (Math.random() * 2 - 1) * env * 0.45;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.35;
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

    if (this.sound === 'tone') {
      osc.type = 'sine';
      osc.frequency.value = side === 'L' ? 440 : 523.25;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      // pulse
      osc.type = 'triangle';
      osc.frequency.value = 180;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  async dispose(): Promise<void> {
    if (this.ctx) {
      await this.ctx.close();
      this.ctx = null;
    }
  }
}
