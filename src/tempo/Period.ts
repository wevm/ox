/**
 * Returns the number of seconds in `n` days.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.days(1) // 86400
 * ```
 */
export function days(n: number) {
  return n * 24 * 60 * 60
}

/**
 * Returns the number of seconds in `n` hours.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.hours(2) // 7200
 * ```
 */
export function hours(n: number) {
  return n * 60 * 60
}

/**
 * Returns the number of seconds in `n` minutes.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.minutes(5) // 300
 * ```
 */
export function minutes(n: number) {
  return n * 60
}

/**
 * Returns the number of seconds in `n` months (30 days).
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.months(1) // 2592000
 * ```
 */
export function months(n: number) {
  return n * 30 * 24 * 60 * 60
}

/**
 * Returns the number of seconds in `n` seconds.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.seconds(30) // 30
 * ```
 */
export function seconds(n: number) {
  return n
}

/**
 * Returns the number of seconds in `n` weeks.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.weeks(1) // 604800
 * ```
 */
export function weeks(n: number) {
  return n * 7 * 24 * 60 * 60
}

/**
 * Returns the number of seconds in `n` years (365 days).
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.years(1) // 31536000
 * ```
 */
export function years(n: number) {
  return n * 365 * 24 * 60 * 60
}
