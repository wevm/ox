import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as Mnemonic from '../Mnemonic.js'

type Created = Awaited<ReturnType<typeof Mnemonic.create>>

test('return type exposes Mnemonic.toSeed', () => {
  expectTypeOf<Created['Mnemonic']['toSeed']>().toEqualTypeOf<
    NonNullable<Engine.Mnemonic['toSeed']>
  >()
})
