import { pbkdf2 as pbkdf2_noble } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { beforeAll, describe, expect, test } from 'vp/test'
import * as Bytes from '../../core/Bytes.js'
import * as Engine from '../../core/Engine.js'
import * as Keystore from '../../core/Keystore.js'
import * as WasmKeystore from '../Keystore.js'
import * as hashes from '../internal/hashes.js'
import { wasmBase64 } from '../internal/hashes.wasm.js'
import * as internal from '../internal/instantiate.js'
import * as pbkdf2 from '../internal/pbkdf2.js'

let engine: WasmKeystore.engine.ReturnType

beforeAll(async () => {
  engine = await WasmKeystore.engine()
})

function input(size: number) {
  return new Uint8Array(size).map((_, index) => (index * 37 + 11) & 0xff)
}

describe('engine', () => {
  test('default', async () => {
    expect(Object.keys(await WasmKeystore.engine())).toMatchInlineSnapshot(`
      [
        "pbkdf2Sha256",
      ]
    `)
  })

  test('behavior: shares the compiled hashes instance', async () => {
    const [a, b] = await Promise.all([hashes.load(), hashes.load()])
    expect(a).toBe(b)
  })

  test('behavior: hands every caller its own engine', async () => {
    const [a, b] = await Promise.all([
      WasmKeystore.engine(),
      WasmKeystore.engine(),
    ])
    expect(a).not.toBe(b)

    a.pbkdf2Sha256 = () => new Uint8Array([9])
    const c = await WasmKeystore.engine()
    expect(c.pbkdf2Sha256(input(8), input(16), { c: 2, dkLen: 33 })).toEqual(
      b.pbkdf2Sha256(input(8), input(16), { c: 2, dkLen: 33 }),
    )
  })
})

const cases = [
  { c: 1, dkLen: 1, password: 0, salt: 0 },
  { c: 2, dkLen: 31, password: 1, salt: 51 },
  { c: 3, dkLen: 32, password: 63, salt: 52 },
  { c: 4, dkLen: 33, password: 64, salt: 55 },
  { c: 7, dkLen: 64, password: 65, salt: 64 },
  { c: 2, dkLen: 65, password: 129, salt: 137 },
] as const

describe('pbkdf2Sha256', () => {
  test.each(cases)(
    'matches the default for password=$password salt=$salt c=$c dkLen=$dkLen',
    ({ c, dkLen, password: passwordLength, salt: saltLength }) => {
      const password = input(passwordLength)
      const salt = input(saltLength)
      expect(engine.pbkdf2Sha256(password, salt, { c, dkLen })).toEqual(
        pbkdf2_noble(sha256, password, salt, { c, dkLen }),
      )
    },
  )

  test('behavior: reads non-zero-offset views without mutating their backing buffers', () => {
    const passwordBacking = new Uint8Array(80).fill(0xa5)
    const saltBacking = new Uint8Array(90).fill(0x5a)
    const password = passwordBacking.subarray(7, 72)
    const salt = saltBacking.subarray(11, 63)
    password.set(input(password.length))
    salt.set(input(salt.length))
    const passwordSnapshot = passwordBacking.slice()
    const saltSnapshot = saltBacking.slice()

    expect(engine.pbkdf2Sha256(password, salt, { c: 3, dkLen: 65 })).toEqual(
      pbkdf2_noble(sha256, password, salt, { c: 3, dkLen: 65 }),
    )
    expect(passwordBacking).toEqual(passwordSnapshot)
    expect(saltBacking).toEqual(saltSnapshot)
  })

  test('behavior: results are fresh and never alias WASM memory', () => {
    const password = input(65)
    const salt = input(52)
    const first = engine.pbkdf2Sha256(password, salt, {
      c: 2,
      dkLen: 65,
    })
    const snapshot = first.slice()
    const second = engine.pbkdf2Sha256(input(5), input(9), {
      c: 3,
      dkLen: 97,
    })

    expect(first).not.toBe(second)
    expect(first).toEqual(snapshot)
  })

  test('behavior: clears passwords, salts, outputs, and scratch', async () => {
    const module = await internal.instantiate<hashes.Exports>(wasmBase64)
    const password = input(65)
    const salt = input(52)
    const stack = module.view().slice(0, module.heapBase)

    expect(
      pbkdf2.pbkdf2Sha256(module, password, salt, { c: 3, dkLen: 65 }),
    ).toEqual(pbkdf2_noble(sha256, password, salt, { c: 3, dkLen: 65 }))
    expect(module.view().slice(0, module.heapBase)).toEqual(stack)
    expect(module.view().slice(module.heapBase)).toEqual(
      new Uint8Array(module.view().length - module.heapBase),
    )
  })

  test('behavior: clears the complete region after a late trap', async () => {
    const module = await internal.instantiate<hashes.Exports>(wasmBase64)
    const password = input(65)
    const salt = input(52)
    const exports: pbkdf2.Exports = {
      pbkdf2_sha256(...parameters) {
        module.exports.pbkdf2_sha256(...parameters)
        throw new WebAssembly.RuntimeError('forced late trap')
      },
      zero: (ptr, length) => module.exports.zero(ptr, length),
    }

    expect(() =>
      pbkdf2.pbkdf2Sha256({ ...module, exports }, password, salt, {
        c: 3,
        dkLen: 65,
      }),
    ).toThrow(WebAssembly.RuntimeError)
    expect(module.view().slice(module.heapBase)).toEqual(
      new Uint8Array(module.view().length - module.heapBase),
    )
  })

  test('behavior: rejects a workspace that overflows wasm32 before growing memory', async () => {
    const module = await internal.instantiate<hashes.Exports>(wasmBase64)
    const memory = module.view().length

    expect(() =>
      pbkdf2.pbkdf2Sha256(module, new Uint8Array(), new Uint8Array(), {
        c: 1,
        dkLen: 0xffff_ffff,
      }),
    ).toThrow(internal.MemoryError)
    expect(module.view()).toHaveLength(memory)
  })

  test.each([
    { name: 'c', options: { c: 0, dkLen: 32 } },
    { name: 'c', options: { c: 1.5, dkLen: 32 } },
    { name: 'c', options: { c: 0x1_0000_0000, dkLen: 32 } },
    { name: 'dkLen', options: { c: 1, dkLen: 0 } },
    { name: 'dkLen', options: { c: 1, dkLen: 1.5 } },
    { name: 'dkLen', options: { c: 1, dkLen: 0x1_0000_0000 } },
  ])('behavior: rejects invalid $name before entering WASM', ({ options }) => {
    expect(() => engine.pbkdf2Sha256(input(8), input(16), options)).toThrow()
  })
})

describe('Engine.install', () => {
  test('behavior: ox uses synchronous WASM PBKDF2 once installed', async () => {
    await Engine.install({ Keystore: engine })
    try {
      const salt = input(32)
      const [key] = Keystore.pbkdf2({
        iterations: 1_000,
        password: 'testpassword',
        salt,
      })
      expect(key()).toBe(
        Bytes.toHex(
          pbkdf2_noble(sha256, Bytes.fromString('testpassword'), salt, {
            c: 1_000,
            dkLen: 32,
          }),
        ),
      )
    } finally {
      Engine.reset()
    }
  })
})
