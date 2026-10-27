import { KokoroTTS } from "kokoro-js";
import { env } from "@huggingface/transformers";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
env.cacheDir = path.join(root, ".cache/models");
const scenes = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/narration.json")),
);
console.log("Loading Apache-2.0 Kokoro model locally.");
const tts = await KokoroTTS.from_pretrained(
  "onnx-community/Kokoro-82M-v1.0-ONNX",
  {
    dtype: "q8",
    device: "cpu",
    session_options: { intra_op_num_threads: 2, inter_op_num_threads: 1 },
  },
);
const voice = "af_heart";
// Warm, clear synthetic English voice; no person-specific voice cloning.
for (const scene of scenes) {
  for (let index = 0; index < scene.lines.length; index++) {
    const target = path.join(root, "public/audio", `${scene.id}-${index}.wav`);
    if (fs.existsSync(target)) {
      console.log("Reusing", scene.id, index);
      continue;
    }
    const text = scene.lines[index]
      .replaceAll("ShadowBid", "Shadow Bid")
      .replaceAll("DNS", "D N S");
    const audio = await tts.generate(text, { voice, speed: 0.98 });
    await audio.save(target);
    console.log(
      "Narration ready:",
      scene.id,
      index,
      (audio.audio.length / audio.sampling_rate).toFixed(2),
      "seconds",
    );
  }
}
