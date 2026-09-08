// Web Audio API Synthesizer for referee whistle and substitution chimes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a referee whistle using dual square/sine oscillators
 */
export function playWhistle() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Whistle burst 1
  playWhistleBurst(ctx, now, 0.25);
  // Whistle burst 2 (longer)
  playWhistleBurst(ctx, now + 0.35, 0.6);
}

function playWhistleBurst(ctx: AudioContext, startTime: number, duration: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(2600, startTime);
  osc1.frequency.linearRampToValueAtTime(2850, startTime + duration * 0.5);
  osc1.frequency.linearRampToValueAtTime(2600, startTime + duration);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(2900, startTime);
  osc2.frequency.linearRampToValueAtTime(3100, startTime + duration * 0.5);
  osc2.frequency.linearRampToValueAtTime(2900, startTime + duration);

  // Modulation for whistle warble
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(35, startTime); // 35Hz warble
  lfoGain.gain.setValueAtTime(150, startTime);
  lfo.connect(osc1.frequency);
  lfo.connect(osc2.frequency);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.04);
  gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  lfo.start(startTime);
  osc1.start(startTime);
  osc2.start(startTime);

  lfo.stop(startTime + duration);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
}

/**
 * Synthesizes a friendly ascending 3-tone chime for substitution reminders
 */
export function playSubChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6
  const noteDuration = 0.15;

  notes.forEach((freq, index) => {
    const startTime = now + index * noteDuration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.4);
  });
}
