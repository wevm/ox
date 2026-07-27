import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { Bytes, Engine, Hash } from 'ox'
import { Hash as WasmHash } from 'ox/wasm'
import { beforeAll, describe, expect, test } from 'vp/test'

let engine: Engine.Engine

beforeAll(async () => {
  engine = await WasmHash.load()
})

describe('load', () => {
  test('default', async () => {
    expect(Object.keys(await WasmHash.load())).toMatchInlineSnapshot(`
      [
        "Hash",
      ]
    `)
    expect(Object.keys((await WasmHash.load()).Hash!)).toMatchInlineSnapshot(`
      [
        "hmacSha256",
        "keccak256",
        "ripemd160",
        "sha256",
      ]
    `)
  })

  test('behavior: compiles once', async () => {
    const [a, b] = await Promise.all([WasmHash.load(), WasmHash.load()])
    expect(a).toBe(b)
  })
})

// Sizes chosen around the block boundaries where padding bugs live: keccak256's
// rate is 136 bytes, sha256 and ripemd160 use 64-byte blocks and need a second
// block once the remainder reaches 56.
const sizes = [
  0, 1, 2, 31, 32, 55, 56, 63, 64, 65, 71, 72, 111, 135, 136, 137, 199, 200,
  271, 272, 1000,
]

function input(size: number) {
  return new Uint8Array(size).map((_, index) => (index * 37 + 11) & 0xff)
}

describe('Hash', () => {
  test.each(sizes)('keccak256 matches the default at %i bytes', (size) => {
    expect(engine.Hash!.keccak256!(input(size))).toEqual(
      keccak_256(input(size)),
    )
  })

  test.each(sizes)('sha256 matches the default at %i bytes', (size) => {
    expect(engine.Hash!.sha256!(input(size))).toEqual(sha256(input(size)))
  })

  test.each(sizes)('ripemd160 matches the default at %i bytes', (size) => {
    expect(engine.Hash!.ripemd160!(input(size))).toEqual(ripemd160(input(size)))
  })

  test.each([0, 1, 32, 63, 64, 65, 200])(
    'hmacSha256 matches the default with a %i byte key',
    (size) => {
      const key = new Uint8Array(size).fill(0xa5)
      const message = input(100)
      expect(engine.Hash!.hmacSha256!(key, message)).toEqual(
        hmac(sha256, key, message),
      )
    },
  )

  test('behavior: known vectors', () => {
    expect(Bytes.toHex(engine.Hash!.keccak256!(new Uint8Array(0)))).toBe(
      '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    )
    expect(Bytes.toHex(engine.Hash!.sha256!(new Uint8Array(0)))).toBe(
      '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(Bytes.toHex(engine.Hash!.ripemd160!(new Uint8Array(0)))).toBe(
      '0x9c1185a5c5e9fc54612808977ee8f548b2258d31',
    )
  })

  test('behavior: grows memory for large inputs, then still hashes small ones', () => {
    // 3 MiB exceeds the module's initial memory, forcing a `memory.grow` -- which
    // detaches the previous `ArrayBuffer`. A retained view would silently read
    // zero bytes from here on, so the small hash afterwards is the real assertion.
    const large = new Uint8Array(3 * 1024 * 1024).fill(7)
    expect(engine.Hash!.keccak256!(large)).toEqual(keccak_256(large))

    const small = input(32)
    expect(engine.Hash!.keccak256!(small)).toEqual(keccak_256(small))
  })

  test('behavior: consecutive calls do not corrupt each other', () => {
    const a = input(200)
    const b = input(7)
    expect(engine.Hash!.keccak256!(a)).toEqual(keccak_256(a))
    expect(engine.Hash!.keccak256!(b)).toEqual(keccak_256(b))
    expect(engine.Hash!.keccak256!(a)).toEqual(keccak_256(a))
  })

  test('behavior: results do not alias WASM memory', () => {
    const first = engine.Hash!.keccak256!(input(32))
    const snapshot = first.slice()
    engine.Hash!.keccak256!(input(64))
    expect(first).toEqual(snapshot)
  })
})

describe('Engine.set', () => {
  test('behavior: ox uses the WASM implementation once installed', () => {
    Engine.set(engine)
    expect(Hash.keccak256('0xdeadbeef')).toBe(
      '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1',
    )
    expect(Hash.sha256('0xdeadbeef')).toBe(
      '0x5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953',
    )
    expect(Hash.ripemd160('0xdeadbeef')).toBe(
      '0x226821c2f5423e11fe9af68bd285c249db2e4b5a',
    )
  })
})
