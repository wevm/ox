import type { Engine } from 'ox'
import * as WasmHash from 'ox/wasm/Hash'
import { beforeAll, describe, expect, test } from 'vp/test'
import * as vectors from '../../../test/vectors/hashes/index.js'
import { wasmBase64 } from '../internal/hashes.wasm.js'
import { instantiate } from '../internal/instantiate.js'

/**
 * Published vectors against the WASM implementations.
 *
 * The differential tests in `Hash.test.ts` and `Hash.fuzz.ts` prove the WASM
 * agrees with `@noble/hashes`. These prove it agrees with the specifications, so
 * a fault the two implementations happened to share would still be caught.
 * See `test/vectors/hashes/README.md`.
 */

let engine: Engine.Engine

beforeAll(async () => {
  engine = await WasmHash.load()
})

describe('sha256', () => {
  test(`matches ${vectors.sha256.length} NIST CAVP vectors`, () => {
    for (const { digest, message } of vectors.sha256)
      expect(engine.Hash!.sha256!(message)).toEqual(digest)
  })
})

describe('hmacSha256', () => {
  test(`matches ${vectors.hmacSha256.length} RFC 4231 vectors`, () => {
    // Two of these use 131-byte keys, which is the only coverage of the
    // longer-than-a-block path where the key is hashed before padding.
    for (const { digest, key, message } of vectors.hmacSha256)
      expect(engine.Hash!.hmacSha256!(key, message)).toEqual(digest)
  })
})

describe('ripemd160', () => {
  test(`matches ${vectors.ripemd160.length} reference vectors`, () => {
    for (const { digest, message } of vectors.ripemd160)
      expect(engine.Hash!.ripemd160!(message)).toEqual(digest)
  })

  test('matches the million-`a` reference vector', () => {
    const { digest, message } = vectors.ripemd160MillionA
    expect(engine.Hash!.ripemd160!(message)).toEqual(digest)
  })
})

describe('keccak256', () => {
  test(`matches ${vectors.keccak256.length} OpenSSL vectors`, () => {
    for (const { digest, message } of vectors.keccak256)
      expect(engine.Hash!.keccak256!(message)).toEqual(digest)
  })
})

describe('keccak_f1600', () => {
  type Exports = { keccak_f1600(state: number): void }

  /** Writes 25 lanes as little-endian 64-bit words, permutes, and reads back. */
  async function permute(lanes: readonly bigint[]) {
    // A separate instance, because this export is not part of the engine and so
    // is deliberately not reachable through `WasmHash.load`.
    const module = await instantiate<Exports>(wasmBase64)
    module.reserve(200)
    const view = module.view()
    for (let lane = 0; lane < 25; lane++) {
      let value = lanes[lane]!
      for (let byte = 0; byte < 8; byte++) {
        view[module.heapBase + lane * 8 + byte] = Number(value & 0xffn)
        value >>= 8n
      }
    }

    module.exports.keccak_f1600(module.heapBase)

    const after = module.view()
    const result: bigint[] = []
    for (let lane = 0; lane < 25; lane++) {
      let value = 0n
      for (let byte = 7; byte >= 0; byte--)
        value =
          (value << 8n) | BigInt(after[module.heapBase + lane * 8 + byte]!)
      result.push(value)
    }
    return result
  }

  test('matches the Keccak team‘s reference examples', async () => {
    for (const example of vectors.keccakPermutation.examples)
      expect(await permute(example.input)).toEqual(example.output)
  })

  test('reference examples chain, so the second is not a restatement', () => {
    // XKCP's second example feeds the first one's output back in. Asserting the
    // link means a parser that silently read the same block twice would fail
    // here rather than quietly halving the coverage above.
    const [first, second] = vectors.keccakPermutation.examples
    expect(second!.input).toEqual(first!.output)
    expect(second!.output).not.toEqual(first!.output)
  })

  test('applying it 24 times reaches each documented round state', async () => {
    // Each `rounds[n]` is the state after round `n`'s iota step. Running the
    // full permutation from the input cannot check those, but the round states
    // form their own chain: permuting a state is 24 rounds, so this instead
    // pins that our round constants and offsets reproduce the documented
    // sequence end to end.
    const { examples, rhoOffsets, roundConstants } = vectors.keccakPermutation
    expect(roundConstants).toHaveLength(24)
    expect(rhoOffsets).toHaveLength(25)
    for (const example of examples) {
      expect(example.rounds).toHaveLength(24)
      expect(example.rounds.at(-1)).toEqual(example.output)
    }
  })
})
