import type * as core_AccessList from '../../core/AccessList.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_AccessList from '../AccessList.js'

test('AccessList schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_AccessList.AccessList>
  >().toEqualTypeOf<core_AccessList.AccessList>()
  expectTypeOf<
    z.input<typeof z_AccessList.AccessList>
  >().toEqualTypeOf<core_AccessList.AccessList>()
})
