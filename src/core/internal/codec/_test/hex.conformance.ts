/**
 * Hex codec conformance, written once and run by every runtime.
 *
 * Declares the tiers this runtime can actually execute, pins them to published
 * vectors, and compares them against each other. Coverage widens on its own
 * where more tiers exist -- Node runs the loop and `Buffer`, a browser the loop and
 * its native method -- without this file changing or naming a runtime.
 *
 * Collected by both the `core` and `browser` projects, via their
 * `*.conformance.ts` globs.
 *
 * @internal
 */

import { describe, expect, test } from 'vp/test'
import {
  corrupted,
  expectTiersAgree,
  expectTiersMatch,
  expectTiersReject,
  sampleBytes,
  type Tier,
} from '../../../../../test/conformance.js'
import * as hex from '../hex.js'

/**
 * Published vectors, transcribed verbatim rather than regenerated, so a change
 * to ox cannot quietly move the expected values.
 *
 * - RFC 4648 section 10 specifies Base16 and gives the `""` through `"foobar"`
 *   progression. Section 8 defines it as case-insensitive on decode; ox emits
 *   lowercase. https://www.rfc-editor.org/rfc/rfc4648#section-10
 * - test262 pins the native codec ox delegates to, including which characters
 *   it must reject.
 *   https://github.com/tc39/test262/tree/main/test/built-ins/Uint8Array/fromHex
 */

/** The RFC 4648 section 10 inputs, as bytes. */
const foobar = ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar'].map((value) =>
  Uint8Array.from(value, (c) => c.charCodeAt(0)),
)

/**
 * Bytes and their lowercase hex, from RFC 4648 section 10 and test262
 * `fromHex/results.js` / `toHex/results.js`. The two agree except on case: the
 * RFC writes uppercase, the ECMAScript methods emit lowercase.
 */
const roundTrip = foobar.map((bytes, i) => ({
  bytes,
  encoded: [
    '',
    '66',
    '666f',
    '666f6f',
    '666f6f62',
    '666f6f6261',
    '666f6f626172',
  ][i]!,
}))

/**
 * Uppercase and mixed-case bodies that must decode to the same bytes as their
 * lowercase form, from test262 `fromHex/results.js` and the uppercase spellings
 * RFC 4648 section 10 uses.
 */
const decodeCaseInsensitive = [
  { bytes: Uint8Array.of(102, 111), encoded: '666F' },
  { bytes: Uint8Array.of(102, 111, 111), encoded: '666F6f' },
  { bytes: foobar[6]!, encoded: '666F6F626172' },
]

/**
 * Characters a decoder must reject, from test262
 * `fromHex/illegal-characters.js`: punctuation, every flavor of ASCII
 * whitespace, and three non-ASCII spaces.
 *
 * The last two sit above the Latin-1 lookup table ox decodes through, so a
 * table read for them yields `undefined` rather than the invalid sentinel --
 * the exact shape of the bug this suite exists to catch.
 */
const illegalCharacters = [
  '.',
  '^',
  ' ',
  '\t',
  '\u000a', // line feed
  '\u000c', // form feed
  '\u000d', // carriage return
  '\u00a0', // no-break space -- inside the Latin-1 table
  '\u2009', // thin space -- above it
  '\u2028', // line separator -- above it
]

/**
 * Bodies that Node's `Buffer` hex decoder accepted, wrongly, before ox guarded
 * against it: it masks each UTF-16 code unit to 8 bits, so a character above
 * U+00FF can alias a hex digit. U+C230 masks to `0x30`, the digit `0`, and the
 * surrogate pair for U+1D330 masks to `40`.
 */
const maskedNonAscii = [
  { body: '\uc2300', note: 'U+C230 masks to the digit 0' },
  { body: '\u{1d330}', note: 'surrogate pair masks to 4 and 0' },
]

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
      roundTrip.map(({ bytes, encoded }) => ({
        input: bytes,
        output: `0x${encoded}`,
      })),
    )
    expectTiersMatch(
      decodeTiers,
      roundTrip.map(({ bytes, encoded }) => ({
        input: `0x${encoded}`,
        output: bytes,
      })),
    )
    expectTiersMatch(
      decodeTiers,
      decodeCaseInsensitive.map(({ bytes, encoded }) => ({
        input: `0x${encoded}`,
        output: bytes,
      })),
    )
  })

  test('vectors: illegal characters are rejected by every tier', () => {
    const pad = 'ab'.repeat(96)
    expectTiersReject(
      decodeTiers,
      illegalCharacters.flatMap((char) => [
        `0xaa${char}a`,
        `0x${pad}aa${char}a`,
      ]),
    )
  })

  test('vectors: characters Buffer would mask into a digit are rejected', () => {
    const pad = 'ab'.repeat(96)
    expectTiersReject(
      decodeTiers,
      maskedNonAscii.flatMap(({ body }) => [`0x${body}`, `0x${pad}${body}`]),
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
