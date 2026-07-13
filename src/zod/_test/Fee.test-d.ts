import type * as core_Fee from '../../core/Fee.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Fee from '../Fee.js'

test('Fee schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Fee.FeeHistory>
  >().toEqualTypeOf<core_Fee.FeeHistory>()
  expectTypeOf<
    z.input<typeof z_Fee.FeeHistory>
  >().toEqualTypeOf<core_Fee.FeeHistoryRpc>()
  expectTypeOf<
    z.output<typeof z_Fee.FeeValuesLegacy>
  >().toEqualTypeOf<core_Fee.FeeValuesLegacy>()
  expectTypeOf<
    z.input<typeof z_Fee.FeeValuesLegacy>
  >().toEqualTypeOf<core_Fee.FeeValuesLegacyRpc>()
  expectTypeOf<
    z.output<typeof z_Fee.FeeValuesEip1559>
  >().toEqualTypeOf<core_Fee.FeeValuesEip1559>()
  expectTypeOf<
    z.input<typeof z_Fee.FeeValuesEip1559>
  >().toEqualTypeOf<core_Fee.FeeValuesEip1559Rpc>()
  expectTypeOf<
    z.output<typeof z_Fee.FeeValuesEip4844>
  >().toEqualTypeOf<core_Fee.FeeValuesEip4844>()
  expectTypeOf<
    z.input<typeof z_Fee.FeeValuesEip4844>
  >().toEqualTypeOf<core_Fee.FeeValuesEip4844Rpc>()
})
