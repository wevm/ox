import { fc } from '@fast-check/vitest'
import type { Bytes, Hex } from 'ox'
import { arbitraryHexOfByteLength } from './bytes.js'

/** Mirror of `ox`'s internal `RecursiveArray` shape. */
export type RecursiveArray<T> = T | readonly RecursiveArray<T>[]

/** Caps for the recursive RLP tree arbitrary. */
export type RlpArbitraryOptions = {
  /** Max nesting depth. Default `4`. */
  maxDepth?: number
  /** Max number of children in a list. Default `5`. */
  maxWidth?: number
  /** Max byte length of a leaf. Default `128`. */
  maxLeafBytes?: number
}

const defaults: Required<RlpArbitraryOptions> = {
  maxDepth: 4,
  maxWidth: 5,
  maxLeafBytes: 128,
}

/**
 * Recursive RLP tree of `Hex.Hex` leaves. Leaf sizes are biased toward
 * RLP length-prefix transition boundaries (`0`, `1`, `55`, `56`,
 * `255`, `256`) where parser bugs typically live.
 */
export function arbitraryRecursiveRlpHex(
  options: RlpArbitraryOptions = {},
): fc.Arbitrary<RecursiveArray<Hex.Hex>> {
  const opts = { ...defaults, ...options }
  return treeAtDepth(hexLeaf(opts), opts, 0)
}

/**
 * Recursive RLP tree of `Bytes.Bytes` leaves.
 */
export function arbitraryRecursiveRlpBytes(
  options: RlpArbitraryOptions = {},
): fc.Arbitrary<RecursiveArray<Bytes.Bytes>> {
  const opts = { ...defaults, ...options }
  return treeAtDepth(bytesLeaf(opts), opts, 0)
}

function treeAtDepth<T>(
  leafArb: fc.Arbitrary<T>,
  opts: Required<RlpArbitraryOptions>,
  depth: number,
): fc.Arbitrary<RecursiveArray<T>> {
  if (depth >= opts.maxDepth) return leafArb as fc.Arbitrary<RecursiveArray<T>>
  return fc.oneof(
    { weight: 3, arbitrary: leafArb as fc.Arbitrary<RecursiveArray<T>> },
    {
      weight: 1,
      arbitrary: fc.array(treeAtDepth(leafArb, opts, depth + 1), {
        minLength: 0,
        maxLength: opts.maxWidth,
      }) as fc.Arbitrary<RecursiveArray<T>>,
    },
  )
}

/** Bias leaf sizes toward RLP length-prefix transition boundaries. */
function leafSize(opts: Required<RlpArbitraryOptions>): fc.Arbitrary<number> {
  return fc
    .oneof(
      { weight: 4, arbitrary: fc.integer({ min: 0, max: opts.maxLeafBytes }) },
      {
        weight: 1,
        arbitrary: fc.constantFrom(0, 1, 55, 56, 127, 128, 255, 256),
      },
    )
    .map((n) => Math.min(Math.max(n, 0), opts.maxLeafBytes))
}

function hexLeaf(opts: Required<RlpArbitraryOptions>): fc.Arbitrary<Hex.Hex> {
  return leafSize(opts).chain((size) => arbitraryHexOfByteLength(size))
}

function bytesLeaf(
  opts: Required<RlpArbitraryOptions>,
): fc.Arbitrary<Bytes.Bytes> {
  return leafSize(opts).chain((size) =>
    fc.uint8Array({ minLength: size, maxLength: size }),
  )
}
