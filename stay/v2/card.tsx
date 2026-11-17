// A comment's card in the film. The cut was drawn with the raea app's own composer and pin thread, built from the
// app's source, which isn't public: kit/parts.js now draws a plain stand-in of the same size.
// It opens at the pin, is typed into a letter a frame-count, posts,
// and shows the agent working. It is drawn 2.4 times the app's size, so the comment's words stand about 3% of the
// frame high: readable on a phone.
import "./kit/env";
import { Card as AppCard, CSS } from "./kit/parts.js";
import { H, W } from "./plan";
import { clamp01 } from "./stage";

export const CARD_SCALE = 2.4, CARD_W = 288 * CARD_SCALE;
/** the card for `text` at seconds `t` since it opened: typing starts at 0.35 s, a letter every `every` s, posted at `sent`, the agent working from 0.4 s after */
export function CommentCard({ text, t, sent, at, every = 0.055 }: { text: string; t: number; sent: number; at: [number, number]; every?: number }) {
  if (t < 0) return null;
  const typed = Math.max(0, Math.min(text.length, Math.floor((t - 0.35) / every) + 1));
  const posted = t >= sent;
  // it folds away 1.5 s after it is posted, once the agent has it
  const gone = clamp01((t - sent - 1.5) / 0.2);
  if (gone >= 1) return null;
  const pop = (1 - (1 - clamp01(t / 0.18)) ** 3) * (1 - gone);
  // beside the pin, kept inside the frame's safe area
  const x = Math.min(W - CARD_W - 0.05 * W, Math.max(0.05 * W, at[0] + 26)), y = Math.min(H - 0.3 * H, Math.max(0.05 * H, at[1] + 18));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${(CARD_SCALE * (0.8 + 0.2 * pop)).toFixed(4)})`, transformOrigin: "0 0", opacity: pop }}>
      {/* the app's stylesheet paints the page's background, which would cover the 3D under the page: clear it again */}
      <style>{CSS + "\nhtml, body, #root { background: transparent !important; background-color: transparent !important; }"}</style>
      <AppCard text={text} typed={t < 0.35 ? 0 : typed} posted={posted} task={t >= sent + 0.4 ? "working" : undefined} />
    </div>
  );
}
