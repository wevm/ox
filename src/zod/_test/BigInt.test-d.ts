import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_BigInt from '../BigInt.js'

test('BigInt schema preserves decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_BigInt.BigInt>>().toEqualTypeOf<bigint>()
  expectTypeOf<z.input<typeof z_BigInt.BigInt>>().toEqualTypeOf<core_Hex.Hex>()
})
