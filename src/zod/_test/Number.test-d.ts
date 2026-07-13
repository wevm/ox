import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Number from '../Number.js'

test('Number schema preserves decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Number.Number>>().toEqualTypeOf<number>()
  expectTypeOf<z.input<typeof z_Number.Number>>().toEqualTypeOf<core_Hex.Hex>()
})
