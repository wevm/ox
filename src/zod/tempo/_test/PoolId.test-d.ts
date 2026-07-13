import type * as core_Hex from '../../../core/Hex.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_PoolId from '../PoolId.js'

test('PoolId schema preserves hex type', () => {
  expectTypeOf<z.output<typeof z_PoolId.PoolId>>().toEqualTypeOf<core_Hex.Hex>()
})
