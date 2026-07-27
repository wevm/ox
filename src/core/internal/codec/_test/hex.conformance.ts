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
import { hex as vectors } from './vectors.js'

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
      vectors.roundTrip.map(({ bytes, encoded }) => ({
        input: bytes,
        output: `0x${encoded}`,
      })),
    )
    expectTiersMatch(
      decodeTiers,
      vectors.roundTrip.map(({ bytes, encoded }) => ({
        input: `0x${encoded}`,
        output: bytes,
      })),
    )
    expectTiersMatch(
      decodeTiers,
      vectors.decodeCaseInsensitive.map(({ bytes, encoded }) => ({
        input: `0x${encoded}`,
        output: bytes,
      })),
    )
  })

  test('vectors: illegal characters are rejected by every tier', () => {
    const pad = 'ab'.repeat(96)
    expectTiersReject(
      decodeTiers,
      vectors.illegalCharacters.flatMap((char) => [
        `0xaa${char}a`,
        `0x${pad}aa${char}a`,
      ]),
    )
  })

  test('vectors: characters Buffer would mask into a digit are rejected', () => {
    const pad = 'ab'.repeat(96)
    expectTiersReject(
      decodeTiers,
      vectors.maskedNonAscii.flatMap(({ body }) => [
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
