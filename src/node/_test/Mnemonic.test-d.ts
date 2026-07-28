import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_Mnemonic from '../../core/Mnemonic.js'
import * as NodeMnemonic from '../Mnemonic.js'

type Slot = Awaited<ReturnType<typeof NodeMnemonic.engine>>

test('every implemented primitive is present', () => {
  expectTypeOf<Slot['toSeed']>().toEqualTypeOf<
    (mnemonic: string, passphrase?: string) => Uint8Array
  >()
})

test('the result is the raw slot', () => {
  expectTypeOf<{ Mnemonic: Slot }>().toExtend<Engine.Engine>()
})

test('the Node namespace exposes the public Mnemonic API', () => {
  expectTypeOf(NodeMnemonic.toSeed).toEqualTypeOf(core_Mnemonic.toSeed)
  expectTypeOf<typeof NodeMnemonic>().not.toHaveProperty('create')
})
