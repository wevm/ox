/** @internal */
export const length = 42

const ZERO = 48 // '0'
const NINE = 57 // '9'
const A_UPPER = 65 // 'A'
const F_UPPER = 70 // 'F'
const A_LOWER = 97 // 'a'
const F_LOWER = 102 // 'f'
const X_LOWER = 120 // 'x'

/**
 * Combined shape + lowercase classification for an Ethereum address string.
 * Avoids the regex / try-catch / error-allocation overhead in the hot path
 * and avoids a second pass for callers that need both pieces of metadata
 * (e.g. strict validation).
 *
 * - `0` = invalid shape (not `0x[0-9a-fA-F]{40}`)
 * - `1` = valid shape, all-lowercase hex body (no checksum to verify)
 * - `2` = valid shape, contains at least one `A-F` upper char
 *
 * @internal
 */
export function classify(value: string): 0 | 1 | 2 {
  if (typeof value !== 'string' || value.length !== length) return 0
  if (value.charCodeAt(0) !== ZERO || value.charCodeAt(1) !== X_LOWER) return 0
  let hasUpper = false
  for (let i = 2; i < length; i++) {
    const code = value.charCodeAt(i)
    if (code >= ZERO && code <= NINE) continue
    if (code >= A_LOWER && code <= F_LOWER) continue
    if (code >= A_UPPER && code <= F_UPPER) {
      hasUpper = true
      continue
    }
    return 0
  }
  return hasUpper ? 2 : 1
}

/**
 * Manual ASCII shape check for an Ethereum address string. Returns `true`
 * when `value` has the shape `0x[0-9a-fA-F]{40}`. Does not verify checksum
 * casing.
 *
 * @internal
 */
export function hasShape(value: string): boolean {
  return classify(value) !== 0
}
