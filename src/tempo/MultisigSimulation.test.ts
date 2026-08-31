import { MultisigConfig, MultisigSimulation } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const config =
  '0xf852a011111111111111111111111111111111111111111111111111111111111111118002eed694111111111111111111111111111111111111111101d694bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb01' as const
const nestedConfig =
  '0xf83ba022222222222222222222222222222222222222222222222222222222222222220101d7d694222222222222222222222222222222222222222201' as const
const rpc = {
  account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  approvals: [
    {
      keyData: '0x0102030405',
      keyType: 'webAuthn',
      owner: '0x1111111111111111111111111111111111111111',
      type: 'primitive',
    },
    {
      spec: {
        account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        approvals: [
          {
            keyData: '0x010203040506',
            keyType: 'secp256k1',
            owner: '0x2222222222222222222222222222222222222222',
          },
        ],
        config: nestedConfig,
      },
      type: 'multisig',
    },
  ],
  config,
} as const satisfies MultisigSimulation.Rpc

describe('fromRpc', () => {
  test('behavior: decodes root and nested configurations', () => {
    expect(MultisigSimulation.fromRpc(rpc)).toMatchInlineSnapshot(`
      {
        "account": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "approvals": [
          {
            "keyData": "0x0102030405",
            "keyType": "webAuthn",
            "owner": "0x1111111111111111111111111111111111111111",
            "type": "primitive",
          },
          {
            "spec": {
              "account": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "approvals": [
                {
                  "keyData": "0x010203040506",
                  "keyType": "secp256k1",
                  "owner": "0x2222222222222222222222222222222222222222",
                },
              ],
              "config": {
                "owners": [
                  {
                    "owner": "0x2222222222222222222222222222222222222222",
                    "weight": 1,
                  },
                ],
                "salt": "0x2222222222222222222222222222222222222222222222222222222222222222",
                "threshold": 1,
                "version": 1n,
              },
            },
            "type": "multisig",
          },
        ],
        "config": {
          "owners": [
            {
              "owner": "0x1111111111111111111111111111111111111111",
              "weight": 1,
            },
            {
              "owner": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "weight": 1,
            },
          ],
          "salt": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "threshold": 2,
          "version": 0n,
        },
      }
    `)
  })

  test('behavior: preserves the maximum uint64 configuration version', () => {
    const config =
      '0xf843a0000000000000000000000000000000000000000000000000000000000000000088ffffffffffffffff01d7d694111111111111111111111111111111111111111101' as const

    expect(
      MultisigSimulation.fromRpc({ ...rpc, approvals: [], config }).config
        .version,
    ).toMatchInlineSnapshot(`18446744073709551615n`)
  })

  test('error: rejects excess root approvals', () => {
    expect(() =>
      MultisigSimulation.fromRpc({
        ...rpc,
        approvals: Array.from({ length: 9 }, () => rpc.approvals[0]),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: approval count exceeds 8.]`,
    )
  })

  test('error: rejects excess nested approvals', () => {
    expect(() =>
      MultisigSimulation.fromRpc({
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
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: approval count exceeds 8.]`,
    )
  })

  test('error: rejects trailing configuration bytes', () => {
    expect(() =>
      MultisigSimulation.fromRpc({ ...rpc, config: `${config}00` }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: noncanonical config encoding.]`,
    )
  })

  test('error: rejects malformed configuration RLP', () => {
    expect(() =>
      MultisigSimulation.fromRpc({ ...rpc, config: '0xf8' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Cursor.PositionOutOfBoundsError: Position \`1\` is out of bounds (\`0 < position < 1\`).]`,
    )
  })

  test('error: rejects a non-list configuration', () => {
    expect(() =>
      MultisigSimulation.fromRpc({ ...rpc, config: '0x01' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: invalid config encoding.]`,
    )
  })

  test('error: rejects noncanonical configuration integers', () => {
    const noncanonical = config
      .replace('0xf852', '0xf853')
      .replace('118002', '11810002') as `0x${string}`

    expect(() =>
      MultisigSimulation.fromRpc({ ...rpc, config: noncanonical }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: invalid config encoding.]`,
    )
  })
})

describe('toRpc', () => {
  test('behavior: encodes configurations and shims long key data', () => {
    expect(
      MultisigSimulation.toRpc(MultisigSimulation.fromRpc(rpc)),
    ).toMatchInlineSnapshot(`
      {
        "account": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "approvals": [
          {
            "keyData": "0x0005",
            "keyType": "webAuthn",
            "owner": "0x1111111111111111111111111111111111111111",
            "type": "primitive",
          },
          {
            "spec": {
              "account": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "approvals": [
                {
                  "keyData": "0x0006",
                  "keyType": "secp256k1",
                  "owner": "0x2222222222222222222222222222222222222222",
                },
              ],
              "config": "${nestedConfig}",
            },
            "type": "multisig",
          },
        ],
        "config": "${config}",
      }
    `)
  })

  test('behavior: preserves short key data', () => {
    const spec = MultisigSimulation.fromRpc({
      ...rpc,
      approvals: [{ ...rpc.approvals[0], keyData: '0x0102' }],
    })

    expect(MultisigSimulation.toRpc(spec).approvals).toMatchInlineSnapshot(`
      [
        {
          "keyData": "0x0102",
          "keyType": "webAuthn",
          "owner": "0x1111111111111111111111111111111111111111",
          "type": "primitive",
        },
      ]
    `)
  })

  test('behavior: encodes the maximum uint64 configuration version', () => {
    const spec = MultisigSimulation.fromRpc(rpc)

    expect(
      MultisigSimulation.toRpc({
        ...spec,
        approvals: [],
        config: MultisigConfig.from({
          owners: [
            {
              owner: '0x1111111111111111111111111111111111111111',
              weight: 1,
            },
          ],
          threshold: 1,
          version: MultisigConfig.maxVersion,
        }),
      }).config,
    ).toMatchInlineSnapshot(
      `"0xf843a0000000000000000000000000000000000000000000000000000000000000000088ffffffffffffffff01d7d694111111111111111111111111111111111111111101"`,
    )
  })

  test('error: rejects excess root approvals', () => {
    const spec = MultisigSimulation.fromRpc(rpc)

    expect(() =>
      MultisigSimulation.toRpc({
        ...spec,
        approvals: Array.from({ length: 9 }, () => spec.approvals[0]!),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: approval count exceeds 8.]`,
    )
  })

  test('error: rejects excess nested approvals', () => {
    const spec = MultisigSimulation.fromRpc(rpc)
    const nested = spec.approvals[1]!
    if (nested.type !== 'multisig') throw new Error('unreachable')

    expect(() =>
      MultisigSimulation.toRpc({
        ...spec,
        approvals: [
          {
            ...nested,
            spec: {
              ...nested.spec,
              approvals: Array.from(
                { length: 9 },
                () => nested.spec.approvals[0]!,
              ),
            },
          },
        ],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigSimulation.InvalidSimulationError: Invalid multisig simulation: approval count exceeds 8.]`,
    )
  })
})
