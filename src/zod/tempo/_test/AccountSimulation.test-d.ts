import type * as core_AccountSimulation from '../../../tempo/AccountSimulation.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_AccountSimulation from '../AccountSimulation.js'

test('AccountSimulation decodes RPC specs', () => {
  expectTypeOf<core_AccountSimulation.Rpc>().toMatchTypeOf<
    z.input<typeof z_AccountSimulation.AccountSimulation>
  >()
  expectTypeOf<
    z.output<typeof z_AccountSimulation.AccountSimulation>
  >().toMatchTypeOf<core_AccountSimulation.Spec>()
})
