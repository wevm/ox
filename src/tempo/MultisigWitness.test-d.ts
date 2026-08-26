import { expectTypeOf, test } from 'vitest'
import * as MultisigWitness from './MultisigWitness.js'

const rpc = {
  account: '0x2222222222222222222222222222222222222222',
  approvals: [
    {
      owner: '0x1111111111111111111111111111111111111111',
      type: 'primitive',
    },
  ],
  config: {
    owners: [
      {
        owner: '0x1111111111111111111111111111111111111111',
        weight: 1,
      },
    ],
    salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
    threshold: 1,
    version: 0,
  },
} as const satisfies MultisigWitness.Rpc

test('fromRpc returns a domain witness', () => {
  const witness = MultisigWitness.fromRpc(rpc)

  expectTypeOf(witness).toEqualTypeOf<MultisigWitness.MultisigWitness>()
  expectTypeOf(witness.config.version).toEqualTypeOf<bigint>()
})

test('RPC witnesses use numeric configuration versions', () => {
  expectTypeOf<
    MultisigWitness.Rpc['config']['version']
  >().toEqualTypeOf<number>()
})

test('toRpc returns an RPC witness', () => {
  expectTypeOf(
    MultisigWitness.toRpc(MultisigWitness.fromRpc(rpc)),
  ).toEqualTypeOf<MultisigWitness.Rpc>()
})
