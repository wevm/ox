import { describe, expect, test } from 'vp/test'
import * as core_MultisigSimulation from '../../../tempo/MultisigSimulation.js'
import * as z_MultisigSimulation from '../MultisigSimulation.js'
import * as z from 'zod/mini'

const rpc = {
  account: '0xcccccccccccccccccccccccccccccccccccccccc',
  approvals: [
    {
      owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      type: 'primitive',
    },
    {
      spec: {
        account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        approvals: [
          {
            owner: '0xdddddddddddddddddddddddddddddddddddddddd',
          },
        ],
        config:
          '0xf83ba022222222222222222222222222222222222222222222222222222222222222220201d7d694dddddddddddddddddddddddddddddddddddddddd01',
      },
      type: 'multisig',
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

  test('error: rejects more than eight nested approvals', () => {
    expect(
      z.safeDecode(z_MultisigSimulation.Rpc, {
        ...rpc,
        approvals: [
          {
            ...rpc.approvals[1],
            spec: {
              ...rpc.approvals[1].spec,
              approvals: Array.from(
                { length: 9 },
                () => rpc.approvals[1].spec.approvals[0],
              ),
            },
          },
        ],
      }).success,
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
