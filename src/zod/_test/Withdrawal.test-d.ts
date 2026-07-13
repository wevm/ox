import type * as core_Withdrawal from '../../core/Withdrawal.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Withdrawal from '../Withdrawal.js'

test('Withdrawal schema preserves decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Withdrawal.Withdrawal>
  >().toEqualTypeOf<core_Withdrawal.Withdrawal>()
  expectTypeOf<
    z.input<typeof z_Withdrawal.Withdrawal>
  >().toEqualTypeOf<core_Withdrawal.Rpc>()
})
