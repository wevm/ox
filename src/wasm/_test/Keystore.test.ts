import { pbkdf2 as pbkdf2_noble } from '@noble/hashes/pbkdf2.js'
import { scrypt as scrypt_noble } from '@noble/hashes/scrypt.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { beforeAll, describe, expect, test } from 'vp/test'
import * as Bytes from '../../core/Bytes.js'
import * as Engine from '../../core/Engine.js'
import * as Keystore from '../../core/Keystore.js'
import * as WasmKeystore from '../Keystore.js'
import * as hashes from '../internal/hashes.js'
import { wasmBase64 as hashesWasmBase64 } from '../internal/hashes.wasm.js'
import * as internal from '../internal/instantiate.js'
import * as pbkdf2 from '../internal/pbkdf2.js'
import * as scrypt from '../internal/scrypt.js'
import { wasmBase64 as scryptWasmBase64 } from '../internal/scrypt.wasm.js'

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
        "scrypt",
      ]
    `)
  })

  test('behavior: shares the compiled hashes instance', async () => {
    const [a, b] = await Promise.all([hashes.load(), hashes.load()])
    expect(a).toBe(b)
  })

  test('behavior: shares the compiled scrypt instance', async () => {
    const [a, b] = await Promise.all([scrypt.load(), scrypt.load()])
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
    const module = await internal.instantiate<hashes.Exports>(hashesWasmBase64)
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
    const module = await internal.instantiate<hashes.Exports>(hashesWasmBase64)
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
    const module = await internal.instantiate<hashes.Exports>(hashesWasmBase64)
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

const scryptCases = [
  { N: 16, dkLen: 64, p: 1, password: 0, r: 1, salt: 0 },
  { N: 1024, dkLen: 32, p: 1, password: 8, r: 1, salt: 16 },
  { N: 1024, dkLen: 64, p: 1, password: 65, r: 8, salt: 52 },
  { N: 1024, dkLen: 33, p: 2, password: 9, r: 4, salt: 17 },
] as const

describe('scrypt', () => {
  test.each(scryptCases)(
    'matches the default for password=$password salt=$salt N=$N r=$r p=$p dkLen=$dkLen',
    ({ N, dkLen, p, password: passwordLength, r, salt: saltLength }) => {
      const password = input(passwordLength)
      const salt = input(saltLength)
      const options = { N, dkLen, p, r }
      expect(engine.scrypt(password, salt, options)).toEqual(
        scrypt_noble(password, salt, options),
      )
    },
  )

  test.each([
    {
      N: 16,
      expected:
        '0x77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906',
      p: 1,
      password: '',
      r: 1,
      salt: '',
    },
    {
      N: 1024,
      expected:
        '0xfdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640',
      p: 16,
      password: 'password',
      r: 8,
      salt: 'NaCl',
    },
    {
      N: 16_384,
      expected:
        '0x7023bdcb3afd7348461c06cd81fd38ebfda8fbba904f8e3ea9b543f6545da1f2d5432955613f0fcf62d49705242a9af9e61e85dc0d651e40dfcf017b45575887',
      p: 1,
      password: 'pleaseletmein',
      r: 8,
      salt: 'SodiumChloride',
    },
  ])(
    'matches the RFC 7914 vector for N=$N r=$r p=$p',
    ({ N, expected, p, password, r, salt }) => {
      expect(
        Bytes.toHex(
          engine.scrypt(Bytes.fromString(password), Bytes.fromString(salt), {
            N,
            dkLen: 64,
            p,
            r,
          }),
        ),
      ).toBe(expected)
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
    const options = { N: 1024, dkLen: 65, p: 2, r: 1 }

    expect(engine.scrypt(password, salt, options)).toEqual(
      scrypt_noble(password, salt, options),
    )
    expect(passwordBacking).toEqual(passwordSnapshot)
    expect(saltBacking).toEqual(saltSnapshot)
  })

  test('behavior: results are fresh and never alias WASM memory', () => {
    const first = engine.scrypt(input(65), input(52), {
      N: 16,
      dkLen: 65,
      p: 1,
      r: 1,
    })
    const snapshot = first.slice()
    const second = engine.scrypt(input(5), input(9), {
      N: 32,
      dkLen: 97,
      p: 1,
      r: 1,
    })

    expect(first).not.toBe(second)
    expect(first).toEqual(snapshot)
  })

  test('behavior: clears inputs, outputs, and every workspace', async () => {
    const module = await internal.instantiate<scrypt.Exports>(scryptWasmBase64)
    const password = input(65)
    const salt = input(52)
    const options = { N: 16, dkLen: 65, p: 2, r: 2 }
    const stack = module.view().slice(0, module.heapBase)

    expect(scrypt.derive(module, password, salt, options)).toEqual(
      scrypt_noble(password, salt, options),
    )
    expect(module.view().slice(0, module.heapBase)).toEqual(stack)
    expect(module.view().slice(module.heapBase)).toEqual(
      new Uint8Array(module.view().length - module.heapBase),
    )
  })

  test('behavior: clears the complete region after a late trap', async () => {
    const module = await internal.instantiate<scrypt.Exports>(scryptWasmBase64)
    const password = input(65)
    const salt = input(52)
    const exports: scrypt.Exports = {
      scrypt(...parameters) {
        module.exports.scrypt(...parameters)
        throw new WebAssembly.RuntimeError('forced late trap')
      },
      zero: (ptr, length) => module.exports.zero(ptr, length),
    }

    expect(() =>
      scrypt.derive({ ...module, exports }, password, salt, {
        N: 16,
        dkLen: 65,
        p: 2,
        r: 2,
      }),
    ).toThrow(WebAssembly.RuntimeError)
    expect(module.view().slice(module.heapBase)).toEqual(
      new Uint8Array(module.view().length - module.heapBase),
    )
  })

  test('behavior: rejects the workspace limit before growing memory', async () => {
    const module = await internal.instantiate<scrypt.Exports>(scryptWasmBase64)
    const memory = module.view().length

    expect(() =>
      scrypt.derive(module, new Uint8Array(), new Uint8Array(), {
        N: 1_048_576,
        dkLen: 32,
        p: 1,
        r: 16,
      }),
    ).toThrow(
      '"maxmem" limit was hit: memUsed(128*r*(N+p+1))=2147487744, maxmem=1073742848',
    )
    expect(module.view()).toHaveLength(memory)
  })

  test('behavior: rejects the WASM memory limit before growing memory', async () => {
    const module = await internal.instantiate<scrypt.Exports>(scryptWasmBase64)
    const memory = module.view().length

    expect(() =>
      scrypt.derive(module, new Uint8Array(), new Uint8Array(), {
        N: 2,
        dkLen: 1_074_790_400,
        p: 1,
        r: 1,
      }),
    ).toThrow(internal.MemoryError)
    expect(module.view()).toHaveLength(memory)
  })

  test('behavior: rejects reentrant use of one instance without corrupting the outer call', async () => {
    const module = await internal.instantiate<scrypt.Exports>(scryptWasmBase64)
    const password = input(8)
    const salt = input(16)
    const options = { N: 16, dkLen: 32, p: 1, r: 1 }
    let reentered = false
    const wrapper: internal.Module<scrypt.Exports> = {
      ...module,
      exports: {
        scrypt(...parameters) {
          expect(() => scrypt.derive(wrapper, password, salt, options)).toThrow(
            'The scrypt WASM instance is already deriving a key.',
          )
          reentered = true
          module.exports.scrypt(...parameters)
        },
        zero: (ptr, length) => module.exports.zero(ptr, length),
      },
    }

    expect(scrypt.derive(wrapper, password, salt, options)).toEqual(
      scrypt_noble(password, salt, options),
    )
    expect(reentered).toBe(true)
  })

  test.each([
    { N: 1, dkLen: 32, p: 1, r: 8 },
    { N: 3, dkLen: 32, p: 1, r: 8 },
    { N: 1024.5, dkLen: 32, p: 1, r: 8 },
    { N: 1024, dkLen: 32, p: 1, r: -1 },
    { N: 1024, dkLen: 32, p: 0, r: 8 },
    { N: 1024, dkLen: 0, p: 1, r: 8 },
    { N: 1024, dkLen: 32, p: 1, r: 0 },
  ])(
    'behavior: matches the default error for N=$N r=$r p=$p dkLen=$dkLen',
    (options) => {
      const getError = (fn: () => unknown) => {
        try {
          fn()
        } catch (error) {
          return {
            message: (error as Error).message,
            name: (error as Error).constructor.name,
          }
        }
        throw new Error('Expected derivation to throw.')
      }

      expect(
        getError(() => engine.scrypt(input(8), input(16), options)),
      ).toEqual(getError(() => scrypt_noble(input(8), input(16), options)))
    },
  )
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

  test('behavior: ox uses synchronous WASM scrypt once installed', async () => {
    const wasm = engine.scrypt
    let calls = 0
    await Engine.install({
      Keystore: {
        ...engine,
        scrypt(...parameters) {
          calls++
          return wasm(...parameters)
        },
      },
    })
    try {
      const salt = input(32)
      const [key] = Keystore.scrypt({
        n: 1024,
        p: 2,
        password: 'testpassword',
        r: 1,
        salt,
      })
      expect(key()).toBe(
        Bytes.toHex(
          scrypt_noble(Bytes.fromString('testpassword'), salt, {
            N: 1024,
            dkLen: 32,
            p: 2,
            r: 1,
          }),
        ),
      )
      expect(calls).toBe(1)

      await Keystore.scryptAsync({
        n: 1024,
        p: 1,
        password: 'testpassword',
        r: 1,
        salt,
      })
      expect(calls).toBe(1)
    } finally {
      Engine.reset()
    }
  })
})
