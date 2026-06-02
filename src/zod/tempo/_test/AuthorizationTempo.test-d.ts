import type * as core_AuthorizationTempo from '../../../tempo/AuthorizationTempo.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_AuthorizationTempo from '../AuthorizationTempo.js'

test('Signed decodes RPC into a signed AA authorization', () => {
  expectTypeOf<core_AuthorizationTempo.Signed>().toExtend<
    z.output<typeof z_AuthorizationTempo.Signed>
  >()
})
