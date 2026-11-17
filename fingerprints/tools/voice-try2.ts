// the director on v1 (11-13): "the VO is too deep and slow, it could be faster". Four voices read the same two lines with a
// brisker direction at speed 1.1, for him to pick from: his narrator at the new pace, and three less deep ones from
// Fish's library (none cloned from a real person or a character). FISH_API_KEY injected at run time only.
import { writeFileSync } from "node:fs";
const TEXT = "raea's Fingerprint learns that touch: your eye for a good cut, written down from what you already do. Approve a cut, and it learns what you like.";
const DIRECTION = "[cinematic and confident, with energy and forward momentum; a brisk pace, crisp phrasing, short pauses]";
const VOICES: [string, string][] = [
  ["deep-faster", "ab0a257bb27f46a0aa3ed176d8fc0230"],
  ["adrian", "bf322df2096a46f18c579d0baa36f41d"],
  ["slax", "c5f56a6cc2ec4fa8920cb4c5889a3fb7"],
  ["sarah", "933563129e564b19a115bedd57b7406a"],
];
for (const [name, id] of VOICES) {
  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.FISH_API_KEY}`, "content-type": "application/json", model: "drama-3" },
    body: JSON.stringify({ reference_id: id, format: "mp3", prosody: { speed: 1.1 }, text: `${DIRECTION} ${TEXT}` }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  writeFileSync(`media/voice-thermal/try2/${name}.mp3`, Buffer.from(await res.arrayBuffer()));
  console.log("voiced", name);
}
