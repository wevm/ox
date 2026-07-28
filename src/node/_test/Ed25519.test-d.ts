import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_Ed25519 from '../../core/Ed25519.js'
import * as NodeEd25519 from '../Ed25519.js'

type Slot = Awaited<ReturnType<typeof NodeEd25519.engine>>

test('every implemented primitive is present', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['sign']>().toEqualTypeOf<
    (payload: Uint8Array, privateKey: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['toMontgomerySecret']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
  expectTypeOf<Slot>().not.toHaveProperty('toMontgomery')
  expectTypeOf<Slot>().not.toHaveProperty('verify')
})

test('the result is the raw slot', () => {
  expectTypeOf<{ Ed25519: Slot }>().toExtend<Engine.Engine>()
})

test('the Node namespace exposes the public Ed25519 API', () => {
  expectTypeOf(NodeEd25519.getPublicKey).toEqualTypeOf(
    core_Ed25519.getPublicKey,
  )
  expectTypeOf<typeof NodeEd25519>().not.toHaveProperty('create')
})
