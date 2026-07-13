import type * as core_TypedData from '../../core/TypedData.js'
import { expectTypeOf, test } from 'vp/test'
import * as z_TypedData from '../TypedData.js'
import type * as z from 'zod/mini'

test('TypedData schemas output Ox core TypedData types', () => {
  expectTypeOf<z.output<typeof z_TypedData.Domain>>().toMatchTypeOf<{
    chainId?: number | bigint | undefined
    name?: string | undefined
    salt?: string | undefined
    verifyingContract?: core_TypedData.Domain['verifyingContract'] | undefined
    version?: string | undefined
  }>()
  expectTypeOf<
    z.output<typeof z_TypedData.Parameter>
  >().toMatchTypeOf<core_TypedData.Parameter>()
  expectTypeOf<
    z.output<typeof z_TypedData.TypedData>
  >().toMatchTypeOf<core_TypedData.TypedData>()
})
