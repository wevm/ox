import { fc, test } from '@fast-check/vitest'
import { describe, expect } from 'vp/test'
import {
  bytesToHex,
  bytesToHexLoop,
  hexToBytes,
  hexToBytesLoop,
} from '../hex.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// The implementations as they stood before the tiering change, vendored so the
// suite has an oracle independent of the code under test. Any disagreement is
// either a regression or a deliberate behavior change that should be argued for
// in review -- not something to discover in the wild.

const referenceHexes = Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

function referenceEncode(value: Uint8Array): string {
  const length = value.length
  const parts = Array.from<string>({ length })
  for (let i = 0; i < length; i++) parts[i] = referenceHexes[value[i]!]!
  return `0x${parts.join('')}`
}

/**
 * The previous decoder: `Buffer` at every size, with the JS loop reachable only
 * where `Buffer` was absent. Throws a bare `Error` rather than ox's error
 * classes, so properties compare *whether* it threw, not what it threw.
 */
function referenceDecode(value: string): Uint8Array {
  if (
    typeof value !== 'string' ||
    value.length < 2 ||
    value.charCodeAt(0) !== 48 ||
    value.charCodeAt(1) !== 120
  )
    throw new Error('invalid')
  const body = value.length === 2 ? '' : value.slice(2)
  if ((body.length & 1) !== 0) throw new Error('odd')
  if (body.length > 0) {
    const expected = body.length >> 1
    const buf = Buffer.from(body, 'hex')
    if (buf.length !== expected) throw new Error('invalid')
    const out = new Uint8Array(buf.byteLength)
    out.set(buf)
    return out
  }
  return new Uint8Array(0)
}

/** Runs `fn`, reporting either its value or the fact that it threw. */
function outcome<value>(
  fn: () => value,
): { ok: true; value: value } | { ok: false } {
  try {
    return { ok: true, value: fn() }
  } catch {
    return { ok: false }
  }
}

// Sizes cluster at the tier boundary (`loopDecodeMaxBytes` is 32 or 64
// depending on the runtime), where an off-by-one is likeliest to hide.
const arbitraryBoundaryBytes = fc.oneof(
  fc.uint8Array({ minLength: 0, maxLength: 4 }),
  fc.uint8Array({ minLength: 30, maxLength: 34 }),
  fc.uint8Array({ minLength: 62, maxLength: 66 }),
  fc.uint8Array({ minLength: 0, maxLength: 300 }),
)

/**
 * A single character: the troublemakers test262 enumerates, plus any code point
 * at all -- including lone surrogates and astral characters, which sit far
 * above the Latin-1 lookup table the decoder reads through.
 */
const arbitraryChar = fc.oneof(
  fc.constantFrom(
    '.',
    '^',
    ' ',
    '\t',
    '\n',
    '\r',
    '\u00a0',
    '\u2009',
    '\u2028',
    '\u0000',
    '\u00ff',
    '\u0100',
    '\ud800',
    '\u{1f600}',
    'g',
    'G',
    'z',
    'Z',
    '+',
    '-',
    '/',
  ),
  fc.integer({ min: 0, max: 0x10ffff }).map((c) => String.fromCodePoint(c)),
)

/** Valid hex with exactly one character swapped for an arbitrary one. */
const arbitraryCorruptedHex = fc
  .tuple(
    fc.uint8Array({ minLength: 1, maxLength: 80 }),
    fc.nat(),
    arbitraryChar,
  )
  .map(([bytes, index, char]) => {
    const body = referenceEncode(bytes).slice(2)
    const at = index % body.length
    return `0x${body.slice(0, at)}${char}${body.slice(at + 1)}`
  })

describe('encode: new vs previous implementation', () => {
  test.prop({ bytes: arbitraryBoundaryBytes }, { numRuns })(
    'bytesToHexLoop agrees with the previous loop',
    ({ bytes }) => {
      expect(bytesToHexLoop(bytes)).toBe(referenceEncode(bytes))
    },
  )

  test.prop({ bytes: arbitraryBoundaryBytes }, { numRuns })(
    'the dispatched encoder agrees with the previous loop',
    ({ bytes }) => {
      expect(bytesToHex(bytes)).toBe(referenceEncode(bytes))
    },
  )
})

describe('decode: new vs previous implementation', () => {
  // The previous decoder had a bug: `Buffer.from(…, 'hex')` masks UTF-16 code
  // units to 8 bits, so a character above U+00FF could alias a hex digit and
  // decode instead of being refused. That is now rejected, which is the one
  // intended difference between the two. For pure-ASCII input -- everything a
  // caller could legitimately pass -- they must still agree exactly.
  const isAscii = (value: string) => {
    for (let i = 0; i < value.length; i++)
      if (value.charCodeAt(i) > 0x7f) return false
    return true
  }

  test.prop({ bytes: arbitraryBoundaryBytes }, { numRuns })(
    'valid input decodes identically',
    ({ bytes }) => {
      const hex = referenceEncode(bytes)
      expect(hexToBytes(hex)).toEqual(referenceDecode(hex))
      expect(hexToBytesLoop(hex, bytes.length)).toEqual(referenceDecode(hex))
    },
  )

  test.prop({ hex: arbitraryCorruptedHex }, { numRuns })(
    'pure-ASCII corruption is accepted or rejected identically',
    ({ hex }) => {
      fc.pre(isAscii(hex))
      expect(outcome(() => hexToBytes(hex))).toEqual(
        outcome(() => referenceDecode(hex)),
      )
    },
  )

  test.prop({ value: fc.string({ unit: 'grapheme' }) }, { numRuns })(
    'pure-ASCII strings are accepted or rejected identically',
    ({ value }) => {
      fc.pre(isAscii(value))
      const hex = `0x${value}`
      expect(outcome(() => hexToBytes(hex))).toEqual(
        outcome(() => referenceDecode(hex)),
      )
    },
  )

  test.prop({ hex: arbitraryCorruptedHex }, { numRuns })(
    'non-ASCII input is always rejected',
    ({ hex }) => {
      fc.pre(!isAscii(hex))
      expect(() => hexToBytes(hex)).toThrow()
      const length = (hex.length - 2) >> 1
      if ((hex.length - 2) % 2 === 0)
        expect(() => hexToBytesLoop(hex, length)).toThrow()
    },
  )
})

describe('decode: tiers agree with each other', () => {
  // Prefixing with valid hex pushes the same body across the size threshold and
  // through a different tier. The prefix cannot change whether the body is
  // valid, so the two must agree on outcome, and on value up to the prefix.
  const prefix = 'ab'.repeat(96)
  const prefixBytes = hexToBytes(`0x${prefix}`)

  test.prop({ hex: arbitraryCorruptedHex }, { numRuns })(
    'the tier chosen by size does not change the verdict',
    ({ hex }) => {
      const body = hex.slice(2)
      const short = outcome(() => hexToBytes(`0x${body}`))
      const long = outcome(() => hexToBytes(`0x${prefix}${body}`))
      expect(long.ok).toBe(short.ok)
      if (short.ok && long.ok)
        expect(long.value).toEqual(
          Uint8Array.from([...prefixBytes, ...short.value]),
        )
    },
  )

  test.prop({ bytes: arbitraryBoundaryBytes }, { numRuns })(
    'the loop agrees with whichever tier size selects',
    ({ bytes }) => {
      const hex = referenceEncode(bytes)
      expect(hexToBytesLoop(hex, bytes.length)).toEqual(hexToBytes(hex))
    },
  )
})

describe('round-trip', () => {
  test.prop({ bytes: arbitraryBoundaryBytes }, { numRuns })(
    'decode(encode(b)) is b, through every tier',
    ({ bytes }) => {
      expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes)
      expect(hexToBytes(bytesToHexLoop(bytes))).toEqual(bytes)
      expect(hexToBytesLoop(bytesToHexLoop(bytes), bytes.length)).toEqual(bytes)
    },
  )
})
