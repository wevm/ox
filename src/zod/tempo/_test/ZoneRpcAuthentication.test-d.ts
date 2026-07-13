import type * as core_ZoneRpcAuthentication from '../../../tempo/ZoneRpcAuthentication.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_ZoneRpcAuthentication from '../ZoneRpcAuthentication.js'

test('Signed validates a signed Zone RPC authentication token', () => {
  expectTypeOf<core_ZoneRpcAuthentication.Signed>().toExtend<
    z.output<typeof z_ZoneRpcAuthentication.Signed>
  >()
})

test('serialized decodes a serialized token into a signed token', () => {
  expectTypeOf<core_ZoneRpcAuthentication.Signed>().toExtend<
    z.output<typeof z_ZoneRpcAuthentication.serialized>
  >()
})
