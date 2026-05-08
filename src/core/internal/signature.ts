import * as Bytes from '../Bytes.js'
import type * as Signature from '../Signature.js'

/**
 * Encodes an ox `Signature` as a 64-byte compact noble signature
 * (`r ++ s`, big-endian).
 *
 * @internal
 */
export function toCompactBytes(
  signature: Signature.Signature<boolean>,
): Uint8Array {
  const bytes = new Uint8Array(64)
  bytes.set(Bytes.fromNumber(signature.r, { size: 32 }), 0)
  bytes.set(Bytes.fromNumber(signature.s, { size: 32 }), 32)
  return bytes
}

/**
 * Encodes an ox `Signature` as a 65-byte recoverable noble signature
 * (`recovery ++ r ++ s`, big-endian).
 *
 * @internal
 */
export function toRecoveredBytes(signature: Signature.Signature): Uint8Array {
  const bytes = new Uint8Array(65)
  bytes[0] = signature.yParity
  bytes.set(Bytes.fromNumber(signature.r, { size: 32 }), 1)
  bytes.set(Bytes.fromNumber(signature.s, { size: 32 }), 33)
  return bytes
}

/**
 * Decodes a 65-byte recoverable noble signature (`recovery ++ r ++ s`)
 * into an ox `Signature`.
 *
 * @internal
 */
export function fromRecoveredBytes(bytes: Uint8Array): Signature.Signature {
  return {
    r: Bytes.toBigInt(bytes.subarray(1, 33)),
    s: Bytes.toBigInt(bytes.subarray(33, 65)),
    yParity: bytes[0]!,
  }
}
