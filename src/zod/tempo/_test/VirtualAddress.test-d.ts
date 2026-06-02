import type * as core_Address from '../../../core/Address.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_VirtualAddress from '../VirtualAddress.js'

test('VirtualAddress schemas preserve decoded types', () => {
  expectTypeOf<
    z.output<typeof z_VirtualAddress.VirtualAddress>
  >().toEqualTypeOf<core_Address.Address>()
  expectTypeOf<
    z.output<typeof z_VirtualAddress.from>
  >().toEqualTypeOf<core_Address.Address>()
})
