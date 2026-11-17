// v9 (6b): the Source tab again once the project's folder holds what the take's agent made (assets/glb: Goose's
// models and their renders; compositions/goose.json), copied from the first take's project. Captures 252-253.
import { cap, chapter, click, hover, move, pause, tip, d } from "./tk.mjs"
chapter("v9-06")
await hover("shell-tab-source", 0, { steps: 4 })
await tip()
await cap("252-tab-source-hover", "Pointer on the panel's Source tab")
await click("shell-tab-source")
await pause(1800)
await move(1370, 420, 3)
await cap("253-tab-source", "Source: the project's files, Goose's models and renders")
await click("shell-tab-feed")
await pause(800)
