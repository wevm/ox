import { fc, test } from '@fast-check/vitest'
import { decodeRlp, encodeRlp } from 'ethers'
import { type Bytes, Errors, Hex, Rlp } from 'ox'
import { toRlp } from 'viem'
import { describe, expect } from 'vp/test'

import { arbitraryHexOfByteLength } from '../../../test/fuzz/arbitraries/bytes.js'
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

describe('Rlp differential', () => {
  test.prop({ tree: arbitraryRecursiveRlpHex() }, { numRuns })(
    'encoding matches ethers and viem, and decodes back',
    ({ tree }) => {
      const encoded = Rlp.fromHex(tree)
      expect(encoded).toBe(encodeRlp(tree as never))
      expect(encoded).toBe(toRlp(tree as never))
      expect(Rlp.to(encoded, 'Hex')).toEqual(tree)
      expect(Rlp.toHex(encoded)).toEqual(decodeRlp(encoded))
    },
  )

  test.prop(
    {
      edit: fc.tuple(
        fc.nat(),
        fc.constantFrom('cut', 'drop', 'insert', 'junk', 'prefix', 'set'),
        fc.uint8Array({ maxLength: 3, minLength: 1 }),
      ),
      tree: arbitraryRecursiveRlpHex(),
    },
    { numRuns },
  )(
    'decoding malformed encodings agrees with ethers',
    ({ edit: [at, kind, junk], tree }) => {
      const bytes = [...Hex.toBytes(Rlp.fromHex(tree))]
      const index = bytes.length ? at % bytes.length : 0
      if (kind === 'cut') bytes.length = index
      else if (kind === 'drop') bytes.splice(index, 1)
      else if (kind === 'insert') bytes.splice(index, 0, junk[0]!)
      else if (kind === 'junk') bytes.push(...junk)
      // A byte below 0x80 behind a length prefix, which canonical RLP forbids.
      else if (kind === 'prefix') bytes.unshift(0x81, junk[0]! & 0x7f)
      else bytes[index] = junk[0]!
      const hex = Hex.fromBytes(Uint8Array.from(bytes))
      if (hex === '0x') return
      const expected = (() => {
        try {
          return decodeRlp(hex)
        } catch {
          return undefined
        }
      })()
      try {
        // ox decodes only what ethers decodes, to the same value.
        expect(Rlp.toHex(hex)).toEqual(expected)
      } catch (error) {
        if (!(error instanceof Errors.BaseError)) throw error
        // ethers also accepts non-canonical encodings such as `0x8100`;
        // rejecting those is stricter, not wrong.
        if (expected !== undefined) expect(encodeRlp(expected)).not.toBe(hex)
      }
    },
  )

  test.prop(
    {
      digit: fc.constantFrom('g', 'z', 'x', ' ', '-'),
      first: fc.boolean(),
      how: fc.constantFrom('digit', 'unprefixed', 'uppercase', 'empty'),
      leaf: fc
        .integer({ max: 33, min: 1 })
        .chain((size) => arbitraryHexOfByteLength(size)),
      position: fc.nat(),
      tree: arbitraryRecursiveRlpHex({ maxDepth: 2 }),
    },
    { numRuns },
  )(
    'a malformed hex leaf throws Hex.InvalidHexValueError',
    ({ digit, first, how, leaf, position, tree }) => {
      const body = leaf.slice(2)
      const index = position % body.length
      const bad = {
        digit: `0x${body.slice(0, index)}${digit}${body.slice(index + 1)}`,
        empty: '',
        unprefixed: body,
        uppercase: `0X${body}`,
      }[how]
      const value = (first ? [bad, tree] : [tree, bad]) as never
      // ethers rejects these too, except an uppercase `0X`, which ox's
      // `Hex.validate` and `Bytes.fromHex` reject.
      if (how !== 'uppercase') expect(() => encodeRlp(value)).toThrow()
      expect(() => Rlp.from(value, { as: 'Hex' })).toThrow(
        Hex.InvalidHexValueError,
      )
      expect(() => Rlp.from(value, { as: 'Bytes' })).toThrow(
        Hex.InvalidHexValueError,
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
