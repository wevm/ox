import type * as core_MultisigOperation from '../../../tempo/MultisigOperation.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_MultisigOperation from '../MultisigOperation.js'

test('operation schemas decode RPC operations', () => {
  expectTypeOf<core_MultisigOperation.TransactionRpc>().toMatchTypeOf<
    z.input<typeof z_MultisigOperation.TransactionOperation>
  >()
  expectTypeOf<
    z.output<typeof z_MultisigOperation.TransactionOperation>
  >().toMatchTypeOf<core_MultisigOperation.TransactionOperation>()

  expectTypeOf<core_MultisigOperation.KeyAuthorizationRpc>().toMatchTypeOf<
    z.input<typeof z_MultisigOperation.KeyAuthorizationOperation>
  >()
  expectTypeOf<
    z.output<typeof z_MultisigOperation.KeyAuthorizationOperation>
  >().toMatchTypeOf<core_MultisigOperation.KeyAuthorizationOperation>()

  expectTypeOf<core_MultisigOperation.Rpc>().toMatchTypeOf<
    z.input<typeof z_MultisigOperation.Operation>
  >()
  expectTypeOf<
    z.output<typeof z_MultisigOperation.Operation>
  >().toMatchTypeOf<core_MultisigOperation.Operation>()
})
