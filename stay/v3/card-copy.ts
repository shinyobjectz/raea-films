// The end card photocopied, the intro's copier once more to close the film (the director, 11-12: "can you use the photocopier
// effect for the outro too? or the end card"). Once raea.io is typed, the copier's lamp sweeps across the card left to
// right and behind it the card is its photocopy, toner black and white with grain and scan streaks; the exposure
// flashes at the end of the sweep and the copy holds to the fade. tools/card-copy.sh makes it from the card's render;
// tools/sound.sh lays the intro's copier take (media/foley/lock/intro.wav) from its relay on, its whir under the sweep
// and its clunk on the flash.
/** in the card's own seconds: when the lamp starts across, and how long it takes */
export const COPY = { at: 4.3, sweep: 1.0 };
/** where in the intro's copier take its relay starts (its whir 0.65-1.6 s, its clunk about 1.75 s) */
export const COPY_SOUND_FROM = 0.6;
