import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Uint from '../Uint.js'

test('Uint schemas preserve decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Uint.Uint>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_Uint.Uint>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Uint.Uint48>>().toEqualTypeOf<number>()
  expectTypeOf<z.input<typeof z_Uint.Uint48>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Uint.Uint56>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_Uint.Uint56>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Uint.Uint256>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_Uint.Uint256>>().toEqualTypeOf<core_Hex.Hex>()
})
