import type * as core_TransactionRequest from '../../../tempo/TransactionRequest.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TransactionRequest from '../TransactionRequest.js'

test('TransactionRequest decodes RPC into a tempo transaction request', () => {
  expectTypeOf<core_TransactionRequest.Rpc>().toMatchTypeOf<
    z.input<typeof z_TransactionRequest.TransactionRequest>
  >()
  expectTypeOf<
    z.output<typeof z_TransactionRequest.TransactionRequest>
  >().toMatchTypeOf<core_TransactionRequest.TransactionRequest>()
})
