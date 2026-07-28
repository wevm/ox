import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as core_Keystore from '../../core/Keystore.js'
import * as NodeKeystore from '../Keystore.js'

type Slot = Awaited<ReturnType<typeof NodeKeystore.engine>>

test('every implemented primitive is present', () => {
  expectTypeOf<Slot['aesCtrDecrypt']>().toEqualTypeOf<
    (key: Uint8Array, iv: Uint8Array, data: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['aesCtrEncrypt']>().toEqualTypeOf<
    (key: Uint8Array, iv: Uint8Array, data: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['pbkdf2Sha256']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { c: number; dkLen: number },
    ) => Uint8Array
  >()
  expectTypeOf<Slot['pbkdf2Sha256Async']>().toEqualTypeOf<
    (
      password: Uint8Array,
      salt: Uint8Array,
      options: { c: number; dkLen: number },
    ) => Promise<Uint8Array>
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Slot>().not.toHaveProperty('scrypt')
  expectTypeOf<Slot>().not.toHaveProperty('scryptAsync')
})

test('the result is the raw slot', () => {
  expectTypeOf<{ Keystore: Slot }>().toExtend<Engine.Engine>()
})

test('the Node namespace exposes the public Keystore API', () => {
  expectTypeOf(NodeKeystore.pbkdf2).toEqualTypeOf(core_Keystore.pbkdf2)
  expectTypeOf<typeof NodeKeystore>().not.toHaveProperty('create')
})
