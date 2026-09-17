import { describe, expect, test } from 'vp/test'
import * as core_MultisigSimulation from '../../../tempo/MultisigSimulation.js'
import * as z_MultisigSimulation from '../MultisigSimulation.js'
import * as z from 'zod/mini'

const rpc = {
  approvals: [
    {
      keyType: 'webAuthn',
      keyData: '0x0005',
      owner: '0x1111111111111111111111111111111111111111',
    },
  ],
  config:
    '0xf852a011111111111111111111111111111111111111111111111111111111111111110102eed694aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01d694bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb01',
} as const satisfies core_MultisigSimulation.Rpc

describe('MultisigSimulation', () => {
  test('behavior: converts between RPC and domain specs', () => {
    const spec = z.decode(z_MultisigSimulation.MultisigSimulation, rpc)

    expect(spec).toEqual(core_MultisigSimulation.fromRpc(rpc))
    expect(
      z.encode(z_MultisigSimulation.MultisigSimulation, spec),
    ).toStrictEqual(rpc)
  })

  test('error: rejects more than eight root approvals', () => {
    expect(
      z.safeDecode(z_MultisigSimulation.Rpc, {
        ...rpc,
        approvals: Array.from({ length: 9 }, () => rpc.approvals[0]),
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })
  test('error: rejects nested approvals', () => {
    expect(
      z.safeDecode(z_MultisigSimulation.Rpc, {
        ...rpc,
        approvals: [{ type: 'multisig', spec: rpc }],
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects malformed encoded configurations', () => {
    expect(
      z.safeDecode(z_MultisigSimulation.Rpc, {
        ...rpc,
        config: '0x01',
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
