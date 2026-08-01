import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_MlDsa44 from '../../core/MlDsa44.js'
import * as MlDsa44 from '../MlDsa44.js'

type Slot = Awaited<ReturnType<typeof MlDsa44.engine>>

test('return type exposes only deterministic MlDsa44 primitives', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.MlDsa['getPublicKey']>
  >()
  expectTypeOf<Slot['sign']>().toEqualTypeOf<
    NonNullable<Engine.MlDsa['sign']>
  >()
  expectTypeOf<Slot['verify']>().toEqualTypeOf<
    NonNullable<Engine.MlDsa['verify']>
  >()
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
})

test('the WASM namespace exposes the public MlDsa44 API', () => {
  expectTypeOf(MlDsa44.getPublicKey).toEqualTypeOf(core_MlDsa44.getPublicKey)
  expectTypeOf(MlDsa44.randomPrivateKey).toEqualTypeOf(
    core_MlDsa44.randomPrivateKey,
  )
  expectTypeOf(MlDsa44.sign).toEqualTypeOf(core_MlDsa44.sign)
  expectTypeOf(MlDsa44.verify).toEqualTypeOf(core_MlDsa44.verify)
})
