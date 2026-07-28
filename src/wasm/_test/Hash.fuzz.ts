import { fc, test } from '@fast-check/vitest'
import { blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { Hash as WasmHash } from 'ox/wasm'
import { beforeAll, describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'

let engine: WasmHash.create.ReturnType

beforeAll(async () => {
  engine = await WasmHash.create()
})

/**
 * `@noble/hashes` is the oracle: it is audited and it is what ox ships by
 * default, so any divergence here is a bug in the WASM implementation. Published
 * vectors live in `Hash.vectors.test.ts` and cover the case where both
 * implementations could be wrong together.
 *
 * The distribution is weighted toward the sizes where padding and block-boundary
 * bugs hide -- empty input, exact multiples of the keccak256 rate (136) and the
 * SHA-2 block (64), BLAKE3 chunk (1024), and the 56-byte threshold at which
 * the SHA-2 length counter no longer fits in the final block.
 */
const arbitraryInput = fc.oneof(
  { arbitrary: fc.uint8Array({ maxLength: 300, minLength: 0 }), weight: 6 },
  {
    arbitrary: fc
      .constantFrom(
        0,
        1,
        55,
        56,
        63,
        64,
        65,
        111,
        112,
        135,
        136,
        137,
        272,
        1023,
        1024,
        1025,
        2048,
        2049,
      )
      .chain((size) => fc.uint8Array({ maxLength: size, minLength: size })),
    weight: 3,
  },
  {
    arbitrary: fc.uint8Array({ maxLength: 4096, minLength: 1024 }),
    weight: 1,
  },
)

/**
 * HMAC key lengths straddling the 64-byte block. At or under it the key is
 * zero-padded; over it, it is hashed first -- a different code path that the
 * message-shaped arbitrary above would only reach by chance.
 */
const arbitraryKey = fc.oneof(
  {
    arbitrary: fc
      .constantFrom(0, 1, 32, 63, 64, 65, 96, 128, 129)
      .chain((size) => fc.uint8Array({ maxLength: size, minLength: size })),
    weight: 3,
  },
  { arbitrary: fc.uint8Array({ maxLength: 200, minLength: 0 }), weight: 1 },
)

const primitives = {
  blake3: {
    reference: (input: Uint8Array) => blake3(input),
    wasm: (input: Uint8Array) => engine.Hash.blake3(input),
  },
  hmacSha256: {
    reference: (input: Uint8Array, key: Uint8Array) => hmac(sha256, key, input),
    wasm: (input: Uint8Array, key: Uint8Array) =>
      engine.Hash.hmacSha256(key, input),
  },
  keccak256: {
    reference: (input: Uint8Array) => keccak_256(input),
    wasm: (input: Uint8Array) => engine.Hash.keccak256(input),
  },
  ripemd160: {
    reference: (input: Uint8Array) => ripemd160(input),
    wasm: (input: Uint8Array) => engine.Hash.ripemd160(input),
  },
  sha256: {
    reference: (input: Uint8Array) => sha256(input),
    wasm: (input: Uint8Array) => engine.Hash.sha256(input),
  },
} as const

type Name = keyof typeof primitives

describe('Hash', () => {
  test.prop({ input: arbitraryInput }, { numRuns })(
    'blake3 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash.blake3(input)).toEqual(blake3(input))
    },
  )

  test.prop({ input: arbitraryInput }, { numRuns })(
    'keccak256 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash.keccak256(input)).toEqual(keccak_256(input))
    },
  )

  test.prop({ input: arbitraryInput }, { numRuns })(
    'sha256 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash.sha256(input)).toEqual(sha256(input))
    },
  )

  test.prop({ input: arbitraryInput }, { numRuns })(
    'ripemd160 ≡ @noble/hashes',
    ({ input }) => {
      expect(engine.Hash.ripemd160(input)).toEqual(ripemd160(input))
    },
  )

  test.prop({ input: arbitraryInput, key: arbitraryKey }, { numRuns })(
    'hmacSha256 ≡ @noble/hashes',
    ({ input, key }) => {
      expect(engine.Hash.hmacSha256(key, input)).toEqual(
        hmac(sha256, key, input),
      )
    },
  )
})

describe('memory', () => {
  test.prop(
    {
      operations: fc.array(
        fc.record({
          input: arbitraryInput,
          key: arbitraryKey,
          name: fc.constantFrom<Name>(
            'blake3',
            'hmacSha256',
            'keccak256',
            'ripemd160',
            'sha256',
          ),
        }),
        { maxLength: 24, minLength: 2 },
      ),
    },
    { numRuns },
  )('an arbitrary sequence of calls agrees at every step', ({ operations }) => {
    // Every primitive shares one region of WASM linear memory, reusing it call
    // after call. A mis-sized reservation, an off-by-one write, or a digest read
    // from the wrong offset can leave earlier bytes behind and still produce a
    // correct answer in isolation -- it only shows up when calls of differing
    // sizes and kinds are interleaved. Comparing every step of a random sequence
    // is what catches that; a fixed a/b/a pattern does not.
    for (const { input, key, name } of operations) {
      const primitive = primitives[name]
      expect(
        primitive.wasm(input, key),
        `${name} with a ${input.length} byte input`,
      ).toEqual(primitive.reference(input, key))
    }
  })

  test.prop(
    {
      sizes: fc.array(fc.integer({ max: 20, min: 0 }), {
        maxLength: 6,
        minLength: 2,
      }),
    },
    { numRuns: Math.min(numRuns, 20) },
  )('repeated growth keeps results correct', ({ sizes }) => {
    // Each size is a page count. Going up grows linear memory and detaches the
    // previous `ArrayBuffer`; coming back down must not, since WASM memory never
    // shrinks. Either way the view has to be re-derived, and a stale one reads
    // as zeroes rather than throwing.
    for (const pages of sizes) {
      const input = new Uint8Array(pages * 65_536).fill(pages & 0xff)
      expect(engine.Hash.keccak256(input), `${pages} pages`).toEqual(
        keccak_256(input),
      )
    }
  })

  test.prop({ input: arbitraryInput }, { numRuns })(
    'digests never alias WASM memory',
    ({ input }) => {
      // A digest returned as a view over linear memory would be silently
      // rewritten by the next call. Hold one across a larger call and check it.
      const digest = engine.Hash.keccak256(input)
      const snapshot = digest.slice()
      engine.Hash.keccak256(new Uint8Array(input.length + 1024).fill(0xaa))
      expect(digest).toEqual(snapshot)

      const blake3Digest = engine.Hash.blake3(input)
      const blake3Snapshot = blake3Digest.slice()
      engine.Hash.blake3(new Uint8Array(input.length + 1024).fill(0xaa))
      expect(blake3Digest).toEqual(blake3Snapshot)
    },
  )

  test.prop({ input: arbitraryInput }, { numRuns })(
    'inputs are not mutated',
    ({ input }) => {
      const snapshot = input.slice()
      engine.Hash.blake3(input)
      engine.Hash.keccak256(input)
      engine.Hash.sha256(input)
      engine.Hash.ripemd160(input)
      engine.Hash.hmacSha256(input, input)
      expect(input).toEqual(snapshot)
    },
  )
})
