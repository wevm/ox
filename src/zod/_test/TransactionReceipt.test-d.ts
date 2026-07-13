import type * as core_TransactionReceipt from '../../core/TransactionReceipt.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TransactionReceipt from '../TransactionReceipt.js'

test('TransactionReceipt schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_TransactionReceipt.Status>
  >().toEqualTypeOf<core_TransactionReceipt.Status>()
  expectTypeOf<
    z.input<typeof z_TransactionReceipt.Status>
  >().toEqualTypeOf<core_TransactionReceipt.RpcStatus>()
  expectTypeOf<
    z.output<typeof z_TransactionReceipt.Type>
  >().toMatchTypeOf<core_TransactionReceipt.Type>()
  expectTypeOf<
    z.input<typeof z_TransactionReceipt.Type>
  >().toMatchTypeOf<core_TransactionReceipt.RpcType>()
  expectTypeOf<
    z.output<typeof z_TransactionReceipt.TransactionReceipt>
  >().toMatchTypeOf<core_TransactionReceipt.TransactionReceipt>()
  expectTypeOf<core_TransactionReceipt.Rpc>().toMatchTypeOf<
    z.input<typeof z_TransactionReceipt.TransactionReceipt>
  >()
})
