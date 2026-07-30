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
import { blake3StateSize } from '../internal/blake3.wasm.js'
import {
  hmacSha256ScratchSize,
  hmacSha256StateSize,
  wasmBase64,
} from '../internal/hashes.wasm.js'
import * as hash from '../internal/hash.js'
import * as hashes_internal from '../internal/hashes.js'
import * as internal from '../internal/instantiate.js'

let engine: WasmHash.engine.ReturnType

beforeAll(async () => {
  engine = await WasmHash.engine()
})

describe('engine', () => {
  test('default', async () => {
    expect(Object.keys(await WasmHash.engine())).toMatchInlineSnapshot(`
      [
        "blake3",
        "createBlake3",
        "createHmacSha256",
        "createKeccak256",
        "createRipemd160",
        "createSha256",
        "hmacSha256",
        "keccak256",
        "ripemd160",
        "sha256",
      ]
    `)
  })

  test('behavior: hands every caller its own engine', async () => {
    const [a, b] = await Promise.all([WasmHash.engine(), WasmHash.engine()])

    // Deliberately not the same object. Sharing the slot object would let one
    // caller's customisation leak into a later `engine` or `Engine.install`.
    expect(a).not.toBe(b)

    a.keccak256 = () => new Uint8Array(32).fill(9)
    const c = await WasmHash.engine()
    expect(c.keccak256(Bytes.from('0xdeadbeef'))).toEqual(
      b.keccak256(Bytes.from('0xdeadbeef')),
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

type HashState = ReturnType<WasmHash.engine.ReturnType['createSha256']>

type IncrementalCase = {
  create: () => HashState
  digestSize: number
  name: string
  oneShot: (input: Uint8Array) => Uint8Array
  wasmOneShot: (input: Uint8Array) => Uint8Array
}

function concat(...values: readonly Uint8Array[]) {
  const output = new Uint8Array(
    values.reduce((length, value) => length + value.length, 0),
  )
  let offset = 0
  for (const value of values) {
    output.set(value, offset)
    offset += value.length
  }
  return output
}

function align8(value: number) {
  return Math.ceil(value / 8) * 8
}

function digest(state: HashState, size: number) {
  const output = new Uint8Array(size)
  state.digestInto(output)
  return output
}

function incrementalCases(): readonly IncrementalCase[] {
  const key = input(100)
  return [
    {
      create: () => engine.createBlake3(),
      digestSize: 32,
      name: 'blake3',
      oneShot: blake3,
      wasmOneShot: (value) => engine.blake3(value),
    },
    {
      create: () => engine.createHmacSha256(key),
      digestSize: 32,
      name: 'hmacSha256',
      oneShot: (value) => hmac(sha256, key, value),
      wasmOneShot: (value) => engine.hmacSha256(key, value),
    },
    {
      create: () => engine.createKeccak256(),
      digestSize: 32,
      name: 'keccak256',
      oneShot: keccak_256,
      wasmOneShot: (value) => engine.keccak256(value),
    },
    {
      create: () => engine.createRipemd160(),
      digestSize: 20,
      name: 'ripemd160',
      oneShot: ripemd160,
      wasmOneShot: (value) => engine.ripemd160(value),
    },
    {
      create: () => engine.createSha256(),
      digestSize: 32,
      name: 'sha256',
      oneShot: sha256,
      wasmOneShot: (value) => engine.sha256(value),
    },
  ]
}

describe('Hash', () => {
  test.each(sizes)('blake3 matches the default at %i bytes', (size) => {
    expect(engine.blake3(input(size))).toEqual(blake3(input(size)))
  })

  test.each(sizes)('keccak256 matches the default at %i bytes', (size) => {
    expect(engine.keccak256(input(size))).toEqual(keccak_256(input(size)))
  })

  test.each(sizes)('sha256 matches the default at %i bytes', (size) => {
    expect(engine.sha256(input(size))).toEqual(sha256(input(size)))
  })

  test.each(sizes)('ripemd160 matches the default at %i bytes', (size) => {
    expect(engine.ripemd160(input(size))).toEqual(ripemd160(input(size)))
  })

  test.each([0, 1, 32, 63, 64, 65, 200])(
    'hmacSha256 matches the default with a %i byte key',
    (size) => {
      const key = new Uint8Array(size).fill(0xa5)
      const message = input(100)
      expect(engine.hmacSha256(key, message)).toEqual(
        hmac(sha256, key, message),
      )
    },
  )

  test.each(incrementalCases())(
    '$name matches arbitrary chunk boundaries',
    ({ create, digestSize, oneShot }) => {
      const message = input(4097)
      const snapshot = message.slice()
      const chunks = [0, 1, 7, 55, 64, 129, 1023, 136, 2]
      const state = create()
      let offset = 0
      let index = 0
      while (offset < message.length) {
        const length = Math.min(
          chunks[index++ % chunks.length]!,
          message.length - offset,
        )
        state.update(message.subarray(offset, offset + length))
        offset += length
      }

      expect(digest(state, digestSize)).toEqual(oneShot(message))
      expect(message).toEqual(snapshot)
    },
  )

  test.each(incrementalCases())(
    '$name clones an independent prefix',
    ({ create, digestSize, oneShot }) => {
      const prefix = input(137)
      const left = input(63)
      const right = input(1025)
      const state = create()
      state.update(prefix)
      const clone = state.clone()
      state.update(left)
      clone.update(right)

      expect(digest(state, digestSize)).toEqual(oneShot(concat(prefix, left)))
      expect(digest(clone, digestSize)).toEqual(oneShot(concat(prefix, right)))
    },
  )

  test.each(incrementalCases())(
    '$name keeps interleaved states independent',
    ({ create, digestSize, oneShot }) => {
      const a = input(2049)
      const b = input(271)
      const stateA = create()
      const stateB = create()

      stateA.update(a.subarray(0, 55))
      stateB.update(b.subarray(0, 136))
      stateA.update(a.subarray(55, 1024))
      stateB.update(b.subarray(136))
      stateA.update(a.subarray(1024))

      expect(digest(stateB, digestSize)).toEqual(oneShot(b))
      expect(digest(stateA, digestSize)).toEqual(oneShot(a))
    },
  )

  test.each(incrementalCases())(
    '$name survives one-shot calls through the shared module',
    ({ create, digestSize, oneShot, wasmOneShot }) => {
      const message = input(1025)
      const state = create()
      state.update(message.subarray(0, 136))

      expect(wasmOneShot(input(2049))).toEqual(oneShot(input(2049)))

      state.update(message.subarray(136))
      expect(digest(state, digestSize)).toEqual(oneShot(message))
    },
  )

  test.each(incrementalCases())(
    '$name consumes and clears its lifecycle',
    ({ create, digestSize, oneShot }) => {
      const message = input(72)
      const state = create()
      state.update(message)
      const output = new Uint8Array(digestSize + 7).fill(0xa5)
      state.digestInto(output)

      expect(output.subarray(0, digestSize)).toEqual(oneShot(message))
      expect(output.subarray(digestSize)).toEqual(new Uint8Array(7).fill(0xa5))
      expect(() => state.update(message)).toThrow('destroyed')
      expect(() => state.clone()).toThrow('destroyed')
      expect(() => state.digestInto(output)).toThrow('destroyed')
      expect(() => state.destroy()).not.toThrow()
    },
  )

  test('behavior: known vectors', () => {
    expect(Bytes.toHex(engine.blake3(new Uint8Array(0)))).toBe(
      '0xaf1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
    )
    expect(Bytes.toHex(engine.keccak256(new Uint8Array(0)))).toBe(
      '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    )
    expect(Bytes.toHex(engine.sha256(new Uint8Array(0)))).toBe(
      '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(Bytes.toHex(engine.ripemd160(new Uint8Array(0)))).toBe(
      '0x9c1185a5c5e9fc54612808977ee8f548b2258d31',
    )
  })

  test('behavior: grows memory past 64 MiB, then still hashes small inputs', () => {
    // The input itself is exactly 64 MiB, so the heap base and digest force
    // memory past that boundary. Growing detaches the previous `ArrayBuffer`;
    // a retained view would silently read zero bytes in the assertion below.
    const large = new Uint8Array(64 * 1024 * 1024).fill(7)
    expect(engine.sha256(large)).toEqual(sha256(large))
    expect(engine.blake3(large)).toEqual(blake3(large))

    const small = input(32)
    expect(engine.sha256(small)).toEqual(sha256(small))
    expect(engine.blake3(small)).toEqual(blake3(small))
  }, 60_000)

  test('behavior: accepts Uint8Array subviews without mutation', () => {
    const backing = input(1027)
    const subview = backing.subarray(1, 1026)
    const snapshot = backing.slice()
    expect(engine.blake3(subview)).toEqual(blake3(subview))
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

  test('behavior: incremental blake3 clears every WASM workspace', async () => {
    const module = await internal.instantiate<
      blake3_internal.Exports & blake3_internal.StateExports
    >(blake3WasmBase64)
    const initEnd = align8(module.heapBase) + blake3StateSize
    module.view().fill(0xa5, module.heapBase, initEnd)
    const state = blake3_internal.create(module)
    expect(module.view().slice(module.heapBase, initEnd)).toEqual(
      new Uint8Array(initEnd - module.heapBase),
    )

    const message = input(1025)
    const updateEnd = align8(module.heapBase + message.length) + blake3StateSize
    state.update(message)
    expect(module.view().slice(module.heapBase, updateEnd)).toEqual(
      new Uint8Array(updateEnd - module.heapBase),
    )

    const output = new Uint8Array(32)
    const finalizeEnd =
      align8(module.heapBase) + blake3StateSize + output.length
    state.digestInto(output)
    expect(output).toEqual(blake3(message))
    expect(module.view().slice(module.heapBase, finalizeEnd)).toEqual(
      new Uint8Array(finalizeEnd - module.heapBase),
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

  test('behavior: incremental hmacSha256 clears every WASM workspace', async () => {
    const module =
      await internal.instantiate<hashes_internal.Exports>(wasmBase64)
    const key = input(100)
    const initEnd = align8(module.heapBase + key.length) + hmacSha256StateSize
    module.view().fill(0xa5, module.heapBase, initEnd)
    const state = hash.createHmacSha256(module, key)
    expect(module.view().slice(module.heapBase, initEnd)).toEqual(
      new Uint8Array(initEnd - module.heapBase),
    )

    const message = input(137)
    const updateEnd =
      align8(module.heapBase + message.length) + hmacSha256StateSize
    state.update(message)
    expect(module.view().slice(module.heapBase, updateEnd)).toEqual(
      new Uint8Array(updateEnd - module.heapBase),
    )

    const output = new Uint8Array(32)
    const finalizeEnd =
      align8(module.heapBase) + hmacSha256StateSize + output.length
    state.digestInto(output)
    expect(output).toEqual(hmac(sha256, key, message))
    expect(module.view().slice(module.heapBase, finalizeEnd)).toEqual(
      new Uint8Array(finalizeEnd - module.heapBase),
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

  test('behavior: streams a large total input through bounded memory', async () => {
    const module =
      await internal.instantiate<hashes_internal.Exports>(wasmBase64)
    const state = hashes_internal.create(module, 'sha256')
    const expected = sha256.create()
    const chunk = input(64 * 1024)
    const memorySize = module.view().length

    for (let index = 0; index < 1024; index++) {
      state.update(chunk)
      expected.update(chunk)
    }

    expect(module.view().length).toBe(memorySize)
    expect(digest(state, 32)).toEqual(expected.digest())
  }, 60_000)

  test('behavior: consecutive calls do not corrupt each other', () => {
    const a = input(200)
    const b = input(7)
    expect(engine.keccak256(a)).toEqual(keccak_256(a))
    expect(engine.blake3(a)).toEqual(blake3(a))
    expect(engine.blake3(b)).toEqual(blake3(b))
    expect(engine.blake3(a)).toEqual(blake3(a))
    expect(engine.keccak256(b)).toEqual(keccak_256(b))
    expect(engine.keccak256(a)).toEqual(keccak_256(a))
  })

  test('behavior: results do not alias WASM memory', () => {
    const first = engine.keccak256(input(32))
    const snapshot = first.slice()
    engine.keccak256(input(64))
    expect(first).toEqual(snapshot)

    const blake3First = engine.blake3(input(32))
    const blake3Snapshot = blake3First.slice()
    engine.blake3(input(64))
    expect(blake3First).toEqual(blake3Snapshot)
  })
})

describe('Engine.install', () => {
  test('behavior: ox uses the WASM implementation once installed', async () => {
    await Engine.install({ Hash: engine })
    try {
      expect(Hash.blake3('0xdeadbeef')).toBe(
        '0x53147f3ce49ed4f60dfa5b9654c36ba6103c11f5737df3dabd4cbd296c4161bd',
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
    } finally {
      Engine.reset()
    }
  })
})
