import { expectTypeOf, test } from 'vp/test'
import * as AccountSimulation from './AccountSimulation.js'

const rpc = {
  approvals: [
    {
      keyType: 'webAuthn',
      keyData: '0x0102030405',
      owner: '0x1111111111111111111111111111111111111111',
    },
  ],
  config:
    '0xf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d694111111111111111111111111111111111111111101',
} as const satisfies AccountSimulation.Rpc

test('fromRpc returns a domain spec', () => {
  const spec = AccountSimulation.fromRpc(rpc)

  expectTypeOf(spec).toEqualTypeOf<AccountSimulation.Spec>()
  expectTypeOf(spec.config.version).toEqualTypeOf<bigint>()
})

test('RPC specs use encoded configurations', () => {
  expectTypeOf<AccountSimulation.Rpc['config']>().toEqualTypeOf<`0x${string}`>()
})

test('toRpc returns an RPC spec', () => {
  expectTypeOf(
    AccountSimulation.toRpc(AccountSimulation.fromRpc(rpc)),
  ).toEqualTypeOf<AccountSimulation.Rpc>()
})
