// Stay's comment cards as the app really shows them, a state at a time, so the film can play a comment being written:
// the composer just opened on a dropped pin (its placeholder), then the comment a letter at a time, then posted (the
// pin's thread). Every composer state of one comment is the same clip (the full text's card), so they register.
//   node capture-stay-typed.mjs URL OUTDIR "text 1" "text 2" ...   ->  OUTDIR/cN-00.png (empty) .. cN-KK.png, cN-posted.png, cards.json
import { chromium } from "@playwright/test"
import { writeFileSync } from "node:fs"
const [url, out, ...texts] = process.argv.slice(2)
const SCALE = 4, M = 30
const b = await chromium.launch({ channel: "chrome" })
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: SCALE, colorScheme: "dark" })
p.on("pageerror", (e) => console.log("pageerror", e.message))
const isolate = (id) => `body * { visibility: hidden !important; }
[data-testid="${id}"], [data-testid="${id}"] * { visibility: visible !important; }
html, body { background: transparent !important; }
textarea { caret-color: transparent !important; }`
const meta = []
for (const [i, text] of texts.entries()) {
  const n = i + 1
  await p.goto(url)
  await p.getByTestId("player").waitFor()
  await p.evaluate("document.fonts.ready")
  await p.keyboard.press("c")
  const o = p.getByTestId("frame-overlay")
  const box = await o.boundingBox()
  await o.click({ position: { x: box.width * 0.4, y: box.height * 0.4 } })
  const input = p.getByTestId("inline-input")
  await input.fill(text)
  await p.waitForTimeout(250)
  const card = await p.getByTestId("inline-composer").boundingBox()
  const clip = { x: card.x - M, y: card.y - M, width: card.width + 2 * M, height: card.height + 2 * M }
  const style = await p.addStyleTag({ content: isolate("inline-composer") })
  for (let k = 0; k <= text.length; k++) {
    await input.fill(text.slice(0, k))
    await p.waitForTimeout(40)
    await p.screenshot({ path: `${out}/c${n}-${String(k).padStart(2, "0")}.png`, omitBackground: true, clip })
  }
  await style.evaluate((s) => s.remove())
  await input.press("Enter")
  let posted = null
  try {
    const th = p.getByTestId("pin-thread").first()
    await th.waitFor({ timeout: 4000 })
    await p.waitForTimeout(300)
    const tb = await th.boundingBox()
    const s2 = await p.addStyleTag({ content: isolate("pin-thread") })
    await p.screenshot({ path: `${out}/c${n}-posted.png`, omitBackground: true, clip: { x: tb.x - M, y: tb.y - M, width: tb.width + 2 * M, height: tb.height + 2 * M } })
    await s2.evaluate((s) => s.remove())
    posted = { w: Math.round(tb.width + 2 * M), h: Math.round(tb.height + 2 * M) }
  } catch (e) { console.log(`c${n}: no posted thread: ${e.message.split("\n")[0]}`) }
  meta.push({ n, text, states: text.length + 1, w: Math.round(clip.width), h: Math.round(clip.height), margin: M, scale: SCALE, posted })
  console.log(`c${n}`, text.length + 1, "states", Math.round(clip.width), Math.round(clip.height), posted ? "posted" : "")
}
writeFileSync(`${out}/cards.json`, JSON.stringify(meta, null, 1))
await b.close()
