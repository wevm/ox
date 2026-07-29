import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as core_Keystore from '../../core/Keystore.js'
import * as WasmKeystore from '../Keystore.js'

type Slot = Awaited<ReturnType<typeof WasmKeystore.engine>>

test('synchronous PBKDF2 is present', () => {
  expectTypeOf<Slot['pbkdf2Sha256']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { c: number; dkLen: number },
    ) => Uint8Array
  >()
})

test('synchronous scrypt is present', () => {
  expectTypeOf<Slot['scrypt']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { N: number; dkLen: number; p: number; r: number },
    ) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Slot>().not.toHaveProperty('aesCtrDecrypt')
  expectTypeOf<Slot>().not.toHaveProperty('aesCtrEncrypt')
  expectTypeOf<Slot>().not.toHaveProperty('pbkdf2Sha256Async')
  expectTypeOf<Slot>().not.toHaveProperty('scryptAsync')
})

test('the result is the raw slot', () => {
  expectTypeOf<{ Keystore: Slot }>().toExtend<Engine.Engine>()
})

test('the WASM namespace exposes the public Keystore API', () => {
  expectTypeOf(WasmKeystore.pbkdf2).toEqualTypeOf(core_Keystore.pbkdf2)
  expectTypeOf<typeof WasmKeystore>().not.toHaveProperty('create')
})
