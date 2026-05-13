import { test } from '@fast-check/vitest'
import { type Bytes, Hex, Rlp } from 'ox'
import { describe, expect } from 'vitest'

import {
  arbitraryRecursiveRlpBytes,
  arbitraryRecursiveRlpHex,
  type RecursiveArray,
} from '../../../test/fuzz/arbitraries/rlp.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

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
})

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
