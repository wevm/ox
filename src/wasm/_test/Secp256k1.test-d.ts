import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_Secp256k1 from '../../core/Secp256k1.js'
import * as Secp256k1 from '../Secp256k1.js'

type Slot = Awaited<ReturnType<typeof Secp256k1.engine>>

test('return type exposes only deterministic Secp256k1 primitives', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.Ecdsa['getPublicKey']>
  >()
  expectTypeOf<Slot['getSharedSecret']>().toEqualTypeOf<
    NonNullable<Engine.Ecdsa['getSharedSecret']>
  >()
  expectTypeOf<Slot['recoverPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.Ecdsa['recoverPublicKey']>
  >()
  expectTypeOf<Slot['sign']>().toEqualTypeOf<
    NonNullable<Engine.Ecdsa['sign']>
  >()
  expectTypeOf<Slot['verify']>().toEqualTypeOf<
    NonNullable<Engine.Ecdsa['verify']>
  >()
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
})

test('the WASM namespace exposes the public Secp256k1 API', () => {
  expectTypeOf(Secp256k1.getPublicKey).toEqualTypeOf(
    core_Secp256k1.getPublicKey,
  )
  expectTypeOf(Secp256k1.randomPrivateKey).toEqualTypeOf(
    core_Secp256k1.randomPrivateKey,
  )
  expectTypeOf<typeof Secp256k1>().not.toHaveProperty('create')
})
