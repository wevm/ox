import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Int from '../Int.js'

test('Int schemas preserve decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Int.Int>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_Int.Int>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Int.Int48>>().toEqualTypeOf<number>()
  expectTypeOf<z.input<typeof z_Int.Int48>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Int.Int56>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_Int.Int56>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.output<typeof z_Int.Int256>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_Int.Int256>>().toEqualTypeOf<core_Hex.Hex>()
})
