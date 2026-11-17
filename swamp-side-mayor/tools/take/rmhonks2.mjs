import { click, d, pause, vis } from "./tk.mjs"
const p = (await d.ui()).nodes.find((n) => n.visible && /^pending-dismiss-/.test(n.id)); if (p) { await click(p.id); await pause(800) }
