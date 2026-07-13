import type * as core_KeyAuthorization from '../../../tempo/KeyAuthorization.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_KeyAuthorization from '../KeyAuthorization.js'

test('KeyAuthorization decodes RPC into a signed key authorization', () => {
  expectTypeOf<core_KeyAuthorization.Rpc>().toMatchTypeOf<
    z.input<typeof z_KeyAuthorization.KeyAuthorization>
  >()
  expectTypeOf<
    z.output<typeof z_KeyAuthorization.KeyAuthorization>
  >().toMatchTypeOf<core_KeyAuthorization.Signed>()
})
