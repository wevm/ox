import type * as core_Authorization from '../../core/Authorization.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Authorization from '../Authorization.js'

test('Authorization schemas preserve decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Authorization.Unsigned>>().toEqualTypeOf<
    core_Authorization.Authorization<false>
  >()
  expectTypeOf<
    z.output<typeof z_Authorization.Signed>
  >().toEqualTypeOf<core_Authorization.Signed>()
  expectTypeOf<
    z.input<typeof z_Authorization.Signed>
  >().toEqualTypeOf<core_Authorization.Rpc>()
  expectTypeOf<
    z.output<typeof z_Authorization.Authorization>
  >().toEqualTypeOf<core_Authorization.Authorization>()
  expectTypeOf<
    z.output<typeof z_Authorization.List>
  >().toEqualTypeOf<core_Authorization.List>()
  expectTypeOf<
    z.output<typeof z_Authorization.ListSigned>
  >().toEqualTypeOf<core_Authorization.ListSigned>()
  expectTypeOf<
    z.input<typeof z_Authorization.ListSigned>
  >().toEqualTypeOf<core_Authorization.ListRpc>()
  expectTypeOf<
    z.output<typeof z_Authorization.Tuple>
  >().toEqualTypeOf<core_Authorization.Tuple>()
  expectTypeOf<
    z.output<typeof z_Authorization.TupleSigned>
  >().toEqualTypeOf<core_Authorization.TupleSigned>()
  expectTypeOf<
    z.output<typeof z_Authorization.TupleList>
  >().toEqualTypeOf<core_Authorization.TupleList>()
  expectTypeOf<
    z.output<typeof z_Authorization.TupleListSigned>
  >().toEqualTypeOf<core_Authorization.TupleListSigned>()
})
