import type * as core_Signature from '../../core/Signature.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Signature from '../Signature.js'

test('Signature schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_Signature.Signature>
  >().toEqualTypeOf<core_Signature.Signature>()
  expectTypeOf<
    z.input<typeof z_Signature.Signature>
  >().toEqualTypeOf<core_Signature.Rpc>()
  expectTypeOf<
    z.output<typeof z_Signature.Legacy>
  >().toEqualTypeOf<core_Signature.Legacy>()
  expectTypeOf<
    z.input<typeof z_Signature.Legacy>
  >().toEqualTypeOf<core_Signature.LegacyRpc>()
  expectTypeOf<
    z.output<typeof z_Signature.Tuple>
  >().toEqualTypeOf<core_Signature.Tuple>()
  expectTypeOf<
    z.input<typeof z_Signature.Tuple>
  >().toEqualTypeOf<core_Signature.Tuple>()
})
