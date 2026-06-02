import type * as core_Address from '../../../core/Address.js'
import type * as core_TokenId from '../../../tempo/TokenId.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TokenId from '../TokenId.js'

test('TokenId schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_TokenId.TokenId>
  >().toEqualTypeOf<core_TokenId.TokenId>()
  expectTypeOf<
    z.output<typeof z_TokenId.address>
  >().toEqualTypeOf<core_TokenId.TokenId>()
  expectTypeOf<
    z.input<typeof z_TokenId.address>
  >().toEqualTypeOf<core_Address.Address>()
})
