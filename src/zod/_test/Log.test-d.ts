import type * as core_Log from '../../core/Log.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Log from '../Log.js'

test('Log schemas preserve decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Log.Log>>().toEqualTypeOf<core_Log.Log>()
  expectTypeOf<z.input<typeof z_Log.Log>>().toEqualTypeOf<core_Log.Rpc>()
  expectTypeOf<z.output<typeof z_Log.Pending>>().toEqualTypeOf<
    core_Log.Log<true>
  >()
  expectTypeOf<z.input<typeof z_Log.Pending>>().toEqualTypeOf<
    core_Log.Rpc<true>
  >()
})
