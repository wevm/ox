import type * as core_Transaction from '../../core/Transaction.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Transaction from '../Transaction.js'

test('Transaction schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Transaction.Base>
  >().toEqualTypeOf<core_Transaction.Base>()
  expectTypeOf<
    z.input<typeof z_Transaction.Base>
  >().toEqualTypeOf<core_Transaction.BaseRpc>()
  expectTypeOf<
    z.output<typeof z_Transaction.Legacy>
  >().toEqualTypeOf<core_Transaction.Legacy>()
  expectTypeOf<
    z.input<typeof z_Transaction.Legacy>
  >().toEqualTypeOf<core_Transaction.LegacyRpc>()
  expectTypeOf<
    z.output<typeof z_Transaction.Eip1559>
  >().toEqualTypeOf<core_Transaction.Eip1559>()
  expectTypeOf<
    z.input<typeof z_Transaction.Eip1559>
  >().toEqualTypeOf<core_Transaction.Eip1559Rpc>()
  expectTypeOf<
    z.output<typeof z_Transaction.Eip2930>
  >().toEqualTypeOf<core_Transaction.Eip2930>()
  expectTypeOf<
    z.input<typeof z_Transaction.Eip2930>
  >().toEqualTypeOf<core_Transaction.Eip2930Rpc>()
  expectTypeOf<
    z.output<typeof z_Transaction.Eip4844>
  >().toEqualTypeOf<core_Transaction.Eip4844>()
  expectTypeOf<
    z.input<typeof z_Transaction.Eip4844>
  >().toEqualTypeOf<core_Transaction.Eip4844Rpc>()
  expectTypeOf<
    z.output<typeof z_Transaction.Eip7702>
  >().toEqualTypeOf<core_Transaction.Eip7702>()
  expectTypeOf<
    z.input<typeof z_Transaction.Eip7702>
  >().toEqualTypeOf<core_Transaction.Eip7702Rpc>()
  expectTypeOf<
    z.output<typeof z_Transaction.Transaction>
  >().toMatchTypeOf<core_Transaction.Transaction>()
  expectTypeOf<core_Transaction.Rpc>().toMatchTypeOf<
    z.input<typeof z_Transaction.Transaction>
  >()
})
