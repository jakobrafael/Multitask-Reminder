// Sound definitions for notification alerts
// Using Web Audio API to generate sounds programmatically

export type SoundType = "none" | "chime" | "bell" | "ping" | "alert" | "gong";

export const SOUND_OPTIONS: { value: SoundType; label: string; description: string }[] = [
  { value: "none", label: "None", description: "No sound" },
  { value: "chime", label: "Chime", description: "Gentle chime" },
  { value: "bell", label: "Bell", description: "Classic bell" },
  { value: "ping", label: "Ping", description: "Quick ping" },
  { value: "alert", label: "Alert", description: "Attention alert" },
  { value: "gong", label: "Gong", description: "Deep gong" },
];

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain: number = 0.3,
  decay: number = 0.5
) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration * decay);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playChime() {
  // Pleasant ascending chime
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.4, "sine", 0.25, 0.8);
    }, i * 150);
  });
}

function playBell() {
  // Classic bell sound with harmonics
  const baseFreq = 440;
  
  playTone(baseFreq, 1.0, "sine", 0.3, 0.3);
  playTone(baseFreq * 2, 0.8, "sine", 0.15, 0.4);
  playTone(baseFreq * 3, 0.6, "sine", 0.1, 0.5);
}

function playPing() {
  // Quick, sharp ping
  playTone(1800, 0.15, "sine", 0.4, 0.9);
  setTimeout(() => {
    playTone(2200, 0.1, "sine", 0.2, 0.9);
  }, 80);
}

function playAlert() {
  // Attention-grabbing dual tone
  [0, 200, 400].forEach((delay) => {
    setTimeout(() => {
      playTone(880, 0.15, "square", 0.15, 0.9);
      setTimeout(() => {
        playTone(660, 0.15, "square", 0.15, 0.9);
      }, 100);
    }, delay);
  });
}

function playGong() {
  // Deep, resonant gong
  const baseFreq = 130.81; // C3
  
  playTone(baseFreq, 2.0, "sine", 0.4, 0.2);
  playTone(baseFreq * 1.5, 1.5, "sine", 0.2, 0.25);
  playTone(baseFreq * 2, 1.2, "sine", 0.15, 0.3);
  playTone(baseFreq * 3, 0.8, "triangle", 0.1, 0.4);
}

export function playSound(sound: SoundType): void {
  if (sound === "none") return;
  
  // Resume audio context if suspended (browser autoplay policy)
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  switch (sound) {
    case "chime":
      playChime();
      break;
    case "bell":
      playBell();
      break;
    case "ping":
      playPing();
      break;
    case "alert":
      playAlert();
      break;
    case "gong":
      playGong();
      break;
  }
}

export function previewSound(sound: SoundType): void {
  playSound(sound);
}
