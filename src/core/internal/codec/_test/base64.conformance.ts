/**
 * Base64 codec conformance, written once and run by every runtime.
 *
 * Declares the tiers this runtime can actually execute, pins them to published
 * vectors, and compares them against each other. Coverage widens on its own
 * where more tiers exist -- Node runs the loop, a browser the loop and
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
import * as base64 from '../base64.js'
import { base64 as vectors } from './vectors.js'

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
      vectors.roundTrip.map(({ bytes, encoded }) => ({
        input: { bytes, options: { pad: true, url: false } },
        output: encoded,
      })),
      { describe: ({ bytes }) => `${bytes.length} bytes` },
    )
    expectTiersMatch(
      decodeTiers,
      vectors.roundTrip.map(({ bytes, encoded }) => ({
        input: encoded,
        output: bytes,
      })),
    )
  })

  test('vectors: illegal characters are rejected by every tier', () => {
    expectTiersReject(decodeTiers, vectors.illegal)
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
