import type * as core_BlockOverrides from '../../core/BlockOverrides.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_BlockOverrides from '../BlockOverrides.js'

test('BlockOverrides schema preserves decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_BlockOverrides.BlockOverrides>
  >().toEqualTypeOf<core_BlockOverrides.BlockOverrides>()
  expectTypeOf<
    z.input<typeof z_BlockOverrides.BlockOverrides>
  >().toEqualTypeOf<core_BlockOverrides.Rpc>()
})
