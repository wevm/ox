import { MultisigWitness } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const rpc = {
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
} as const satisfies MultisigWitness.Rpc

describe('fromRpc', () => {
  test('behavior: converts numeric configuration versions to bigint', () => {
    expect(MultisigWitness.fromRpc(rpc)).toMatchInlineSnapshot(`
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
  })

  test('error: rejects unsafe numeric configuration versions', () => {
    expect(() =>
      MultisigWitness.fromRpc({
        ...rpc,
        config: {
          ...rpc.config,
          version: Number.MAX_SAFE_INTEGER + 1,
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigConfig.InvalidConfigError: Invalid native multisig config: version must be an unsigned 64-bit integer.]`,
    )
  })
})

describe('toRpc', () => {
  test('behavior: converts bigint configuration versions to numbers', () => {
    expect(
      MultisigWitness.toRpc(MultisigWitness.fromRpc(rpc)),
    ).toMatchInlineSnapshot(`
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
                "version": 2,
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
          "version": 1,
        },
      }
    `)
  })

  test('error: rejects versions that JSON cannot represent exactly', () => {
    const witness = MultisigWitness.fromRpc(rpc)
    expect(() =>
      MultisigWitness.toRpc({
        ...witness,
        config: {
          ...witness.config,
          version: BigInt(Number.MAX_SAFE_INTEGER) + 1n,
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Hex.IntegerOutOfRangeError: Number \`9007199254740992\` is not in safe unsigned integer range (\`0\` to \`9007199254740991\`)]`,
    )
  })
})
