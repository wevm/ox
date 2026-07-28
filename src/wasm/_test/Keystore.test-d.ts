import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as WasmKeystore from '../Keystore.js'

type Created = Awaited<ReturnType<typeof WasmKeystore.create>>

test('synchronous PBKDF2 is present', () => {
  expectTypeOf<Created['Keystore']['pbkdf2Sha256']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { c: number; dkLen: number },
    ) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('aesCtrDecrypt')
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('aesCtrEncrypt')
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('pbkdf2Sha256Async')
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('scrypt')
  expectTypeOf<Created['Keystore']>().not.toHaveProperty('scryptAsync')
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
