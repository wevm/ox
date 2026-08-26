import type * as core_MultisigConfig from '../../../tempo/MultisigConfig.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_MultisigConfig from '../MultisigConfig.js'

test('MultisigConfig decodes RPC configurations', () => {
  expectTypeOf<core_MultisigConfig.Rpc>().toMatchTypeOf<
    z.input<typeof z_MultisigConfig.MultisigConfig>
  >()
  expectTypeOf<
    z.output<typeof z_MultisigConfig.MultisigConfig>
  >().toMatchTypeOf<core_MultisigConfig.Config>()
})
