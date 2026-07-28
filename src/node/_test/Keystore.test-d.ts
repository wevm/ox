import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as Keystore from '../Keystore.js'

type Created = Awaited<ReturnType<typeof Keystore.create>>

test('every implemented primitive is present', () => {
  expectTypeOf<Created['Keystore']['aesCtrDecrypt']>().toEqualTypeOf<
    (key: Uint8Array, iv: Uint8Array, data: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Keystore']['aesCtrEncrypt']>().toEqualTypeOf<
    (key: Uint8Array, iv: Uint8Array, data: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Keystore']['pbkdf2Sha256']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { c: number; dkLen: number },
    ) => Uint8Array
  >()
  expectTypeOf<Created['Keystore']['pbkdf2Sha256Async']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { c: number; dkLen: number },
    ) => Promise<Uint8Array>
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('scrypt')
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('scryptAsync')
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
