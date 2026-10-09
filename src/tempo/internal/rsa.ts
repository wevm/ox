// Textbook RSA public-key operations over bigints, so verification is synchronous and needs no
// WebCrypto. Public keys and signatures are public, so constant time is not needed.

import * as Bytes from '../../core/Bytes.js'

/**
 * Computes `base^exponent mod modulus`.
 *
 * @internal
 */
export function modPow(
  base: bigint,
  exponent: bigint,
  modulus: bigint,
): bigint {
  let result = 1n
  let b = base % modulus
  let e = exponent
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus
    b = (b * b) % modulus
    e >>= 1n
  }
  return result
}

/**
 * Applies the public key to a signature, `signature^exponent mod modulus`, as `k` big-endian
 * bytes, where `k` is the modulus's size. Returns `undefined` unless `0 < signature < modulus`.
 *
 * @internal
 */
export function open(options: {
  exponent: bigint
  modulus: Uint8Array
  signature: Uint8Array
}): Uint8Array | undefined {
  const n = Bytes.toBigInt(options.modulus)
  const s = Bytes.toBigInt(options.signature)
  if (s === 0n || s >= n) return undefined
  return Bytes.fromNumber(modPow(s, options.exponent, n), {
    size: options.modulus.length,
  })
}

// `DigestInfo` prefix of SHA-256 in EMSA-PKCS1-v1_5 (RFC 8017 section 9.2, note 1).
const sha256DigestInfo = [
  0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04,
  0x02, 0x01, 0x05, 0x00, 0x04, 0x20,
]

/**
 * Verifies an RSASSA-PKCS1-v1_5 signature over a SHA-256 digest.
 *
 * @internal
 */
export function verifyPkcs1Sha256(options: {
  digest: Uint8Array
  exponent: bigint
  modulus: Uint8Array
  signature: Uint8Array
}): boolean {
  const { digest, modulus } = options
  const em = open(options)
  if (!em) return false
  const k = modulus.length
  const t = [...sha256DigestInfo, ...digest]
  if (k < t.length + 11) return false
  const expected = new Uint8Array(k).fill(0xff)
  expected[0] = 0x00
  expected[1] = 0x01
  expected[k - t.length - 1] = 0x00
  expected.set(t, k - t.length)
  return expected.every((byte, i) => byte === em[i])
}
