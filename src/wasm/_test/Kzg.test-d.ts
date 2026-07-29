import { expectTypeOf, test } from 'vp/test'
import type * as CoreKzg from '../../core/Kzg.js'
import { mainnet as trustedSetup } from '../../trusted-setups/Setups.js'
import * as Kzg from '../Kzg.js'

test('create returns a disposable Kzg.Kzg implementation', async () => {
  const instance = await Kzg.create({ trustedSetup })

  expectTypeOf(instance).toMatchTypeOf<CoreKzg.Kzg>()
  expectTypeOf<Kzg.create.ReturnType['dispose']>().toEqualTypeOf<() => void>()
})

test('trusted setup accepts packed bytes', () => {
  expectTypeOf<Kzg.TrustedSetup>().toEqualTypeOf<{
    readonly g1_lagrange: Uint8Array | readonly string[]
    readonly g1_monomial: Uint8Array | readonly string[]
    readonly g2_monomial: Uint8Array | readonly string[]
  }>()
})
