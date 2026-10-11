import type * as core_AccountConfig from '../../../tempo/AccountConfig.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_AccountConfig from '../AccountConfig.js'

test('AccountConfig decodes RPC configurations', () => {
  expectTypeOf<core_AccountConfig.Rpc>().toMatchTypeOf<
    z.input<typeof z_AccountConfig.AccountConfig>
  >()
  expectTypeOf<
    z.output<typeof z_AccountConfig.AccountConfig>
  >().toMatchTypeOf<core_AccountConfig.Config>()
})
