let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

type SfxStyle = "soft" | "mechanical";

let masterVolume = 0.5;
let sfxEnabled = true;
let sfxStyle: SfxStyle = "soft";

export function setSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
}

export function setSfxVolume(volume: number) {
  masterVolume = volume / 100;
}

export function setSfxStyle(style: string) {
  sfxStyle = style as SfxStyle;
}

function playTone(freq: number, durationMs: number, type: OscillatorType) {
  if (!sfxEnabled || masterVolume <= 0) return;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = masterVolume * 0.3;
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + durationMs / 1000,
  );
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playClickDown() {
  const type: OscillatorType = sfxStyle === "mechanical" ? "triangle" : "sine";
  playTone(800, 60, type);
}

export function playClickUp() {
  const type: OscillatorType = sfxStyle === "mechanical" ? "triangle" : "sine";
  playTone(600, 50, type);
}
