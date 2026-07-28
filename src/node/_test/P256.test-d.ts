import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_P256 from '../../core/P256.js'
import * as NodeP256 from '../P256.js'

type Slot = Awaited<ReturnType<typeof NodeP256.engine>>

test('public-key derivation is present', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Slot>().not.toHaveProperty('getSharedSecret')
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
  expectTypeOf<Slot>().not.toHaveProperty('recoverPublicKey')
  expectTypeOf<Slot>().not.toHaveProperty('sign')
  expectTypeOf<Slot>().not.toHaveProperty('verify')
})

test('the result is the raw slot', () => {
  expectTypeOf<{ P256: Slot }>().toExtend<Engine.Engine>()
})

test('the Node namespace exposes the public P256 API', () => {
  expectTypeOf(NodeP256.getPublicKey).toEqualTypeOf(core_P256.getPublicKey)
  expectTypeOf<typeof NodeP256>().not.toHaveProperty('create')
})
