import { RLP as ethereumjsRlp } from '@ethereumjs/rlp'
import { fc, test } from '@fast-check/vitest'
import * as ethers from 'ethers'
import { RLP as microRlp } from 'micro-eth-signer/rlp.js'
import { type Bytes, Errors, Hex, Rlp } from 'ox'
import * as viem from 'viem'
import { describe, expect } from 'vitest'
import {
  arbitraryRecursiveRlpBytes,
  arbitraryRecursiveRlpHex,
  type RecursiveArray,
} from '../../../test/fuzz/arbitraries/rlp.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

describe('Rlp round-trip', () => {
  test.prop({ tree: arbitraryRecursiveRlpHex() }, { numRuns })(
    'fromHex, fromBytes and from encode as viem, ethers and @ethereumjs/rlp do',
    ({ tree }) => {
      const encoded = Rlp.fromHex(tree)
      expect(encoded).toBe(viem.toRlp(tree as never))
      expect(encoded).toBe(ethers.encodeRlp(tree as never))
      const asBytes = mapLeaves(tree, (leaf) => Hex.toBytes(leaf as Hex.Hex))
      expect(encoded).toBe(
        Hex.fromBytes(ethereumjsRlp.encode(asBytes as never)),
      )
      expect(Rlp.fromBytes(asBytes as never, { as: 'Hex' })).toBe(encoded)
      expect(Rlp.fromBytes(asBytes as never)).toEqual(Hex.toBytes(encoded))
      expect(Rlp.from(tree, { as: 'Hex' })).toBe(encoded)
      expect(Rlp.from(tree, { as: 'Bytes' })).toEqual(Hex.toBytes(encoded))
    },
  )

  test.prop({ tree: arbitraryRecursiveRlpHex() }, { numRuns })(
    'toHex, toBytes and to decode as micro-eth-signer does',
    ({ tree }) => {
      const encoded = Rlp.fromHex(tree)
      expect(Rlp.toHex(encoded)).toEqual(tree)
      expect(Rlp.to(encoded, 'Hex')).toEqual(tree)
      expect(Rlp.toHex(Hex.toBytes(encoded))).toEqual(tree)
      // Uppercase input decodes to the same lowercase leaves.
      const upper = `0x${encoded.slice(2).toUpperCase()}` as Hex.Hex
      expect(Rlp.toHex(upper)).toEqual(tree)
      expect(normalize(Rlp.toBytes(upper))).toEqual(
        normalize(Rlp.toBytes(encoded)),
      )
      const bytes = Rlp.toBytes(encoded)
      expect(normalize(bytes)).toEqual(
        normalize(microRlp.decode(Hex.toBytes(encoded)) as never),
      )
      expect(normalize(Rlp.toBytes(Hex.toBytes(encoded)))).toEqual(
        normalize(bytes),
      )
    },
  )

  test.prop({ tree: arbitraryRecursiveRlpBytes() }, { numRuns })(
    'toBytes(fromBytes(tree)) ≡ tree (Bytes leaves)',
    ({ tree }) => {
      expect(normalize(Rlp.toBytes(Rlp.fromBytes(tree)))).toEqual(
        normalize(tree),
      )
    },
  )

  test.prop(
    {
      tree: arbitraryRecursiveRlpHex(),
      upper: fc.boolean(),
      odd: fc.boolean(),
    },
    { numRuns },
  )(
    'hex leaves in any case or of odd length encode like their bytes',
    ({ tree, upper, odd }) => {
      // `0x0abc` and `0xabc` are the same bytes; uppercase digits too.
      const respelled = mapLeaves(tree, (leaf) => {
        let hex = leaf as string
        if (odd && hex.startsWith('0x0')) hex = `0x${hex.slice(3)}`
        if (upper) hex = `0x${hex.slice(2).toUpperCase()}`
        return hex
      })
      expect(Rlp.fromHex(respelled as never)).toBe(Rlp.fromHex(tree))
    },
  )
})

describe('Rlp on malformed input', () => {
  test.prop(
    {
      tree: arbitraryRecursiveRlpHex({ maxLeafBytes: 64 }),
      at: fc.nat(),
      how: fc.integer({ min: 0, max: 7 }),
      junk: fc.uint8Array({ minLength: 1, maxLength: 3 }),
    },
    { numRuns },
  )(
    'toHex rejects what ethers and @ethereumjs/rlp both reject, and otherwise agrees with them',
    ({ tree, at, how, junk }) => {
      const bytes = [...Hex.toBytes(ethers.encodeRlp(tree as never) as Hex.Hex)]
      const index = bytes.length ? at % bytes.length : 0
      if (how === 0) bytes.splice(index, 1)
      else if (how === 1) bytes.push(...junk)
      else if (how === 2) bytes[index] = junk[0]!
      else if (how === 3) bytes.splice(index, 0, junk[0]!)
      else if (how === 4) bytes.length = index
      else if (how === 5) bytes.unshift(0x81, junk[0]! & 0x7f)
      else if (how === 6) bytes.unshift(0xb8, junk[0]! & 0x37)
      else bytes.unshift(0xf9, 0x00, junk[0]!)
      const hex = Hex.fromBytes(Uint8Array.from(bytes))
      // ox decodes empty input to `0x` on purpose, as viem does.
      if (hex === '0x') return

      const actual = outcome(() => Rlp.toHex(hex))
      // Both decode paths (hex source and bytes) agree, errors included.
      expect(outcome(() => toHexLeaves(Rlp.toBytes(Hex.toBytes(hex))))).toEqual(
        actual,
      )
      if ('error' in actual) {
        // Rejecting malformed RLP is right whatever the references do, but it
        // must be ox's error, not a built-in one.
        expect(actual.ox).toBe(true)
        return
      }
      const references = [
        outcome(() => ethers.decodeRlp(hex)),
        outcome(() =>
          toHexLeaves(ethereumjsRlp.decode(Hex.toBytes(hex)) as never),
        ),
      ].filter((reference) => 'value' in reference)
      expect(references.length).toBeGreaterThan(0)
      for (const reference of references) expect(actual).toEqual(reference)
    },
  )

  test.prop(
    {
      tree: arbitraryRecursiveRlpHex({ maxDepth: 2 }),
      leaf: fc.oneof(
        fc.constantFrom('zz', 'abcd', '0', '', 'x0', '0X', '0X01', '0xzz'),
        fc.string({ maxLength: 6 }).map((s) => `0x${s}`),
        fc.string({ maxLength: 6 }).map((s) => `0X${s}`),
      ),
      first: fc.boolean(),
    },
    { numRuns },
  )(
    'fromHex and from reject a leaf that is not 0x-prefixed hex, as ethers does except for 0X',
    ({ tree, leaf, first }) => {
      const value = (first ? [leaf, tree] : [tree, [leaf]]) as never
      // ox reads an odd number of digits, which ethers rejects.
      if (/^0x[0-9a-fA-F]*$/.test(leaf)) return
      // ethers also takes an uppercase `0X` prefix, which ox does not.
      if (!leaf.startsWith('0X'))
        expect('error' in outcome(() => ethers.encodeRlp(value))).toBe(true)
      expect(() => Rlp.fromHex(value)).toThrow()
      expect(() => Rlp.from(value, { as: 'Hex' })).toThrow()
    },
  )

  test.prop(
    {
      tree: arbitraryRecursiveRlpHex({ maxDepth: 2 }),
      leaf: fc.oneof(
        fc.integer(),
        fc.bigInt(),
        fc.boolean(),
        fc.constant({}),
        fc.constant(null),
      ),
    },
    { numRuns },
  )('a leaf that is neither hex nor bytes throws', ({ tree, leaf }) => {
    const value = [tree, [leaf]] as never
    expect(() => Rlp.fromHex(value)).toThrow()
    expect(() => Rlp.fromBytes(value)).toThrow()
  })
})

/** The result of `fn` or its error, so decoders can be compared on any input. */
function outcome(
  fn: () => unknown,
): { value: unknown } | { error: string; ox: boolean } {
  try {
    return { value: fn() }
  } catch (error) {
    return {
      error: `${(error as Error).name}: ${(error as Error).message}`,
      ox: error instanceof Errors.BaseError,
    }
  }
}

function mapLeaves(
  value: RecursiveArray<unknown>,
  fn: (leaf: unknown) => unknown,
): RecursiveArray<unknown> {
  if (Array.isArray(value)) return value.map((item) => mapLeaves(item, fn))
  return fn(value)
}

function toHexLeaves(value: RecursiveArray<Bytes.Bytes>): unknown {
  return mapLeaves(value, (leaf) => Hex.fromBytes(leaf as Uint8Array))
}

/** Plain arrays for leaves, so `subarray`-backed views compare equal. */
function normalize(value: RecursiveArray<Bytes.Bytes>): unknown {
  return mapLeaves(value, (leaf) => Array.from(leaf as Uint8Array))
}
