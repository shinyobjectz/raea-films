// The ground's real height round the pit (v4): the scanned bank's top where scripts/bank_height.py measured it, the
// grass's rule beyond that, the water off the bank.
import { bankAt } from "./bank-height";

/** the grass's rule for the bank's top (world.tsx): close to the keys, ~10 cm high round the pit */
export const bankRule = (x: number, z: number) => 0.24 - 0.09 * Math.pow(Math.hypot((x - 0.25) / 2.6, (z - 3.55) / 1.3), 2.5);
export const onBank = (x: number, z: number) => Math.hypot((x - 0.25) / 2.6, (z - 3.55) / 1.3) < 1;
/** what's underfoot at (x, z): the bank's measured top, or the rule, or the water */
export const groundAt = (x: number, z: number) => Math.max(-0.02, bankAt(x, z) ?? (onBank(x, z) ? bankRule(x, z) : -0.02));
