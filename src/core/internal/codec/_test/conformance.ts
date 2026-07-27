/**
 * Codec conformance, written once and run by every runtime.
 *
 * Each codec declares the tiers this runtime can actually execute; the suite
 * then pins them to published vectors and compares them against each other.
 * Coverage widens on its own where more tiers exist -- Node runs the loop and
 * `Buffer`, a browser the loop and its native method -- without the file
 * changing or the runtime being named here.
 *
 * @internal
 */

import { describe, expect, test } from 'vp/test'
import {
  expectTiersAgree,
  expectTiersMatch,
  expectTiersReject,
  type Tier,
} from '../../../../../test/conformance.js'
import * as base64 from '../base64.js'
import * as hex from '../hex.js'
import * as vectors from './vectors.js'

/**
 * Deterministic pseudo-random bytes, so a failure reproduces.
 *
 * @yields Byte arrays of varying length.
 */
function* sampleBytes(count: number) {
  let seed = 0x2f6e2b1
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff)
  for (let i = 0; i < count; i++) {
    const length = next() % 200
    yield Uint8Array.from({ length }, () => next() & 0xff)
  }
}

/**
 * Valid encodings with one character replaced, spanning the alphabets.
 *
 * @yields Encoded strings with a single character swapped out.
 */
function* corrupted(encode: (bytes: Uint8Array) => string, count: number) {
  const chars = [
    '.',
    '^',
    ' ',
    '\t',
    '=',
    ' ',
    ' ',
    ' ',
    '−',
    '＋',
    '숰',
    '\ud800',
    '\u{1f600}',
    'g',
    'z',
  ]
  let seed = 0x51f3a7
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff)
  let emitted = 0
  for (const bytes of sampleBytes(count * 2)) {
    const encoded = encode(bytes)
    if (encoded.length === 0) continue
    const at = next() % encoded.length
    yield (
      encoded.slice(0, at) +
        chars[next() % chars.length] +
        encoded.slice(at + 1)
    )
    if (++emitted >= count) return
  }
}

describe('hex', () => {
  const encodeTiers: Tier<Uint8Array, string>[] = [
    { name: 'loop', run: hex.bytesToHexLoop },
    ...(hex.bytesToHexNative
      ? [{ name: 'native', run: hex.bytesToHexNative }]
      : []),
    ...(hex.bytesToHexBuffer
      ? [{ name: 'buffer', run: hex.bytesToHexBuffer }]
      : []),
  ]

  const byteLength = (value: string) => (value.length - 2) >> 1
  // No native decode tier: `Uint8Array.fromHex` cannot be trusted to reject
  // non-ASCII across the browser versions ox supports.
  const decodeTiers: Tier<string, Uint8Array>[] = [
    { name: 'loop', run: (v) => hex.hexToBytesLoop(v, byteLength(v)) },
    ...(hex.hexToBytesBuffer
      ? [
          {
            name: 'buffer',
            run: (v: string) => hex.hexToBytesBuffer!(v, byteLength(v)),
          },
        ]
      : []),
  ]

  test(`behavior: exercises ${encodeTiers.length} encode / ${decodeTiers.length} decode tiers`, () => {
    // Named so the report says which tiers a runtime actually covered, and so
    // a tier silently disappearing is visible rather than quietly shrinking
    // coverage. Encoding has one more tier than decoding: the native method is
    // trusted to encode but not to validate.
    expect(encodeTiers.length).toBeGreaterThan(0)
    expect(decodeTiers.length).toBeGreaterThan(0)
  })

  test('vectors: RFC 4648 and test262', () => {
    expectTiersMatch(
      encodeTiers,
      vectors.hex.roundTrip.map(({ bytes, encoded }) => ({
        input: bytes,
        output: `0x${encoded}`,
      })),
    )
    expectTiersMatch(
      decodeTiers,
      vectors.hex.roundTrip.map(({ bytes, encoded }) => ({
        input: `0x${encoded}`,
        output: bytes,
      })),
    )
    expectTiersMatch(
      decodeTiers,
      vectors.hex.decodeCaseInsensitive.map(({ bytes, encoded }) => ({
        input: `0x${encoded}`,
        output: bytes,
      })),
    )
  })

  test('vectors: illegal characters are rejected by every tier', () => {
    const pad = 'ab'.repeat(96)
    expectTiersReject(
      decodeTiers,
      vectors.hex.illegalCharacters.flatMap((char) => [
        `0xaa${char}a`,
        `0x${pad}aa${char}a`,
      ]),
    )
  })

  test('vectors: characters Buffer would mask into a digit are rejected', () => {
    const pad = 'ab'.repeat(96)
    expectTiersReject(
      decodeTiers,
      vectors.hex.maskedNonAscii.flatMap(({ body }) => [
        `0x${body}`,
        `0x${pad}${body}`,
      ]),
    )
  })

  test('differential: tiers agree on valid input', () => {
    expectTiersAgree(encodeTiers, sampleBytes(400), {
      describe: (b) => `${b.length} bytes`,
    })
    expectTiersAgree(
      decodeTiers,
      [...sampleBytes(400)].map((b) => hex.bytesToHexLoop(b)),
      { describe: (v) => `${v.slice(0, 20)}… (${v.length})` },
    )
  })

  test('differential: tiers agree on corrupted input', () => {
    expectTiersAgree(
      decodeTiers,
      [...corrupted((b) => hex.bytesToHexLoop(b), 400)].filter(
        // Odd bodies never reach a tier; the dispatcher rejects them first.
        (v) => (v.length - 2) % 2 === 0,
      ),
      { describe: (v) => JSON.stringify(v.slice(0, 24)) },
    )
  })
})

describe('base64', () => {
  const options = [
    { pad: true, url: false },
    { pad: false, url: false },
    { pad: true, url: true },
    { pad: false, url: true },
  ] as const

  type EncodeInput = { bytes: Uint8Array; options: base64.Options }
  const encodeTiers: Tier<EncodeInput, string>[] = [
    {
      name: 'loop',
      run: ({ bytes, options }) => base64.fromBytesLoop(bytes, options),
    },
    ...(base64.fromBytesNative
      ? [
          {
            name: 'native',
            run: ({ bytes, options }: EncodeInput) =>
              base64.fromBytesNative!(bytes, options),
          },
        ]
      : []),
  ]

  // `toBytes` strips padding before handing the body to a tier, so the suite
  // has to do the same to compare them.
  const bodyEnd = (value: string) => {
    let end = value.length
    while (end > 0 && value.charCodeAt(end - 1) === 61) end--
    return end
  }
  // Only one decode tier: `Uint8Array.fromBase64` cannot match ox's
  // alphabet-agnostic decoding, so the loop is all there is. The suite still
  // pins it to the published vectors.
  const decodeTiers: Tier<string, Uint8Array>[] = [
    { name: 'loop', run: (v) => base64.toBytesLoop(v, bodyEnd(v)) },
  ]

  test(`behavior: exercises ${encodeTiers.length} encode / ${decodeTiers.length} decode tiers`, () => {
    expect(encodeTiers.length).toBeGreaterThan(0)
    expect(decodeTiers.length).toBe(1)
  })

  test('vectors: RFC 4648', () => {
    expectTiersMatch(
      encodeTiers,
      vectors.base64.roundTrip.map(({ bytes, encoded }) => ({
        input: { bytes, options: { pad: true, url: false } },
        output: encoded,
      })),
      { describe: ({ bytes }) => `${bytes.length} bytes` },
    )
    expectTiersMatch(
      decodeTiers,
      vectors.base64.roundTrip.map(({ bytes, encoded }) => ({
        input: encoded,
        output: bytes,
      })),
    )
  })

  test('vectors: illegal characters are rejected by every tier', () => {
    expectTiersReject(decodeTiers, vectors.base64.illegal)
  })

  test('differential: tiers agree on valid input', () => {
    for (const option of options)
      expectTiersAgree(
        encodeTiers,
        [...sampleBytes(200)].map((bytes) => ({ bytes, options: option })),
        {
          describe: ({ bytes }) =>
            `${bytes.length} bytes, ${JSON.stringify(option)}`,
        },
      )
    expectTiersAgree(
      decodeTiers,
      [...sampleBytes(400)].map((b) => base64.fromBytesLoop(b)),
      { describe: (v) => `${v.slice(0, 20)}… (${v.length})` },
    )
  })

  test('differential: tiers agree on corrupted input', () => {
    expectTiersAgree(
      decodeTiers,
      [...corrupted((b) => base64.fromBytesLoop(b), 400)],
      { describe: (v) => JSON.stringify(v.slice(0, 24)) },
    )
  })
})
