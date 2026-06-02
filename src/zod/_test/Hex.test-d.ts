import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Hex from '../Hex.js'

test('Hex schemas preserve decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Hex.Hex>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.input<typeof z_Hex.Hex>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Hex.Hex32>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.input<typeof z_Hex.Hex32>>().toEqualTypeOf<core_Hex.Hex>()
})
