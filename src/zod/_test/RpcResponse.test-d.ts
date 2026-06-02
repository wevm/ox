import type * as core_RpcResponse from '../../core/RpcResponse.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_RpcResponse from '../RpcResponse.js'

test('RpcResponse schemas preserve decoded and encoded types', () => {
  expectTypeOf<
    z.output<typeof z_RpcResponse.ErrorObject>
  >().toEqualTypeOf<core_RpcResponse.ErrorObject>()
  expectTypeOf<
    z.output<typeof z_RpcResponse.RpcResponse>
  >().toEqualTypeOf<core_RpcResponse.RpcResponse>()
})
