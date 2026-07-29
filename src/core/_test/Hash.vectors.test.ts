import { Hash } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as vectors from '../../../test/vectors/hashes/index.js'

/**
 * Published vectors against ox's default (`@noble/hashes`) implementations.
 *
 * Every other hash test in ox is differential against `@noble/hashes`, which can
 * only prove two implementations agree. These come from the specifications and
 * the algorithms' designers, so they check the default path on its own terms.
 * See `test/vectors/hashes/README.md`.
 */

describe('blake3', () => {
  test(`matches ${vectors.blake3.length} official BLAKE3 vectors`, () => {
    for (const { digest, message } of vectors.blake3)
      expect(Hash.blake3(message, { as: 'Bytes' })).toEqual(digest)
  })
})

describe('sha256', () => {
  test(`matches ${vectors.sha256.length} NIST CAVP vectors`, () => {
    for (const { digest, message } of vectors.sha256)
      expect(Hash.sha256(message, { as: 'Bytes' })).toEqual(digest)
  })
})

describe('hmac256', () => {
  test(`matches ${vectors.hmacSha256.length} RFC 4231 vectors`, () => {
    for (const { digest, key, message } of vectors.hmacSha256)
      expect(Hash.hmac256(key, message, { as: 'Bytes' })).toEqual(digest)
  })
})

describe('ripemd160', () => {
  test(`matches ${vectors.ripemd160.length} reference vectors`, () => {
    for (const { digest, message } of vectors.ripemd160)
      expect(Hash.ripemd160(message, { as: 'Bytes' })).toEqual(digest)
  })

  test('matches the million-`a` reference vector', () => {
    const { digest, message } = vectors.ripemd160MillionA
    expect(Hash.ripemd160(message, { as: 'Bytes' })).toEqual(digest)
  })
})

describe('keccak256', () => {
  test(`matches ${vectors.keccak256.length} OpenSSL vectors`, () => {
    for (const { digest, message } of vectors.keccak256)
      expect(Hash.keccak256(message, { as: 'Bytes' })).toEqual(digest)
  })

  test('is Keccak, not FIPS-202 SHA3-256', () => {
    // The two differ only by a domain-separation byte, so a padding mistake
    // produces a plausible-looking digest. This pins the distinction.
    expect(Hash.keccak256('0x')).toBe(
      '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    )
    expect(Hash.keccak256('0x')).not.toBe(
      '0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    )
  })
})
