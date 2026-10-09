import type * as core_AccountOperation from '../../../tempo/AccountOperation.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_AccountOperation from '../AccountOperation.js'

test('operation schemas decode RPC operations', () => {
  expectTypeOf<core_AccountOperation.TransactionRpc>().toMatchTypeOf<
    z.input<typeof z_AccountOperation.TransactionOperation>
  >()
  expectTypeOf<
    z.output<typeof z_AccountOperation.TransactionOperation>
  >().toMatchTypeOf<core_AccountOperation.TransactionOperation>()

  expectTypeOf<core_AccountOperation.KeyAuthorizationRpc>().toMatchTypeOf<
    z.input<typeof z_AccountOperation.KeyAuthorizationOperation>
  >()
  expectTypeOf<
    z.output<typeof z_AccountOperation.KeyAuthorizationOperation>
  >().toMatchTypeOf<core_AccountOperation.KeyAuthorizationOperation>()

  expectTypeOf<core_AccountOperation.Rpc>().toMatchTypeOf<
    z.input<typeof z_AccountOperation.Operation>
  >()
  expectTypeOf<
    z.output<typeof z_AccountOperation.Operation>
  >().toMatchTypeOf<core_AccountOperation.Operation>()
})
