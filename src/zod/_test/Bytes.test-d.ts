import type * as core_Bytes from '../../core/Bytes.js'
import type * as core_Hex from '../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Bytes from '../Bytes.js'

test('Bytes schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Bytes.Bytes>
  >().toEqualTypeOf<core_Bytes.Bytes>()
  expectTypeOf<z.input<typeof z_Bytes.Bytes>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<
    z.output<typeof z_Bytes.Bytes32>
  >().toEqualTypeOf<core_Bytes.Bytes>()
  expectTypeOf<z.input<typeof z_Bytes.Bytes32>>().toEqualTypeOf<core_Hex.Hex>()
})
