// Original ShadowBid score and UI sound design. No third-party samples.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, ".."),
  sr = 48000,
  seconds = 120,
  frames = sr * seconds;
const left = new Float32Array(frames),
  right = new Float32Array(frames);
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (x) => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};
const chords = [
  [0, 12, [38, 45, 52, 53]],
  [12, 23, [34, 41, 48, 57]],
  [23, 30, [38, 45, 53, 60]],
  [30, 37, [34, 41, 57, 62]],
  [37, 45, [41, 48, 55, 57]],
  [45, 54, [36, 43, 52, 62]],
  [54, 65, [38, 45, 53, 60]],
  [65, 76, [34, 41, 57, 62]],
  [76, 84, [41, 48, 57, 64]],
  [84, 91, [36, 43, 55, 62]],
  [91, 98, [34, 41, 57, 60]],
  [98, 105, [38, 45, 53, 60]],
  [105, 112, [34, 41, 53, 60]],
  [112, 120, [38, 45, 53, 57, 64]],
];
for (const [start, end, notes] of chords) {
  const begin = Math.max(0, Math.floor((start - 1.2) * sr)),
    finish = Math.min(frames, Math.floor((end + 1.8) * sr));
  const frequencies = notes.map(midi);
  for (let i = begin; i < finish; i++) {
    const t = i / sr;
    const env = smooth((t - start + 1.2) / 2) * smooth((end + 1.8 - t) / 2.7);
    const breath = 0.82 + 0.18 * Math.sin(t * 0.54);
    let l = 0,
      r = 0;
    for (let n = 0; n < frequencies.length; n++) {
      const f = frequencies[n],
        phase = t * 2 * Math.PI * f;
      const gain = n === 0 ? 0.023 : 0.014;
      l +=
        (Math.sin(phase) +
          0.16 * Math.sin(phase * 2) +
          0.08 * Math.sin(phase * 3)) *
        gain;
      r +=
        (Math.sin(phase * 1.001 + 0.2) +
          0.16 * Math.sin(phase * 2.001) +
          0.08 * Math.sin(phase * 3)) *
        gain;
    }
    left[i] += l * env * breath;
    right[i] += r * env * breath;
  }
}
// Original sparse arpeggio, gradually introduced after the brand reveal.
const motif = [62, 69, 65, 72, 69, 65, 64, 69];
for (let t = 23, k = 0; t < 116; t += 60 / 78, k++) {
  const f = midi(motif[k % motif.length]),
    gain = t < 37 ? 0.008 : t < 91 ? 0.014 : 0.009;
  for (let j = 0; j < sr * 2 && Math.floor(t * sr) + j < frames; j++) {
    const dt = j / sr,
      index = Math.floor(t * sr) + j;
    const env = (1 - Math.exp(-dt * 180)) * Math.exp(-dt * 3.2);
    const tone =
      (Math.sin(2 * Math.PI * f * dt) +
        0.2 * Math.sin(2 * Math.PI * f * 2.01 * dt)) *
      env *
      gain;
    const pan = k % 2 === 0 ? 0.65 : 0.35;
    left[index] += tone * pan;
    right[index] += tone * (1 - pan);
  }
}
// Subtle airy transition washes and tonal confirmation accents.
let seed = 117;
for (const t of [12, 23, 37, 54, 76, 91, 105, 112]) {
  for (let j = 0; j < sr * 1.2; j++) {
    const i = Math.floor((t - 0.6) * sr) + j;
    if (i < 0 || i >= frames) continue;
    const d = j / sr;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = seed / 4294967296 - 0.5;
    const env = Math.pow(Math.sin((Math.PI * d) / 1.2), 3) * 0.012;
    left[i] += noise * env;
    right[i] -= noise * env * 0.7;
  }
}
for (const t of [46, 61.5, 70, 78.5]) {
  for (let j = 0; j < sr * 0.7; j++) {
    const i = Math.floor(t * sr) + j,
      dt = j / sr;
    const env = (1 - Math.exp(-dt * 150)) * Math.exp(-dt * 7);
    const v =
      (Math.sin(2 * Math.PI * 880 * dt) +
        0.42 * Math.sin(2 * Math.PI * 1320 * dt)) *
      env *
      0.013;
    left[i] += v;
    right[i] += v;
  }
}
for (let i = 0; i < frames; i++) {
  const t = i / sr;
  const fade = smooth(t / 3) * smooth((120 - t) / 4);
  left[i] *= fade;
  right[i] *= fade;
}
const buffer = Buffer.alloc(44 + frames * 4);
buffer.write("RIFF");
buffer.writeUInt32LE(buffer.length - 8, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(2, 22);
buffer.writeUInt32LE(sr, 24);
buffer.writeUInt32LE(sr * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) {
  buffer.writeInt16LE(Math.round(clamp(left[i], -1, 1) * 32767), 44 + i * 4);
  buffer.writeInt16LE(Math.round(clamp(right[i], -1, 1) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(root, "public/audio/original-score.wav"), buffer);
console.log("Original stereo score: 120 seconds, 48 kHz.");
