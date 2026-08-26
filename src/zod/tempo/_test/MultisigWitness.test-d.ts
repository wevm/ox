import type * as core_MultisigWitness from '../../../tempo/MultisigWitness.js'
import type * as z from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'
import * as z_MultisigWitness from '../MultisigWitness.js'

test('MultisigWitness decodes RPC witnesses', () => {
  expectTypeOf<core_MultisigWitness.Rpc>().toMatchTypeOf<
    z.input<typeof z_MultisigWitness.MultisigWitness>
  >()
  expectTypeOf<
    z.output<typeof z_MultisigWitness.MultisigWitness>
  >().toMatchTypeOf<core_MultisigWitness.MultisigWitness>()
})
