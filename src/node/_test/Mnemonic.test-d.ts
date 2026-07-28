import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as Mnemonic from '../Mnemonic.js'

type Created = Awaited<ReturnType<typeof Mnemonic.create>>

test('every implemented primitive is present', () => {
  expectTypeOf<Created['Mnemonic']['toSeed']>().toEqualTypeOf<
    (mnemonic: string, passphrase?: string) => Uint8Array
  >()
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
