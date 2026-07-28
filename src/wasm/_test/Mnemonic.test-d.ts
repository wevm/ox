import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_Mnemonic from '../../core/Mnemonic.js'
import * as Mnemonic from '../Mnemonic.js'

type Slot = Awaited<ReturnType<typeof Mnemonic.engine>>

test('return type exposes Mnemonic.toSeed', () => {
  expectTypeOf<Slot['toSeed']>().toEqualTypeOf<
    NonNullable<Engine.Mnemonic['toSeed']>
  >()
})

test('the WASM namespace exposes the public Mnemonic API', () => {
  expectTypeOf(Mnemonic.toSeed).toEqualTypeOf(core_Mnemonic.toSeed)
  expectTypeOf<typeof Mnemonic>().not.toHaveProperty('create')
})
