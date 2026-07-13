import type * as core_Filter from '../../core/Filter.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Filter from '../Filter.js'

test('Filter schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Filter.Topic>
  >().toEqualTypeOf<core_Filter.Topic>()
  expectTypeOf<
    z.input<typeof z_Filter.Topic>
  >().toEqualTypeOf<core_Filter.Topic>()
  expectTypeOf<
    z.output<typeof z_Filter.Topics>
  >().toEqualTypeOf<core_Filter.Topics>()
  expectTypeOf<
    z.input<typeof z_Filter.Topics>
  >().toEqualTypeOf<core_Filter.Topics>()
  expectTypeOf<
    z.output<typeof z_Filter.Filter>
  >().toMatchTypeOf<core_Filter.Filter>()
  expectTypeOf<core_Filter.Rpc>().toMatchTypeOf<
    z.input<typeof z_Filter.Filter>
  >()
})
