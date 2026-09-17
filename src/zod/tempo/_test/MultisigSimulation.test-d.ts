import type * as core_MultisigSimulation from '../../../tempo/MultisigSimulation.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_MultisigSimulation from '../MultisigSimulation.js'

test('MultisigSimulation decodes RPC specs', () => {
  expectTypeOf<core_MultisigSimulation.Rpc>().toMatchTypeOf<
    z.input<typeof z_MultisigSimulation.MultisigSimulation>
  >()
  expectTypeOf<
    z.output<typeof z_MultisigSimulation.MultisigSimulation>
  >().toMatchTypeOf<core_MultisigSimulation.Spec>()
})
