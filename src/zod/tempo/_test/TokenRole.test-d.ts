import type * as core_TokenRole from '../../../tempo/TokenRole.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_TokenRole from '../TokenRole.js'

test('TokenRole schema preserves the role union', () => {
  expectTypeOf<
    z.output<typeof z_TokenRole.TokenRole>
  >().toEqualTypeOf<core_TokenRole.TokenRole>()
})
