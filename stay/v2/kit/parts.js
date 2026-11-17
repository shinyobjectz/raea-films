// A stand-in for the raea app's own comment card. The v2 cut drew the app's composer and pin thread, built from the
// app's source, which isn't public; this draws a plain card of the same size with the same props, so the v2 cut still
// renders. v3, the film as released, draws its own cards (v3/card.tsx) and doesn't use this.
import { createElement as h } from "react";

export const CSS = "";

/** text typed up to `typed` letters; `posted` once sent; `task` "working" while the agent has it */
export function Card({ text, typed, posted, task }) {
  const shown = text.slice(0, typed);
  const box = { width: 288, boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, background: "#1c1c1f", color: "#ececf0",
    font: "13px/1.4 Geist, system-ui, sans-serif", boxShadow: "0 6px 24px rgba(0,0,0,0.35)", border: "1px solid #2e2e33" };
  const caret = posted ? null : h("span", { style: { display: "inline-block", width: 1.5, height: 15, marginLeft: 1, verticalAlign: "-3px", background: "#ececf0" } });
  const field = h("div", { style: { minHeight: 36, whiteSpace: "pre-wrap" } }, shown || (posted ? "" : h("span", { style: { color: "#77777f" } }, "Say what to change")), caret);
  const foot = h("div", { style: { marginTop: 8, fontSize: 11, color: "#9a9aa3" } }, task === "working" ? "Agent working…" : posted ? "Sent" : "Enter to send");
  return h("div", { style: box }, field, foot);
}
