import { fc, test } from '@fast-check/vitest'
import { Cbor, Errors, Hex } from 'ox'
import { describe, expect } from 'vitest'
import { numRuns } from '../../../test/fuzz/numRuns.js'

/**
 * Recursive CBOR-encodable value. ox's Cbor module supports:
 *
 * - boolean
 * - number (no `bigint`; ox throws `Cbor.UnsupportedBigIntError`)
 * - string (UTF-8)
 * - `Uint8Array` (byte string)
 * - arrays of supported values
 * - plain objects with string keys + supported values
 * - `null` and `undefined`
 *
 * Caps:
 * - depth ≤ 3
 * - array/object width ≤ 4
 * - byte/string length ≤ 64
 * - numbers limited to safe-integer range (ox decoder normalizes
 *   integers to `number`)
 *
 * @internal
 */
function arbitraryCborValue(maxDepth = 3): fc.Arbitrary<unknown> {
  const leaf: fc.Arbitrary<unknown> = fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.boolean(),
    // ox's Cbor encoder caps positive numbers at `0xffffffff` and
    // negatives at `-0x100000000` (negative encoding adds 1). Constrain
    // the arbitrary to that representable range; values outside throw
    // `Cbor.NumberTooLargeError` from the encoder, which is correct
    // behavior but not what this round-trip property is asserting.
    fc.integer({ min: -0x100000000, max: 0xffffffff }),
    // Floats take the float16/32/64 encoders.
    fc
      .double()
      .filter(
        (value) =>
          !Number.isInteger(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER,
      ),
    fc.string({ maxLength: 64 }),
    fc.uint8Array({ maxLength: 64 }),
    // Lengths on either side of the 1- and 2-byte length prefixes.
    fc
      .constantFrom(23, 24, 255, 256)
      .chain((length) =>
        fc.oneof(
          fc.string({
            minLength: length,
            maxLength: length,
            unit: 'binary-ascii',
          }),
          fc.uint8Array({ minLength: length, maxLength: length }),
        ),
      ),
  )
  if (maxDepth <= 0) return leaf
  return fc.oneof(
    { weight: 4, arbitrary: leaf },
    {
      weight: 1,
      arbitrary: fc.array(arbitraryCborValue(maxDepth - 1), { maxLength: 4 }),
    },
    {
      weight: 1,
      arbitrary: fc.dictionary(
        fc.string({ maxLength: 16 }),
        arbitraryCborValue(maxDepth - 1),
        { maxKeys: 4 },
      ),
    },
  )
}

describe('Cbor round-trip', () => {
  test.prop({ value: arbitraryCborValue() }, { numRuns })(
    'decode(encode(v)) ≡ v, from hex and from bytes',
    ({ value }) => {
      const encoded = Cbor.encode(value)
      expect(Hex.fromBytes(Cbor.encode(value, { as: 'Bytes' }))).toBe(encoded)
      expect(normalize(Cbor.decode(encoded))).toEqual(normalize(value))
      expect(normalize(Cbor.decode(Hex.toBytes(encoded)))).toEqual(
        normalize(value),
      )
    },
  )
})

describe('Cbor.decode on malformed data', () => {
  test.prop(
    {
      value: arbitraryCborValue(),
      at: fc.nat(),
      how: fc.integer({ min: 0, max: 4 }),
      junk: fc.uint8Array({ minLength: 1, maxLength: 9 }),
    },
    { numRuns },
  )('throws only ox errors on mutated data', ({ value, at, how, junk }) => {
    let bytes = [...Cbor.encode(value, { as: 'Bytes' })]
    const index = bytes.length ? at % bytes.length : 0
    if (how === 0) bytes.length = index
    else if (how === 1) bytes[index] = junk[0]!
    else if (how === 2) bytes.splice(index, 0, ...junk)
    else if (how === 3) bytes.splice(index, junk.length)
    else bytes = [...junk]
    try {
      Cbor.decode(Hex.fromBytes(Uint8Array.from(bytes)))
    } catch (error) {
      expect(error).toBeInstanceOf(Errors.BaseError)
    }
  })
})

/**
 * Normalize for comparison: convert `Uint8Array` to a tagged plain
 * array so deep-equality doesn't trip on backing-buffer differences,
 * and recurse into arrays/objects.
 *
 * @internal
 */
function normalize(value: unknown): unknown {
  if (value instanceof Uint8Array) return { __bytes: Array.from(value) }
  // -0 encodes as a float and reads back as -0; compare it as 0, as NaN as NaN.
  if (typeof value === 'number') return Object.is(value, -0) ? 0 : value
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value).sort((a, b) =>
      a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
    ))
      out[k] = normalize(v)
    return out
  }
  return value
}
