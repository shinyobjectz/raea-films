// 08 Find things (2): Search, at the top of the rail: where the libraries go: folders and drives, Apple Photos,
// iCloud Drive (the scratch Mac has none connected; nothing of the person's is shown or picked).
import { cap, chapter, click, hover, key, move, pause, tip } from "./tk.mjs"
chapter("08")
await key("Escape")
await click("rail-home")
await pause(800)
await hover("open-library", 0, { steps: 5 })
await tip()
await cap("144-search-hover", "Pointer on Search, under Everything at the top of the rail")
await click("open-library")
await pause(1500)
await move(830, 640, 3)
await cap("145-search-libraries", "Search: your libraries: folders and drives, Apple Photos, iCloud Drive")
