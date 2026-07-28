import { blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { Bytes, Engine, Hash } from 'ox'
import { Hash as WasmHash } from 'ox/wasm'
import { beforeAll, describe, expect, test } from 'vp/test'
import { wasmBase64 as blake3WasmBase64 } from '../internal/blake3.wasm.js'
import * as blake3_internal from '../internal/blake3.js'
import { hmacSha256ScratchSize, wasmBase64 } from '../internal/hashes.wasm.js'
import * as hash from '../internal/hash.js'
import * as internal from '../internal/instantiate.js'

let engine: WasmHash.create.ReturnType

beforeAll(async () => {
  engine = await WasmHash.create()
})

describe('create', () => {
  test('default', async () => {
    expect(Object.keys(await WasmHash.create())).toMatchInlineSnapshot(`
      [
        "Hash",
      ]
    `)
    expect(Object.keys((await WasmHash.create()).Hash)).toMatchInlineSnapshot(`
      [
        "blake3",
        "hmacSha256",
        "keccak256",
        "ripemd160",
        "sha256",
      ]
    `)
  })

  test('behavior: hands every caller its own engine', async () => {
    const [a, b] = await Promise.all([WasmHash.create(), WasmHash.create()])

    // Deliberately not the same object. A shared slot lets one caller's
    // customisation for composition leak into what a later `create` -- or
    // `Engine.load` -- installs.
    expect(a).not.toBe(b)
    expect(a.Hash).not.toBe(b.Hash)

    a.Hash.keccak256 = () => new Uint8Array(32).fill(9)
    const c = await WasmHash.create()
    expect(c.Hash.keccak256(Bytes.from('0xdeadbeef'))).toEqual(
      b.Hash.keccak256(Bytes.from('0xdeadbeef')),
    )
  })
})

// Sizes chosen around the block boundaries where padding bugs live: keccak256's
// rate is 136 bytes, sha256 and ripemd160 use 64-byte blocks and need a second
// block once the remainder reaches 56, and BLAKE3 uses 1024-byte chunks.
const sizes = [
  0, 1, 2, 31, 32, 55, 56, 63, 64, 65, 71, 72, 111, 135, 136, 137, 199, 200,
  271, 272, 1000, 1023, 1024, 1025, 2048, 2049,
]

function input(size: number) {
  return new Uint8Array(size).map((_, index) => (index * 37 + 11) & 0xff)
}

describe('Hash', () => {
  test.each(sizes)('blake3 matches the default at %i bytes', (size) => {
    expect(engine.Hash.blake3(input(size))).toEqual(blake3(input(size)))
  })

  test.each(sizes)('keccak256 matches the default at %i bytes', (size) => {
    expect(engine.Hash.keccak256(input(size))).toEqual(keccak_256(input(size)))
  })

  test.each(sizes)('sha256 matches the default at %i bytes', (size) => {
    expect(engine.Hash.sha256(input(size))).toEqual(sha256(input(size)))
  })

  test.each(sizes)('ripemd160 matches the default at %i bytes', (size) => {
    expect(engine.Hash.ripemd160(input(size))).toEqual(ripemd160(input(size)))
  })

  test.each([0, 1, 32, 63, 64, 65, 200])(
    'hmacSha256 matches the default with a %i byte key',
    (size) => {
      const key = new Uint8Array(size).fill(0xa5)
      const message = input(100)
      expect(engine.Hash.hmacSha256(key, message)).toEqual(
        hmac(sha256, key, message),
      )
    },
  )

  test('behavior: known vectors', () => {
    expect(Bytes.toHex(engine.Hash.blake3(new Uint8Array(0)))).toBe(
      '0xaf1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
    )
    expect(Bytes.toHex(engine.Hash.keccak256(new Uint8Array(0)))).toBe(
      '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    )
    expect(Bytes.toHex(engine.Hash.sha256(new Uint8Array(0)))).toBe(
      '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(Bytes.toHex(engine.Hash.ripemd160(new Uint8Array(0)))).toBe(
      '0x9c1185a5c5e9fc54612808977ee8f548b2258d31',
    )
  })

  test('behavior: grows memory past 64 MiB, then still hashes small inputs', () => {
    // The input itself is exactly 64 MiB, so the heap base and digest force
    // memory past that boundary. Growing detaches the previous `ArrayBuffer`; a
    // retained view would silently read zero bytes in the assertion below.
    const large = new Uint8Array(64 * 1024 * 1024).fill(7)
    expect(engine.Hash.sha256(large)).toEqual(sha256(large))
    expect(engine.Hash.blake3(large)).toEqual(blake3(large))

    const small = input(32)
    expect(engine.Hash.sha256(small)).toEqual(sha256(small))
    expect(engine.Hash.blake3(small)).toEqual(blake3(small))
  })

  test('behavior: accepts Uint8Array subviews without mutation', () => {
    const backing = input(1027)
    const subview = backing.subarray(1, 1026)
    const snapshot = backing.slice()
    expect(engine.Hash.blake3(subview)).toEqual(blake3(subview))
    expect(backing).toEqual(snapshot)
  })

  test('behavior: blake3 clears its complete memory region', async () => {
    const module =
      await internal.instantiate<blake3_internal.Exports>(blake3WasmBase64)
    const message = input(1025)
    const end = module.heapBase + message.length + 32

    expect(blake3_internal.hash(module, message)).toEqual(blake3(message))
    expect(module.view().slice(module.heapBase, end)).toEqual(
      new Uint8Array(end - module.heapBase),
    )
  })

  test('behavior: blake3 clears its complete region after a late trap', async () => {
    const module =
      await internal.instantiate<blake3_internal.Exports>(blake3WasmBase64)
    const message = input(1025)
    const end = module.heapBase + message.length + 32
    const exports = {
      blake3_hash(inputPtr: number, length: number, outPtr: number) {
        module.exports.blake3_hash(inputPtr, length, outPtr)
        throw new WebAssembly.RuntimeError('forced late trap')
      },
      zero: (ptr: number, length: number) => module.exports.zero(ptr, length),
    }

    expect(() =>
      blake3_internal.hash({ ...module, exports }, message),
    ).toThrowError('forced late trap')
    expect(module.view().slice(module.heapBase, end)).toEqual(
      new Uint8Array(end - module.heapBase),
    )
  })

  test('behavior: rejects wasm32 pointer overflow before reserving', () => {
    let reserved = false
    const module: internal.Module<blake3_internal.Exports> = {
      exports: {
        blake3_hash() {},
        zero() {},
      },
      heapBase: 0xffff_fff0,
      reserve() {
        reserved = true
      },
      view: () => new Uint8Array(0),
    }

    expect(() => blake3_internal.hash(module, input(1))).toThrow(
      internal.MemoryError,
    )
    expect(reserved).toBe(false)
  })

  test('behavior: accepts a workspace ending exactly at the wasm32 boundary', () => {
    const marker = new Error('reserve reached')
    const module: internal.Module<blake3_internal.Exports> = {
      exports: {
        blake3_hash() {},
        zero() {},
      },
      heapBase: 0x1_0000_0000 - 33,
      reserve(bytes) {
        expect(bytes).toBe(33)
        throw marker
      },
      view: () => new Uint8Array(0),
    }

    expect(() => blake3_internal.hash(module, input(1))).toThrow(marker)
  })

  test('behavior: hmacSha256 clears its complete memory region', async () => {
    const module = await internal.instantiate<hash.Exports>(wasmBase64)
    const key = input(120)
    const message = input(17)
    const out = 32
    const messagePtr = module.heapBase
    const keyPtr = messagePtr + message.length
    const outPtr = keyPtr + key.length
    const scratchPtr = Math.ceil((outPtr + out) / 4) * 4
    const end = scratchPtr + hmacSha256ScratchSize
    const stack = module.view().slice(0, module.heapBase)

    expect(hash.hmacSha256(module, key, message)).toEqual(
      hmac(sha256, key, message),
    )

    expect(module.view().slice(0, module.heapBase)).toEqual(stack)
    expect(module.view().slice(messagePtr, end)).toEqual(
      new Uint8Array(end - messagePtr),
    )
  })

  test('behavior: hmacSha256 clears its complete region after a trap', async () => {
    const module = await internal.instantiate<hash.Exports>(wasmBase64)
    const key = input(120)
    const message = input(17)
    const out = 32
    const messagePtr = module.heapBase
    const keyPtr = messagePtr + message.length
    const validOutPtr = keyPtr + key.length
    const scratchPtr = Math.ceil((validOutPtr + out) / 4) * 4
    const end = scratchPtr + hmacSha256ScratchSize
    const stack = module.view().slice(0, module.heapBase)
    // Preserve the production boundary while making the real export trap only
    // after it has populated the scratch buffer.
    const exports = {
      hmac_sha256(
        keyPtr: number,
        keyLength: number,
        messagePtr: number,
        messageLength: number,
        _outPtr: number,
        scratchPtr: number,
      ) {
        module.exports.hmac_sha256(
          keyPtr,
          keyLength,
          messagePtr,
          messageLength,
          module.view().length - 16,
          scratchPtr,
        )
      },
      zero: (ptr: number, length: number) => module.exports.zero(ptr, length),
    }
    const trappingModule = { ...module, exports }

    expect(() => hash.hmacSha256(trappingModule, key, message)).toThrow(
      WebAssembly.RuntimeError,
    )
    expect(module.view().slice(0, module.heapBase)).toEqual(stack)
    expect(module.view().slice(messagePtr, end)).toEqual(
      new Uint8Array(end - messagePtr),
    )

    module.exports.zero(module.view().length - 16, 16)
    expect(hash.hmacSha256(module, key, message)).toEqual(
      hmac(sha256, key, message),
    )
  })

  test('behavior: consecutive calls do not corrupt each other', () => {
    const a = input(200)
    const b = input(7)
    expect(engine.Hash.keccak256(a)).toEqual(keccak_256(a))
    expect(engine.Hash.blake3(a)).toEqual(blake3(a))
    expect(engine.Hash.blake3(b)).toEqual(blake3(b))
    expect(engine.Hash.blake3(a)).toEqual(blake3(a))
    expect(engine.Hash.keccak256(b)).toEqual(keccak_256(b))
    expect(engine.Hash.keccak256(a)).toEqual(keccak_256(a))
  })

  test('behavior: results do not alias WASM memory', () => {
    const first = engine.Hash.keccak256(input(32))
    const snapshot = first.slice()
    engine.Hash.keccak256(input(64))
    expect(first).toEqual(snapshot)

    const blake3First = engine.Hash.blake3(input(32))
    const blake3Snapshot = blake3First.slice()
    engine.Hash.blake3(input(64))
    expect(blake3First).toEqual(blake3Snapshot)
  })
})

describe('Engine.set', () => {
  test('behavior: ox uses the WASM implementation once installed', () => {
    Engine.set(engine)
    expect(Engine.get().Hash?.blake3?.(Bytes.from('0xdeadbeef'))).toEqual(
      blake3(Bytes.from('0xdeadbeef')),
    )
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
