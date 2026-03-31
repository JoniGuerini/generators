let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

let masterVolume = 0.5;
let sfxEnabled = true;

export function setSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
}

export function setSfxVolume(volume: number) {
  masterVolume = volume / 100;
}

function playSnap(freqStart: number, freqEnd: number, durationMs: number) {
  if (!sfxEnabled || masterVolume <= 0) return;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();
  const t = ctx.currentTime;
  const dur = durationMs / 1000;

  const bufferSize = Math.ceil(ctx.sampleRate * 0.008);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(masterVolume * 0.25, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
  noiseSrc.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSrc.start(t);
  noiseSrc.stop(t + 0.01);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freqStart, t + 0.003);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  gain.gain.setValueAtTime(masterVolume * 0.2, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t + 0.003);
  osc.stop(t + dur);
}

export function playClickDown() {
  playSnap(1400, 600, 0.045);
}

export function playClickUp() {
  playSnap(900, 1200, 0.04);
}
