import { fc, test } from '@fast-check/vitest'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import type { Engine } from 'ox'
import * as WasmHash from 'ox/wasm/Hash'
import { beforeAll, describe, expect } from 'vp/test'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

let engine: Engine.Engine

beforeAll(async () => {
  engine = await WasmHash.load()
})

/**
 * `@noble/hashes` is the oracle: it is audited and it is what ox ships by
 * default, so any divergence here is a bug in the WASM implementation.
 *
 * The distribution is weighted toward the sizes where padding and block-boundary
 * bugs hide -- empty input, exact multiples of the keccak256 rate (136) and the
 * SHA-2 block (64), and the 56-byte threshold at which the length counter no
 * longer fits in the final block.
 */
const arbitraryInput = fc.oneof(
  { arbitrary: fc.uint8Array({ maxLength: 300, minLength: 0 }), weight: 6 },
  {
    arbitrary: fc
      .constantFrom(0, 1, 55, 56, 63, 64, 65, 111, 112, 135, 136, 137, 272)
      .chain((size) => fc.uint8Array({ maxLength: size, minLength: size })),
    weight: 3,
  },
  {
    arbitrary: fc.uint8Array({ maxLength: 4096, minLength: 1024 }),
    weight: 1,
  },
)

describe('Hash', () => {
  test.prop({ input: arbitraryInput }, { numRuns })(
    'keccak256 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash!.keccak256!(input)).toEqual(keccak_256(input))
    },
  )

  test.prop({ input: arbitraryInput }, { numRuns })(
    'sha256 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash!.sha256!(input)).toEqual(sha256(input))
    },
  )

  test.prop({ input: arbitraryInput }, { numRuns })(
    'ripemd160 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash!.ripemd160!(input)).toEqual(ripemd160(input))
    },
  )

  test.prop({ key: arbitraryInput, message: arbitraryInput }, { numRuns })(
    'hmacSha256 ≡ @noble/hashes',
    ({ key, message }) => {
      expect(engine.Hash!.hmacSha256!(key, message)).toEqual(
        hmac(sha256, key, message),
      )
    },
  )

  test.prop({ a: arbitraryInput, b: arbitraryInput }, { numRuns })(
    'consecutive calls do not corrupt each other',
    ({ a, b }) => {
      // Interleaving sizes exercises the memory reuse between calls: a stale view
      // or a mis-sized reservation shows up as one of these disagreeing.
      expect(engine.Hash!.keccak256!(a)).toEqual(keccak_256(a))
      expect(engine.Hash!.keccak256!(b)).toEqual(keccak_256(b))
      expect(engine.Hash!.keccak256!(a)).toEqual(keccak_256(a))
    },
  )
})
