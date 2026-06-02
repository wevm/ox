import type * as core_Tick from '../../../tempo/Tick.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Tick from '../Tick.js'

test('Tick schema preserves the tick type', () => {
  expectTypeOf<z.output<typeof z_Tick.Tick>>().toEqualTypeOf<core_Tick.Tick>()
})
