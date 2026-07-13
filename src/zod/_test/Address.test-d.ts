import type * as core_Address from '../../core/Address.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Address from '../Address.js'

test('Address schema preserves decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Address.Address>
  >().toEqualTypeOf<core_Address.Address>()
  expectTypeOf<
    z.input<typeof z_Address.Address>
  >().toEqualTypeOf<core_Address.Address>()
})
