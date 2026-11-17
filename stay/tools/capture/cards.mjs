// Stay's comment cards, from the real app: the item open in Watch, the comment tool, a pin dropped on the frame, the
// comment typed into its composer card; the card alone saved with a clear background (3x) for the film's 3D.
//   node capture-stay-cards.mjs URL OUTDIR "text 1" "text 2" ...
import { chromium } from "@playwright/test"
const [url, out, ...texts] = process.argv.slice(2)
const b = await chromium.launch({ channel: "chrome" })
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 3, colorScheme: "dark" })
p.on("pageerror", (e) => console.log("pageerror", e.message))
const ISOLATE = `body * { visibility: hidden !important; }
[data-testid="inline-composer"], [data-testid="inline-composer"] * { visibility: visible !important; }
html, body { background: transparent !important; }
textarea { caret-color: transparent !important; }`
for (const [i, text] of texts.entries()) {
  await p.goto(url)
  await p.getByTestId("player").waitFor()
  await p.evaluate("document.fonts.ready")
  await p.getByText("Hide", { exact: true }).click({ timeout: 1500 }).catch(() => {})
  await p.keyboard.press("c")
  const o = p.getByTestId("frame-overlay")
  const box = (await o.boundingBox())
  await o.click({ position: { x: box.width * 0.4, y: box.height * 0.4 } })
  await p.getByTestId("inline-input").fill(text)
  await p.waitForTimeout(250)
  const card = (await p.getByTestId("inline-composer").boundingBox())
  const style = await p.addStyleTag({ content: ISOLATE })
  const m = 30
  const f = `${out}/comment-${i + 1}.png`
  await p.screenshot({ path: f, omitBackground: true, clip: { x: card.x - m, y: card.y - m, width: card.width + 2 * m, height: card.height + 2 * m } })
  await style.evaluate((s) => s.remove())
  console.log(f, Math.round(card.width), Math.round(card.height))
}
await b.close()
