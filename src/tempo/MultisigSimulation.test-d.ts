import { expectTypeOf, test } from 'vitest'
import * as MultisigSimulation from './MultisigSimulation.js'

const rpc = {
  account: '0x2222222222222222222222222222222222222222',
  approvals: [
    {
      owner: '0x1111111111111111111111111111111111111111',
      type: 'primitive',
    },
  ],
  config:
    '0xf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d694111111111111111111111111111111111111111101',
} as const satisfies MultisigSimulation.Rpc

test('fromRpc returns a domain spec', () => {
  const spec = MultisigSimulation.fromRpc(rpc)

  expectTypeOf(spec).toEqualTypeOf<MultisigSimulation.Spec>()
  expectTypeOf(spec.config.version).toEqualTypeOf<bigint>()
})

test('RPC specs use encoded configurations', () => {
  expectTypeOf<
    MultisigSimulation.Rpc['config']
  >().toEqualTypeOf<`0x${string}`>()
})

test('toRpc returns an RPC spec', () => {
  expectTypeOf(
    MultisigSimulation.toRpc(MultisigSimulation.fromRpc(rpc)),
  ).toEqualTypeOf<MultisigSimulation.Rpc>()
})
