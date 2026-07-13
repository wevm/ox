import type * as core_Block from '../../core/Block.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_Block from '../Block.js'

test('Block schemas preserve decoded and encoded types', () => {
  expectTypeOf<z.output<typeof z_Block.Hash>>().toEqualTypeOf<core_Block.Hash>()
  expectTypeOf<
    z.output<typeof z_Block.Number>
  >().toEqualTypeOf<core_Block.Number>()
  expectTypeOf<z.output<typeof z_Block.Tag>>().toEqualTypeOf<core_Block.Tag>()
  expectTypeOf<
    z.output<typeof z_Block.Identifier>
  >().toMatchTypeOf<core_Block.Identifier>()
  expectTypeOf<z.input<typeof z_Block.Identifier>>().toMatchTypeOf<
    core_Block.Identifier<`0x${string}`>
  >()
  expectTypeOf<
    z.output<typeof z_Block.Block>
  >().toMatchTypeOf<core_Block.Block>()
  expectTypeOf<core_Block.Rpc<false>>().toMatchTypeOf<
    z.input<typeof z_Block.Block>
  >()
  expectTypeOf<z.output<typeof z_Block.WithTransactions>>().toMatchTypeOf<
    core_Block.Block<true>
  >()
  expectTypeOf<core_Block.Rpc<true>>().toMatchTypeOf<
    z.input<typeof z_Block.WithTransactions>
  >()
})
