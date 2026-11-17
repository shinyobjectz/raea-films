// Stay's screens of the raea app, from the real app on the Stay demo world (the film in Watch): each a whole window,
// 16:10 like the film's screen, 2x.  node capture-stay-screens.mjs BASE OUTDIR
import { chromium } from "@playwright/test"
const [base, out] = process.argv.slice(2)
const b = await chromium.launch({ channel: "chrome" })
let p
// each shot in a fresh browser (no state carried from the one before), the app's first-run notices dismissed
async function open(item) {
  if (p) await p.context().close()
  p = await (await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, colorScheme: "dark" })).newPage()
  p.on("pageerror", (e) => console.log("pageerror", e.message))
  await p.goto(`${base}/#/feed/f-stay-all/${item}`)
  await p.getByTestId("player").waitFor()
  await p.evaluate("document.fonts.ready")
  await p.waitForTimeout(600)
  await p.getByText("Hide", { exact: true }).click({ timeout: 1000 }).catch(() => {})
  await p.getByRole("button", { name: "Close", exact: true }).click({ timeout: 1000 }).catch(() => {})
}
async function notes(open) {
  const want = open ? "Show notes" : "Hide notes"
  await p.getByRole("button", { name: want }).click({ timeout: 1000 }).catch(() => {})
  if (open) await p.getByText(/^Show \d+ resolved$/).click({ timeout: 1500 }).catch(() => {})
}
async function seek(t) {
  const s = p.getByRole("slider", { name: "Timeline" }).first()
  const max = Number(await s.getAttribute("aria-valuemax"))
  const box = await s.boundingBox()
  await p.mouse.click(box.x + (box.width * t) / max, box.y + box.height / 2)
  await p.waitForFunction(() => { const v = document.querySelector("video"); return v && v.readyState >= 2 && !v.seeking })
  await p.waitForTimeout(400)
  return Number(await s.getAttribute("aria-valuenow"))
}
const shots = [
  // the film so far: the sea's frame in the viewer, comment 1 resolved in its thread in the notes rail
  { name: "watch-sea", item: "i-stay-v2", t: 32.2, notes: true },
  // a canyon frame in the viewer, the comment tool on, where the cursor pins comment 2
  { name: "watch-canyon", item: "i-stay-v2", t: 39.3, comment: true, notes: false },
  // the timeline: all six comments from the film, resolved
  { name: "timeline", item: "i-stay-v7", t: 71.8, notes: true },
]
for (const s of shots) {
  await open(s.item)
  const at = await seek(s.t)
  await notes(!!s.notes)
  if (s.comment) await p.keyboard.press("c")
  await p.mouse.move(1599, 999)
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${out}/${s.name}.png` })
  console.log(`${out}/${s.name}.png at ${at}`)
}
// the feed itself: the project's list of what has been made and said (11-11: "more cuts of the platform and what you can
// do in terms of interacting and seeing a feed of things")
try {
  if (p) await p.context().close()
  p = await (await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, colorScheme: "dark" })).newPage()
  await p.goto(`${base}/#/feed/f-stay-all`)
  await p.evaluate("document.fonts.ready")
  await p.waitForTimeout(1500)
  await p.getByText("Hide", { exact: true }).click({ timeout: 1000 }).catch(() => {})
  await p.getByRole("button", { name: "Close", exact: true }).click({ timeout: 1000 }).catch(() => {})
  await p.mouse.move(1599, 999)
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${out}/feed.png` })
  console.log(`${out}/feed.png`)
} catch (e) { console.log("no feed capture:", String(e).slice(0, 200)) }
await b.close()
