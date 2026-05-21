import { fc, test } from '@fast-check/vitest'
import { Cbor } from 'ox'
import { describe, expect } from 'vp/test'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

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
    fc.string({ maxLength: 64 }),
    fc.uint8Array({ maxLength: 64 }),
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
    'decode(encode(v)) ≡ v',
    ({ value }) => {
      const encoded = Cbor.encode(value)
      const decoded = Cbor.decode(encoded)
      expect(normalize(decoded)).toEqual(normalize(value))
    },
  )
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
