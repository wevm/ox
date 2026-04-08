/** Returns the number of seconds in `n` days. */
export function days(n: number) {
  return n * 24 * 60 * 60
}

/** Returns the number of seconds in `n` hours. */
export function hours(n: number) {
  return n * 60 * 60
}

/** Returns the number of seconds in `n` minutes. */
export function minutes(n: number) {
  return n * 60
}

/** Returns the number of seconds in `n` months (30 days). */
export function months(n: number) {
  return n * 30 * 24 * 60 * 60
}

/** Returns the number of seconds in `n` seconds. */
export function seconds(n: number) {
  return n
}

/** Returns the number of seconds in `n` weeks. */
export function weeks(n: number) {
  return n * 7 * 24 * 60 * 60
}

/** Returns the number of seconds in `n` years (365 days). */
export function years(n: number) {
  return n * 365 * 24 * 60 * 60
}
