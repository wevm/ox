import * as Bytes from '../Bytes.js'
import type * as Errors from '../Errors.js'
import * as Hex from '../Hex.js'

/** @internal */
export const integerToAlphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/** @internal */
export const alphabetToInteger = /* __PURE__ */ Object.freeze<
  Record<string, bigint>
>({
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

/** @internal */
export function from(value: Hex.Hex | Bytes.Bytes) {
  const bytes = Bytes.from(value)
  if (bytes.length === 0) return ''

  let integer = (() => {
    let hex = value
    if (value instanceof Uint8Array) hex = Hex.fromBytes(bytes)
    return BigInt(hex as string)
  })()

  // Divide by 58^9, the largest power of 58 below 2^53, so each BigInt
  // division yields nine digits that number arithmetic can split.
  let result = ''
  while (integer > 0n) {
    let remainder = Number(integer % 7_427_658_739_644_928n)
    integer /= 7_427_658_739_644_928n
    // Every chunk but the most significant one is zero-padded to nine digits.
    for (let i = 0; i < 9 && (remainder > 0 || integer > 0n); i++) {
      result = integerToAlphabet[remainder % 58] + result
      remainder = Math.floor(remainder / 58)
    }
  }

  // Each leading zero byte encodes as a leading '1'.
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++

  return '1'.repeat(zeros) + result
}

/** @internal */
export declare namespace from {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
