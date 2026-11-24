import { bytesToHex, hexToBytes } from './codec/hex.js'

/**
 * Curve constants, inlined so that modules needing nothing but an order do not
 * pull a curve implementation into the bundle.
 *
 * These are fixed by the curve specifications and are asserted against
 * `@noble/curves` in `src/core/_test/curves.test.ts`.
 *
 * @internal
 */

/**
 * Order of the secp256r1 (P-256) curve.
 *
 * @see https://www.secg.org/sec2-v2.pdf
 * @internal
 */
export const p256N =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n

/** Order of the secp256k1 curve. @internal */
export const secp256k1N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/**
 * Reduces a uniform random seed to a 32-byte big-endian secret key in
 * `1..order - 1`, as noble's `mapHashToField` does with a seed of
 * `getMinHashLength(order)` bytes or more. Noble's measures the order's bit
 * length one bit at a time, twice per call, which costs several times the
 * reduction.
 *
 * @internal
 */
export function mapToSecretKey(seed: Uint8Array, order: bigint): Uint8Array {
  const key = (BigInt(bytesToHex(seed)) % (order - 1n)) + 1n
  return hexToBytes(`0x${key.toString(16).padStart(64, '0')}`)
}
