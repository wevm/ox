import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Hash from '../Hash.js'

test('Hash schema preserves decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Hash.Hash>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<z.input<typeof z_Hash.Hash>>().toEqualTypeOf<core_Hex.Hex>()
})
