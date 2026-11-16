import { fc, test } from '@fast-check/vitest'
import { type Bytes, Hex, Rlp } from 'ox'
import { describe, expect } from 'vp/test'

import {
  arbitraryRecursiveRlpBytes,
  arbitraryRecursiveRlpHex,
  type RecursiveArray,
} from '../../../test/fuzz/arbitraries/rlp.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

describe('Rlp round-trip', () => {
  test.prop({ tree: arbitraryRecursiveRlpHex() }, { numRuns })(
    'toHex(from(tree, { as: "Hex" })) ≡ tree (Hex leaves)',
    ({ tree }) => {
      const encoded = Rlp.from(tree, { as: 'Hex' })
      const decoded = Rlp.toHex(encoded)
      expect(normalizeHex(decoded)).toEqual(normalizeHex(tree))
    },
  )

  test.prop({ tree: arbitraryRecursiveRlpBytes() }, { numRuns })(
    'toBytes(from(tree, { as: "Bytes" })) ≡ tree (Bytes leaves)',
    ({ tree }) => {
      const encoded = Rlp.from(tree, { as: 'Bytes' })
      const decoded = Rlp.toBytes(encoded)
      expect(normalizeBytes(decoded)).toEqual(normalizeBytes(tree))
    },
  )

  test.prop({ tree: arbitraryRecursiveRlpHex() }, { numRuns })(
    'hex and bytes encode paths agree',
    ({ tree }) => {
      const asHex = Rlp.from(tree, { as: 'Hex' })
      const asBytes = Rlp.from(tree, { as: 'Bytes' })
      expect(asHex).toEqual(Hex.fromBytes(asBytes))
    },
  )

  test.prop(
    {
      edit: fc.tuple(
        fc.nat(),
        fc.nat(0xff),
        fc.constantFrom('cut', 'set', 'add', 'char'),
      ),
      tree: arbitraryRecursiveRlpHex(),
    },
    { numRuns },
  )(
    'hex and bytes decode paths agree on mutated encodings, errors included',
    ({ edit: [at, byte, kind], tree }) => {
      const body = Rlp.from(tree, { as: 'Hex' }).slice(2)
      const index = (at % (body.length / 2 + 1)) * 2
      const pair = byte.toString(16).padStart(2, '0')
      const mutated = `0x${(() => {
        if (kind === 'cut') return body.slice(0, index)
        if (kind === 'set')
          return `${body.slice(0, index)}${pair}${body.slice(index + 2)}`
        if (kind === 'add')
          return `${body.slice(0, index)}${pair}${body.slice(index)}`
        return `${body.slice(0, index)}g${body.slice(index + 1)}`
      })()}` as Hex.Hex
      expect(outcome(() => Rlp.toHex(mutated))).toEqual(
        outcome(() => normalizeBytesToHex(Rlp.toBytes(mutated))),
      )
    },
  )
})

/**
 * Returns a decode result or its error, so that two decode paths can be
 * compared on malformed input.
 *
 * @internal
 */
function outcome(fn: () => unknown) {
  try {
    return { value: fn() }
  } catch (error) {
    return { error: `${(error as Error).name}: ${(error as Error).message}` }
  }
}

/**
 * Converts `Uint8Array` leaves to hex, as `Rlp.toHex` returns them.
 *
 * @internal
 */
function normalizeBytesToHex(value: RecursiveArray<Bytes.Bytes>): unknown {
  if (Array.isArray(value)) return value.map(normalizeBytesToHex)
  return Hex.fromBytes(value as Uint8Array)
}

/**
 * Lower-case any hex string in a recursive tree. The encoder emits
 * lowercase but the arbitrary may produce mixed casing in the future,
 * so normalize before comparing.
 *
 * @internal
 */
function normalizeHex(value: RecursiveArray<Hex.Hex>): unknown {
  if (Array.isArray(value)) return value.map(normalizeHex)
  return (value as string).toLowerCase()
}

/**
 * Convert `Uint8Array` leaves to plain arrays so deep-equality
 * comparison doesn't trip on subarray buffer-backing differences.
 *
 * @internal
 */
function normalizeBytes(value: RecursiveArray<Bytes.Bytes>): unknown {
  if (Array.isArray(value)) return value.map(normalizeBytes)
  return Array.from(value as Uint8Array)
}
