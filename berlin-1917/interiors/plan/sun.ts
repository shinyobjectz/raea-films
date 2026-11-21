// The sun over Berlin by the day of the year (1-366), on 1917's clocks: CET, and summer time from 16 April to
// 17 September (the Reich kept it 1916-18). Read by plan/hours.ts (what is lit) and plan/home.ts (the long evenings).

const LAT = (52.52 * Math.PI) / 180, LON = 13.4, rad = Math.PI / 180;

/** Sunrise and sunset in hours on 1917's clocks. */
export function sun(day: number): { rise: number; set: number } {
  const decl = 23.44 * rad * Math.sin((2 * Math.PI * (284 + day)) / 365);
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(LAT) * Math.sin(decl)) / (Math.cos(LAT) * Math.cos(decl));
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad / 15;
  // the equation of time, minutes
  const B = (2 * Math.PI * (day - 81)) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const noon = 12 + ((15 - LON) * 4 - eot) / 60 + (day >= 106 && day <= 260 ? 1 : 0);
  return { rise: noon - H, set: noon + H };
}

/** The heating months: stoves lit from mid-October to mid-April. */
export const heating = (day: number) => day >= 288 || day <= 105;
/** 1 January 1917 was a Monday (0 is Sunday). */
export const weekdayOf = (day: number) => day % 7;
/** The long evenings: light in the street until after half past eight (late April to mid-August). */
export const longEvening = (day: number) => sun(day).set > 20.5;
/** Hanukkah's eight days, 1916-18, by day of the year (the lamp is lit from the first evening; 1917: 10-17 December). */
export const hanukkah = (day: number) => day >= 344 && day <= 351;
/** Christmas Eve (24 December) to Epiphany (6 January): the tree stands in the Stube. */
export const christmas = (day: number) => day >= 358 || day <= 6;
