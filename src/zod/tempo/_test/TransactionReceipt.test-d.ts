import type * as core_TransactionReceipt from '../../../tempo/TransactionReceipt.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TransactionReceipt from '../TransactionReceipt.js'

test('TransactionReceipt decodes RPC into a tempo receipt', () => {
  expectTypeOf<core_TransactionReceipt.Rpc>().toExtend<
    z.input<typeof z_TransactionReceipt.TransactionReceipt>
  >()
  expectTypeOf<core_TransactionReceipt.TransactionReceipt>().toExtend<
    z.output<typeof z_TransactionReceipt.TransactionReceipt>
  >()
})
