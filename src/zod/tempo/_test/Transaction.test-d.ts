import type * as core_Transaction from '../../../tempo/Transaction.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Transaction from '../Transaction.js'

test('Tempo decodes RPC into a tempo transaction', () => {
  expectTypeOf<
    z.output<typeof z_Transaction.Tempo>
  >().toMatchTypeOf<core_Transaction.Tempo>()
})
