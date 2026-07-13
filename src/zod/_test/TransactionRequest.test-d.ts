import type * as core_TransactionRequest from '../../core/TransactionRequest.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TransactionRequest from '../TransactionRequest.js'

test('TransactionRequest schema preserves decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_TransactionRequest.TransactionRequest>
  >().toEqualTypeOf<core_TransactionRequest.TransactionRequest>()
  expectTypeOf<
    z.input<typeof z_TransactionRequest.TransactionRequest>
  >().toEqualTypeOf<core_TransactionRequest.Rpc>()
})
