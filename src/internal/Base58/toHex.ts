import type * as Errors from '../../Errors.js'
import type { Hex } from '../Hex/types.js'

const alphabet = /* __PURE__ */ Object.freeze<Record<string, bigint>>({
  1: 0n,
  2: 1n,
  3: 2n,
  4: 3n,
  5: 4n,
  6: 5n,
  7: 6n,
  8: 7n,
  9: 8n,
  A: 9n,
  B: 10n,
  C: 11n,
  D: 12n,
  E: 13n,
  F: 14n,
  G: 15n,
  H: 16n,
  J: 17n,
  K: 18n,
  L: 19n,
  M: 20n,
  N: 21n,
  P: 22n,
  Q: 23n,
  R: 24n,
  S: 25n,
  T: 26n,
  U: 27n,
  V: 28n,
  W: 29n,
  X: 30n,
  Y: 31n,
  Z: 32n,
  a: 33n,
  b: 34n,
  c: 35n,
  d: 36n,
  e: 37n,
  f: 38n,
  g: 39n,
  h: 40n,
  i: 41n,
  j: 42n,
  k: 43n,
  m: 44n,
  n: 45n,
  o: 46n,
  p: 47n,
  q: 48n,
  r: 49n,
  s: 50n,
  t: 51n,
  u: 52n,
  v: 53n,
  w: 54n,
  x: 55n,
  y: 56n,
  z: 57n,
})

/**
 * Decodes a Base58-encoded string to {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.toHex('2NEpo7TZRRrLZSi2U')
 * // @log: '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The Base58 encoded string.
 * @returns The decoded hex string.
 */
export function Base58_toHex(value: string): Hex {
  let integer = BigInt(0)
  let pad = 0
  let checkPad = true

  for (let i = 0; i < value.length; i++) {
    const char = value[i]!

    // check for leading 1s
    if (checkPad && char === '1') pad++
    else checkPad = false

    // check for invalid characters
    if (typeof alphabet[char] !== 'bigint')
      throw new Error('invalid base58 character: ' + char)

    integer = integer * 58n
    integer = integer + alphabet[char]!
  }

  if (!pad) return `0x${integer.toString(16)}` as Hex
  return `0x${'0'.repeat(pad * 2)}${integer.toString(16)}` as Hex
}

export declare namespace Base58_toHex {
  type ErrorType = Errors.GlobalErrorType
}

Base58_toHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_toHex.ErrorType
