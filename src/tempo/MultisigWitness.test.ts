import { MultisigWitness } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const rpc = {
  account: '0xcccccccccccccccccccccccccccccccccccccccc',
  approvals: [
    {
      keyData: '0x0102030405',
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
            keyData: '0x010203040506',
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
            "keyData": "0x0102030405",
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
                  "keyData": "0x010203040506",
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

  test('error: rejects excess root approvals', () => {
    expect(() =>
      MultisigWitness.fromRpc({
        ...rpc,
        approvals: Array.from({ length: 9 }, () => rpc.approvals[0]),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigWitness.InvalidWitnessError: Invalid multisig witness: approval count exceeds 8.]`,
    )
  })

  test('error: rejects excess nested approvals', () => {
    expect(() =>
      MultisigWitness.fromRpc({
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
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigWitness.InvalidWitnessError: Invalid multisig witness: approval count exceeds 8.]`,
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
            "keyData": "0x0005",
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
                  "keyData": "0x0006",
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

  test('error: rejects excess root approvals', () => {
    const witness = MultisigWitness.fromRpc(rpc)
    expect(() =>
      MultisigWitness.toRpc({
        ...witness,
        approvals: Array.from({ length: 9 }, () => witness.approvals[0]!),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigWitness.InvalidWitnessError: Invalid multisig witness: approval count exceeds 8.]`,
    )
  })

  test('error: rejects excess nested approvals', () => {
    const witness = MultisigWitness.fromRpc(rpc)
    const nested = witness.approvals[1]!
    if (nested.type !== 'multisig') throw new Error('unreachable')
    expect(() =>
      MultisigWitness.toRpc({
        ...witness,
        approvals: [
          {
            ...nested,
            witness: {
              ...nested.witness,
              approvals: Array.from(
                { length: 9 },
                () => nested.witness.approvals[0]!,
              ),
            },
          },
        ],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigWitness.InvalidWitnessError: Invalid multisig witness: approval count exceeds 8.]`,
    )
  })
})
