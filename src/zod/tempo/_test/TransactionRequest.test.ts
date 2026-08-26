import { describe, expect, test } from 'vp/test'
import * as core_TransactionRequest from '../../../tempo/TransactionRequest.js'
import * as z_TransactionRequest from '../TransactionRequest.js'
import * as z from 'zod/mini'

const rpc = {
  calls: [
    {
      data: '0xdeadbeef',
      to: '0xcafebabecafebabecafebabecafebabecafebabe',
      value: '0x9b6e64a8ec60000',
    },
  ],
  chainId: '0x1',
  feeToken: '0x20c0000000000000000000000000000000000000',
  from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
  maxFeePerGas: '0x2',
  type: '0x76',
} as const

describe('TransactionRequest', () => {
  test('decodes an rpc tempo transaction request', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    expect(decoded).toMatchObject({
      chainId: 1,
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      maxFeePerGas: 2n,
      type: 'tempo',
    })
    expect(decoded.calls).toEqual([
      {
        data: '0xdeadbeef',
        to: '0xcafebabecafebabecafebabecafebabecafebabe',
        value: 700000000000000000n,
      },
    ])
  })

  test('round-trips via encode', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    expect(z.encode(z_TransactionRequest.TransactionRequest, decoded)).toEqual(
      core_TransactionRequest.toRpc(decoded),
    )
  })

  test('capabilities and key hints round-trip', () => {
    const hints = {
      capabilities: { balanceDiffs: true },
      keyData: '0x0578',
      keyId: '0xcccccccccccccccccccccccccccccccccccccccc',
      keyType: 'webAuthn',
    } as const

    const decoded = z.decode(z_TransactionRequest.TransactionRequest, {
      ...rpc,
      ...hints,
    })
    expect(decoded).toMatchObject(hints)

    const encoded = z.encode(z_TransactionRequest.TransactionRequest, decoded)
    expect(encoded).toMatchObject(hints)
    expect(encoded).toEqual(core_TransactionRequest.toRpc(decoded))
  })

  test('multisig witness round-trips', () => {
    const witness = {
      account: '0xcccccccccccccccccccccccccccccccccccccccc',
      approvals: [
        {
          keyData: '0x0578',
          keyType: 'webAuthn',
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          type: 'primitive',
        },
        {
          type: 'multisig',
          witness: {
            account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            approvals: [
              {
                keyType: 'secp256k1',
                owner: '0xdddddddddddddddddddddddddddddddddddddddd',
              },
              {
                owner: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              },
            ],
            config: {
              owners: [
                {
                  owner: '0xdddddddddddddddddddddddddddddddddddddddd',
                  weight: 1,
                },
                {
                  owner: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                  weight: 1,
                },
              ],
              salt: '0x2222222222222222222222222222222222222222222222222222222222222222',
              threshold: 2,
              version: '0x2',
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
        version: '0x1',
      },
    } as const

    const decoded = z.decode(z_TransactionRequest.TransactionRequest, {
      ...rpc,
      multisigWitness: witness,
    })
    expect(decoded.multisigWitness).toMatchInlineSnapshot(`
      {
        "account": "0xcccccccccccccccccccccccccccccccccccccccc",
        "approvals": [
          {
            "keyData": "0x0578",
            "keyType": "webAuthn",
            "owner": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "type": "primitive",
          },
          {
            "type": "multisig",
            "witness": {
              "account": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "approvals": [
                {
                  "keyType": "secp256k1",
                  "owner": "0xdddddddddddddddddddddddddddddddddddddddd",
                },
                {
                  "owner": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                },
              ],
              "config": {
                "owners": [
                  {
                    "owner": "0xdddddddddddddddddddddddddddddddddddddddd",
                    "weight": 1,
                  },
                  {
                    "owner": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                    "weight": 1,
                  },
                ],
                "salt": "0x2222222222222222222222222222222222222222222222222222222222222222",
                "threshold": 2,
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

    const encoded = z.encode(z_TransactionRequest.TransactionRequest, decoded)
    expect(encoded.multisigWitness).toMatchInlineSnapshot(`
      {
        "account": "0xcccccccccccccccccccccccccccccccccccccccc",
        "approvals": [
          {
            "keyData": "0x0578",
            "keyType": "webAuthn",
            "owner": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "type": "primitive",
          },
          {
            "type": "multisig",
            "witness": {
              "account": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "approvals": [
                {
                  "keyType": "secp256k1",
                  "owner": "0xdddddddddddddddddddddddddddddddddddddddd",
                },
                {
                  "owner": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                },
              ],
              "config": {
                "owners": [
                  {
                    "owner": "0xdddddddddddddddddddddddddddddddddddddddd",
                    "weight": 1,
                  },
                  {
                    "owner": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                    "weight": 1,
                  },
                ],
                "salt": "0x2222222222222222222222222222222222222222222222222222222222222222",
                "threshold": 2,
                "version": "0x2",
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
          "version": "0x1",
        },
      }
    `)
    expect(encoded).toEqual(core_TransactionRequest.toRpc(decoded))
  })

  test('feeToken is withheld until the fee payer signs (TIP-76)', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    const pending = z.encode(z_TransactionRequest.TransactionRequest, {
      ...decoded,
      feePayer: true,
    })
    expect(pending.feeToken).toBeUndefined()
    expect(pending.feePayer).toBe(true)
  })

  test('rejects an invalid request', () => {
    expect(
      z.safeDecode(z_TransactionRequest.TransactionRequest, {
        chainId: 1,
      } as never).success,
    ).toBe(false)
  })
})

describe('MultisigWitnessRpc', () => {
  test('rejects more than eight root or nested approvals', () => {
    const config = {
      owners: [
        {
          owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          weight: 8,
        },
      ],
      salt: '0x1111111111111111111111111111111111111111111111111111111111111111',
      threshold: 8,
      version: '0x1',
    } as const
    const primitive = {
      owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      type: 'primitive',
    } as const

    expect(
      z.safeDecode(z_TransactionRequest.MultisigWitnessRpc, {
        account: '0xcccccccccccccccccccccccccccccccccccccccc',
        approvals: Array.from({ length: 9 }, () => primitive),
        config,
      }).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeDecode(z_TransactionRequest.MultisigWitnessRpc, {
        account: '0xcccccccccccccccccccccccccccccccccccccccc',
        approvals: [
          {
            type: 'multisig',
            witness: {
              account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
              approvals: Array.from({ length: 9 }, () => ({
                owner: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
              })),
              config,
            },
          },
        ],
        config,
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })
})

describe('TransactionRequestToRpc', () => {
  test('accepts numberish encode inputs', () => {
    const decoded = z.decode(z_TransactionRequest.TransactionRequest, rpc)
    const strict = z.encode(z_TransactionRequest.TransactionRequest, decoded)

    // numberish: bigint quantities as `number`/hex, calls value as `number`
    expect(
      z.encode(z_TransactionRequest.TransactionRequestToRpc, {
        ...decoded,
        maxFeePerGas: 2,
        calls: [
          {
            data: '0xdeadbeef',
            to: '0xcafebabecafebabecafebabecafebabecafebabe',
            value: 700000000000000000n,
          },
        ],
      }),
    ).toEqual(strict)

    expect(
      z.encode(z_TransactionRequest.TransactionRequestToRpc, {
        ...decoded,
        maxFeePerGas: '0x2',
      }),
    ).toEqual(strict)
  })
})
