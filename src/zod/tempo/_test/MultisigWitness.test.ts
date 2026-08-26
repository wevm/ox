import { describe, expect, test } from 'vp/test'
import * as z from 'zod/mini'
import * as z_MultisigWitness from '../MultisigWitness.js'

const rpc = {
  account: '0xcccccccccccccccccccccccccccccccccccccccc',
  approvals: [
    {
      owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      type: 'primitive',
    },
    {
      type: 'multisig',
      witness: {
        account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        approvals: [
          {
            owner: '0xdddddddddddddddddddddddddddddddddddddddd',
          },
        ],
        config: {
          owners: [
            {
              owner: '0xdddddddddddddddddddddddddddddddddddddddd',
              weight: 1,
            },
          ],
          salt: '0x2222222222222222222222222222222222222222222222222222222222222222',
          threshold: 1,
          version: 2,
        },
      },
    },
  ],
  config: {
    owners: [
      {
        owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        weight: 1,
      },
      {
        owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        weight: 1,
      },
    ],
    salt: '0x1111111111111111111111111111111111111111111111111111111111111111',
    threshold: 2,
    version: 1,
  },
} as const

describe('MultisigWitness', () => {
  test('behavior: converts between RPC and domain witnesses', () => {
    const witness = z.decode(z_MultisigWitness.MultisigWitness, rpc)

    expect(witness).toMatchInlineSnapshot(`
      {
        "account": "0xcccccccccccccccccccccccccccccccccccccccc",
        "approvals": [
          {
            "owner": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "type": "primitive",
          },
          {
            "type": "multisig",
            "witness": {
              "account": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "approvals": [
                {
                  "owner": "0xdddddddddddddddddddddddddddddddddddddddd",
                },
              ],
              "config": {
                "owners": [
                  {
                    "owner": "0xdddddddddddddddddddddddddddddddddddddddd",
                    "weight": 1,
                  },
                ],
                "salt": "0x2222222222222222222222222222222222222222222222222222222222222222",
                "threshold": 1,
                "version": 2n,
              },
            },
          },
        ],
        "config": {
          "owners": [
            {
              "owner": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "weight": 1,
            },
            {
              "owner": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "weight": 1,
            },
          ],
          "salt": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "threshold": 2,
          "version": 1n,
        },
      }
    `)
    expect(z.encode(z_MultisigWitness.MultisigWitness, witness)).toStrictEqual(
      rpc,
    )
  })

  test('error: rejects more than eight root approvals', () => {
    expect(
      z.safeDecode(z_MultisigWitness.Rpc, {
        ...rpc,
        approvals: Array.from({ length: 9 }, () => rpc.approvals[0]),
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects more than eight nested approvals', () => {
    expect(
      z.safeDecode(z_MultisigWitness.Rpc, {
        ...rpc,
        approvals: [
          {
            ...rpc.approvals[1],
            witness: {
              ...rpc.approvals[1].witness,
              approvals: Array.from(
                { length: 9 },
                () => rpc.approvals[1].witness.approvals[0],
              ),
            },
          },
        ],
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects unsafe numeric configuration versions', () => {
    expect(
      z.safeDecode(z_MultisigWitness.Rpc, {
        ...rpc,
        config: {
          ...rpc.config,
          version: Number.MAX_SAFE_INTEGER + 1,
        },
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
