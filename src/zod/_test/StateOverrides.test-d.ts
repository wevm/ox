import type * as core_StateOverrides from '../../core/StateOverrides.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_StateOverrides from '../StateOverrides.js'

test('StateOverrides schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_StateOverrides.AccountStorage>
  >().toEqualTypeOf<core_StateOverrides.AccountStorage>()
  expectTypeOf<
    z.input<typeof z_StateOverrides.AccountStorage>
  >().toEqualTypeOf<core_StateOverrides.AccountStorage>()
  expectTypeOf<
    z.output<typeof z_StateOverrides.AccountOverrides>
  >().toEqualTypeOf<core_StateOverrides.AccountOverrides>()
  expectTypeOf<
    z.input<typeof z_StateOverrides.AccountOverrides>
  >().toEqualTypeOf<core_StateOverrides.RpcAccountOverrides>()
  expectTypeOf<
    z.output<typeof z_StateOverrides.StateOverrides>
  >().toEqualTypeOf<core_StateOverrides.StateOverrides>()
  expectTypeOf<
    z.input<typeof z_StateOverrides.StateOverrides>
  >().toEqualTypeOf<core_StateOverrides.Rpc>()
})
